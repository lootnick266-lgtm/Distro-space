#!/usr/bin/env python3
"""Exercise repository NetworkPolicies in disposable namespaces, never production."""
import argparse
import copy
import json
from pathlib import Path
import shlex
import signal
import subprocess
import sys
import time
import uuid

from check import CheckError, load_documents

ROOT = Path(__file__).resolve().parents[1]
LABEL = 'security.distro-space/test-run'
SUITE = 'security.distro-space/test-suite'

# A tiny TCP listener fixture, not a copy of the application or its data.
CONFIG = """pid /tmp/nginx.pid;
error_log /dev/stderr warn;
worker_processes 1;
events { worker_connections 32; }
http {
 access_log off;
 client_body_temp_path /tmp/body;
 proxy_temp_path /tmp/proxy;
 fastcgi_temp_path /tmp/fastcgi;
 uwsgi_temp_path /tmp/uwsgi;
 scgi_temp_path /tmp/scgi;
 server {
  listen 80;
  listen 443;
  listen 9000;
  listen 3306;
  listen 8080;
  return 200 "fixture";
 }
}
"""

FIXTURES = {
    'nginx': ('app', {'app': 'nginx'}),
    'php': ('app', {'app': 'php'}),
    'db': ('app', {'app': 'db'}),
    'vkbot': ('app', {'app': 'vkbot'}),
    'unknown': ('app', {'app': 'unknown'}),
    'traefik': ('ingress', {'app.kubernetes.io/name': 'traefik'}),
    'nginx-exporter': ('monitoring', {'app': 'nginx-exporter'}),
    'mysql-exporter': ('monitoring', {'app': 'mysql-exporter'}),
    'blackbox': ('monitoring', {'app': 'blackbox-exporter'}),
    'alertmanager': ('monitoring', {'app.kubernetes.io/name': 'alertmanager'}),
    'wrong-namespace': ('monitoring', {'app': 'php', 'app.kubernetes.io/name': 'traefik'}),
}

CASES = [
    ('traefik', 'nginx', 80, True),
    ('nginx-exporter', 'nginx', 80, True),
    ('blackbox', 'nginx', 80, True),
    ('nginx', 'php', 9000, True),
    ('php', 'db', 3306, True),
    ('mysql-exporter', 'db', 3306, True),
    ('blackbox', 'db', 3306, True),
    ('alertmanager', 'vkbot', 8080, True),
    ('nginx', 'db', 3306, False),
    ('nginx', 'php', 8080, False),
    ('php', 'nginx', 80, False),
    ('php', 'vkbot', 8080, False),
    ('db', 'nginx-exporter', 80, False),
    ('vkbot', 'nginx-exporter', 443, False),
    ('unknown', 'db', 3306, False),
    ('unknown', 'nginx', 80, False),
    ('blackbox', 'php', 9000, False),
    ('alertmanager', 'nginx', 80, False),
    ('wrong-namespace', 'db', 3306, False),
    ('wrong-namespace', 'nginx', 80, False),
]


def clone_policy(document, namespaces):
    policy = copy.deepcopy(document)
    if policy.get('kind') != 'NetworkPolicy' or policy.get('metadata', {}).get('namespace') != 'distro-space':
        raise CheckError('Only application NetworkPolicy sources are supported')
    policy['metadata']['namespace'] = namespaces['app']
    for direction, field in [('ingress', 'from'), ('egress', 'to')]:
        for rule in policy['spec'].get(direction, []):
            for peer in rule.get(field, []):
                labels = peer.get('namespaceSelector', {}).get('matchLabels', {})
                name = labels.get('kubernetes.io/metadata.name')
                # Keep the actual CoreDNS peer; all application/ingress/monitoring peers are isolated.
                dns = peer.get('podSelector', {}).get('matchLabels', {}).get('k8s-app') == 'kube-dns'
                replacements = {'distro-space': namespaces['app'], 'monitoring': namespaces['monitoring'],
                                'kube-system': namespaces['ingress']}
                if name in replacements and not dns:
                    labels['kubernetes.io/metadata.name'] = replacements[name]
    return policy


def fixture(name, namespace, labels, image, run_id):
    command = "printf '%s' " + shlex.quote(CONFIG) + " > /tmp/nginx.conf; exec nginx -c /tmp/nginx.conf -g 'daemon off;'"
    return {
        'apiVersion': 'v1', 'kind': 'Pod',
        'metadata': {'name': name, 'namespace': namespace, 'labels': {**labels, LABEL: run_id}},
        'spec': {
            'automountServiceAccountToken': False, 'restartPolicy': 'Never',
            'activeDeadlineSeconds': 900, 'terminationGracePeriodSeconds': 1,
            'securityContext': {'runAsUser': 65532, 'runAsGroup': 65532, 'fsGroup': 65532,
                                'runAsNonRoot': True, 'seccompProfile': {'type': 'RuntimeDefault'},
                                'sysctls': [{'name': 'net.ipv4.ip_unprivileged_port_start', 'value': '0'}]},
            'containers': [{
                'name': 'fixture', 'image': image, 'imagePullPolicy': 'Never',
                'command': ['sh', '-ec', command],
                'securityContext': {'allowPrivilegeEscalation': False, 'readOnlyRootFilesystem': True,
                                    'capabilities': {'drop': ['ALL']}},
                'resources': {'requests': {'cpu': '2m', 'memory': '8Mi'},
                              'limits': {'cpu': '100m', 'memory': '32Mi'}},
                'volumeMounts': [{'name': 'tmp', 'mountPath': '/tmp'}],
                'readinessProbe': {'tcpSocket': {'port': 80}, 'periodSeconds': 2},
            }],
            'volumes': [{'name': 'tmp', 'emptyDir': {'sizeLimit': '8Mi'}}],
        },
    }


def connection_result(result):
    # kubectl/exec failure must never count as evidence of a network block.
    if result.returncode != 0:
        raise CheckError('kubectl exec failed; cannot classify network result')
    value = result.stdout.strip()
    if value not in {'OPEN', 'BLOCKED'}:
        raise CheckError('Unexpected probe output; cannot classify network result')
    return value == 'OPEN'


class Suite:
    def __init__(self, image):
        self.image = image
        self.run_id = uuid.uuid4().hex[:10]
        prefix = 'netpol-test-' + self.run_id
        self.namespaces = {key: prefix + '-' + key for key in ['app', 'monitoring', 'ingress']}
        self.created = []
        self.addresses = {}

    def command(self, args, document=None, timeout=45):
        try:
            result = subprocess.run(['kubectl', '--request-timeout=20s', *args],
                                    input=json.dumps(document) if document else None,
                                    capture_output=True, text=True, timeout=timeout)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise CheckError('kubectl unavailable or timed out') from exc
        if result.returncode:
            raise CheckError('kubectl operation failed: ' + ' '.join(args[:3]) + '; check cluster access and pod state')
        return result.stdout

    def create_namespace(self, name):
        doc = {'apiVersion': 'v1', 'kind': 'Namespace',
               'metadata': {'name': name, 'labels': {LABEL: self.run_id, SUITE: 'networkpolicy'}}}
        data = json.loads(self.command(['create', '-f', '-', '-o', 'json'], doc))
        self.created.append((name, data['metadata']['uid']))

    def prepare(self):
        for name in self.namespaces.values():
            self.create_namespace(name)
        docs = []
        for name, (role, labels) in FIXTURES.items():
            docs.append(fixture(name, self.namespaces[role], labels, self.image, self.run_id))
        self.command(['create', '-f', '-'], {'apiVersion': 'v1', 'kind': 'List', 'items': docs})
        for namespace in self.namespaces.values():
            self.command(['-n', namespace, 'wait', '--for=condition=Ready', 'pod',
                          '-l', LABEL + '=' + self.run_id, '--timeout=90s'], timeout=100)
            pods = json.loads(self.command(['-n', namespace, 'get', 'pods', '-o', 'json']))['items']
            for pod in pods:
                self.addresses[pod['metadata']['name']] = pod['status']['podIP']

    def connect(self, source, destination, port):
        namespace = self.namespaces[FIXTURES[source][0]]
        # Destination and port are positional args, not shell source.
        probe = 'if nc -z -w 2 "$1" "$2" >/dev/null 2>&1; then echo OPEN; else echo BLOCKED; fi'
        try:
            result = subprocess.run(
                ['kubectl', '--request-timeout=15s', '-n', namespace, 'exec', source,
                 '--', 'sh', '-c', probe, 'probe', self.addresses[destination], str(port)],
                capture_output=True, text=True, timeout=20)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise CheckError('Probe transport failed, not proof of a network block') from exc
        return connection_result(result)

    def apply_policies(self):
        docs = []
        for filename in ['networkpolicy-allow.yaml', 'networkpolicy-default-deny.yaml']:
            path = ROOT / 'k3s/base' / filename
            docs += [clone_policy(d, self.namespaces) for d in load_documents(path.read_text(), str(path))]
        if len(docs) != 6:
            raise CheckError('Expected six application policies; review security test coverage after changing policies')
        self.command(['-n', self.namespaces['app'], 'create', '-f', '-'],
                     {'apiVersion': 'v1', 'kind': 'List', 'items': docs})
        time.sleep(5)

    def test(self):
        print('Temporary namespaces: ' + ', '.join(self.namespaces.values()), flush=True)
        self.prepare()
        # Every negative case must have a live listener and working route before policies.
        for source, target, port, _ in CASES:
            if not self.connect(source, target, port):
                raise CheckError(f'Baseline unreachable: {source} -> {target}:{port}; no block result is valid')
        print(f'PASS baseline: all {len(CASES)} paths reachable before policy installation', flush=True)
        self.apply_policies()
        failures = []
        for source, target, port, allowed in CASES:
            # Require two fresh blocked connections for each negative case.
            results = [self.connect(source, target, port) for _ in range(1 if allowed else 2)]
            ok = all(result == allowed for result in results)
            label = f'{source} -> {target}:{port} expected ' + ('ALLOW' if allowed else 'DENY')
            print(('PASS ' if ok else 'FAIL ') + label, flush=True)
            if not ok:
                failures.append(label)
        for name, (role, _) in FIXTURES.items():
            if role == 'app':
                self.command(['-n', self.namespaces['app'], 'exec', name, '--',
                              'nslookup', 'kubernetes.default.svc.cluster.local'])
        print('PASS DNS from all five application fixtures', flush=True)
        if failures:
            raise CheckError(f'{len(failures)} policy expectations failed')
        print('PASS isolated NetworkPolicy suite; public HTTPS/VK, hostNetwork, NodePort and IPv6 not tested', flush=True)

    def cleanup(self):
        errors = []
        for name, uid in reversed(self.created):
            try:
                current = json.loads(self.command(['get', 'namespace', name, '-o', 'json']))
                if (current['metadata']['uid'] != uid
                        or current['metadata'].get('labels', {}).get(LABEL) != self.run_id):
                    raise CheckError('Namespace ownership changed; refusing deletion')
                self.command(['delete', 'namespace', name, '--wait=false'])
            except CheckError:
                errors.append(name)
        for name, _ in self.created:
            if name not in errors:
                try:
                    self.command(['wait', '--for=delete', 'namespace/' + name, '--timeout=60s'], timeout=70)
                except CheckError:
                    errors.append(name)
        if errors:
            raise CheckError('Cleanup incomplete; inspect only these test namespaces: ' + ', '.join(errors))
        print('PASS cleanup: temporary namespaces removed', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image', default='distro-nginx:1.9',
                        help='Locally imported image with nginx, sh, nc and nslookup; never pulled')
    args = parser.parse_args()
    suite = Suite(args.image)
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(130))
    code = 0
    try:
        suite.test()
    except (CheckError, KeyboardInterrupt) as exc:
        print('FAIL ' + str(exc), flush=True)
        code = 1
    finally:
        try:
            suite.cleanup()
        except CheckError as exc:
            print('FAIL ' + str(exc), flush=True)
            code = 1
    return code


if __name__ == '__main__':
    sys.exit(main())
