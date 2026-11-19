#!/usr/bin/env python3
"""Read-only smoke checks against the running Distro-space k3s cluster."""
import argparse
from datetime import datetime, timezone
import json
import math
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request


class HealthError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise HealthError(message)


def nodes_ready(items):
    require(items, 'No nodes returned')
    for node in items:
        name = node['metadata']['name']
        conditions = {x['type']: x['status'] for x in node.get('status', {}).get('conditions', [])}
        require(conditions.get('Ready') == 'True', f'{name}: node not Ready')
        for kind in ['MemoryPressure', 'DiskPressure', 'PIDPressure']:
            require(conditions.get(kind) == 'False', f'{name}: {kind} not False')


def pods_ready(items):
    active = []
    for pod in items:
        if pod.get('metadata', {}).get('deletionTimestamp'):
            continue
        status = pod.get('status', {})
        if status.get('phase') == 'Succeeded':
            continue
        name = pod['metadata']['name']
        require(status.get('phase') == 'Running', f'{name}: pod not Running')
        require(any(c['type'] == 'Ready' and c['status'] == 'True'
                    for c in status.get('conditions', [])), f'{name}: pod not Ready')
        containers = status.get('containerStatuses', [])
        require(containers and all(c.get('ready') for c in containers), f'{name}: containers not ready')
        active.append(pod)
    require(active, 'No active pods returned')
    return active


def workloads_ready(items):
    require(items, 'No workload controllers returned')
    for resource in items:
        name = resource['metadata']['name']
        status, spec = resource.get('status', {}), resource['spec']
        require(status.get('observedGeneration', 0) >= resource['metadata'].get('generation', 1),
                f'{name}: controller has not observed latest generation')
        if resource['kind'] == 'DaemonSet':
            desired = status.get('desiredNumberScheduled', 0)
            require(desired > 0 and status.get('numberReady', 0) == desired
                    and status.get('updatedNumberScheduled', 0) == desired,
                    f'{name}: DaemonSet not fully ready/updated')
        else:
            desired = spec.get('replicas', 1)
            require(desired > 0 and status.get('readyReplicas', 0) == desired
                    and status.get('updatedReplicas', 0) == desired,
                    f'{name}: replicas not fully ready/updated, or scaled to zero')


def targets_ready(items, max_age, now=None):
    require(items, 'Prometheus has no active targets')
    now = now or datetime.now(timezone.utc)
    for target in items:
        job = target.get('labels', {}).get('job', 'unknown')
        require(target.get('health') == 'up' and not target.get('lastError'), f'{job}: scrape unhealthy')
        try:
            stamp = datetime.fromisoformat(target['lastScrape'].replace('Z', '+00:00'))
            age = (now - stamp).total_seconds()
        except (KeyError, ValueError, TypeError) as exc:
            raise HealthError(f'{job}: invalid scrape timestamp') from exc
        require(-30 <= age <= max_age, f'{job}: scrape stale or clock mismatch')


def metrics_up(result, name):
    require(result, f'{name}: metric missing (empty result)')
    for series in result:
        try:
            value = float(series['value'][1])
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise HealthError(f'{name}: invalid metric value') from exc
        require(math.isfinite(value) and value == 1, f'{name}: value is not 1')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


class Cluster:
    def __init__(self, timeout):
        self.timeout = timeout
        # Internal cluster requests must not be sent through a host HTTP proxy.
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def get(self, kind, namespace=None, name=None):
        args = ['kubectl', '--request-timeout=' + str(self.timeout) + 's']
        args += ['-n', namespace] if namespace else []
        args += ['get', kind] + ([name] if name else []) + ['-o', 'json']
        try:
            result = subprocess.run(args, capture_output=True, text=True, timeout=self.timeout + 5)
            require(result.returncode == 0, f'kubectl get {kind}: failed (check context/access)')
            return json.loads(result.stdout)
        except (OSError, subprocess.TimeoutExpired, ValueError) as exc:
            raise HealthError(f'kubectl get {kind}: unavailable, timed out or invalid JSON') from exc

    def service_url(self, namespace, name, port):
        resource = self.get('service', namespace, name)
        address = resource['spec'].get('clusterIP')
        require(address and address != 'None', f'{name}: no ClusterIP')
        require(any(p['port'] == port for p in resource['spec'].get('ports', [])), f'{name}: port missing')
        address = '[' + address + ']' if ':' in address else address
        return f'http://{address}:{port}'

    def http(self, url, expected=200, host=None, as_json=False, contains=None):
        request = urllib.request.Request(url, headers={'Host': host} if host else {})
        try:
            response = self.opener.open(request, timeout=self.timeout)
        except urllib.error.HTTPError as exc:
            response = exc
        except (urllib.error.URLError, OSError, TimeoutError) as exc:
            raise HealthError('HTTP connection failed or timed out (response body omitted)') from exc
        with response:
            require(response.code == expected, f'HTTP status {response.code}, expected {expected}')
            body = response.read(2 * 1024 * 1024 + 1)
            require(len(body) <= 2 * 1024 * 1024, 'HTTP response too large')
            if contains:
                require(contains.lower().encode() in body.lower(), 'Expected page content missing')
            if as_json:
                try:
                    return json.loads(body)
                except ValueError as exc:
                    raise HealthError('Invalid JSON response (body omitted)') from exc

    def prometheus(self, base, path):
        response = self.http(base + path, as_json=True)
        require(response.get('status') == 'success', 'Prometheus API did not report success')
        return response['data']


def run_checks(args):
    cluster = Cluster(args.timeout)
    failures = []

    def check(name, function):
        try:
            function()
            print('PASS ' + name, flush=True)
        except (HealthError, KeyError, TypeError, ValueError) as exc:
            detail = str(exc) if isinstance(exc, HealthError) else 'Unexpected response structure (body omitted)'
            print('FAIL ' + name + ': ' + detail, flush=True)
            failures.append(name)

    check('nodes', lambda: nodes_ready(cluster.get('nodes')['items']))
    for namespace in ['distro-space', 'monitoring', 'kube-system']:
        check(namespace + ' pods', lambda ns=namespace: pods_ready(cluster.get('pods', ns)['items']))
        check(namespace + ' controllers', lambda ns=namespace: workloads_ready(
            cluster.get('deployments,statefulsets,daemonsets', ns)['items']))
    expected_workloads = [('deployment', 'nginx'), ('deployment', 'php'), ('statefulset', 'db')]
    if not args.skip_vkbot:
        expected_workloads.append(('deployment', 'vkbot'))
    for kind, name in expected_workloads:
        check(name + ' present and ready', lambda k=kind, n=name: workloads_ready([cluster.get(k, 'distro-space', n)]))

    def website():
        ingress = cluster.get('ingress', 'distro-space', 'distro-space')
        host = args.host or ingress['spec']['rules'][0]['host']
        base = args.base_url
        if not base:
            addresses = ingress.get('status', {}).get('loadBalancer', {}).get('ingress', [])
            require(addresses, 'Ingress has no published address; pass --base-url')
            address = addresses[0].get('ip') or addresses[0].get('hostname')
            require(address, 'Ingress address missing')
            base = 'http://' + ('[' + address + ']' if ':' in address else address)
        base = base.rstrip('/')
        cluster.http(base + '/', host=host, contains='<html')
        cluster.http(base + '/TechSupport/', host=host, contains='<html')
        session = cluster.http(base + '/src/controlls/php/session_check.php', host=host, as_json=True)
        require(session.get('logged_in') is False, 'Anonymous session endpoint did not report logged_in=false')
        cluster.http(base + '/src/controlls/php/backup_db.php', expected=403, host=host)

    check('website, TechSupport, PHP session and anonymous backup denial', website)

    def monitoring():
        prom = cluster.service_url('monitoring', 'kps-kube-prometheus-stack-prometheus', 9090)
        cluster.http(prom + '/-/ready')
        data = cluster.prometheus(prom, '/api/v1/targets')
        targets_ready(data['activeTargets'], args.max_scrape_age)
        for metric in ['mysql_up', 'nginx_up', 'probe_success']:
            query = urllib.parse.urlencode({'query': metric})
            result = cluster.prometheus(prom, '/api/v1/query?' + query)['result']
            metrics_up(result, metric)
            if metric == 'probe_success':
                http_paths = {urllib.parse.urlsplit(x['metric'].get('instance', '')).path
                              for x in result if x['metric'].get('job') == 'distro-http'}
                require({'/', '/TechSupport/'} <= http_paths, 'Site probes missing')
                require(any(x['metric'].get('job') == 'mysql-tcp' for x in result), 'MySQL TCP probe missing')
        groups = cluster.prometheus(prom, '/api/v1/rules')['groups']
        custom = [g for g in groups if g['name'] == 'distro-space.alerts']
        require(len(custom) == 1, 'Application alert rule group missing or duplicated')
        rules = custom[0].get('rules', [])
        expected = {'SiteDown', 'MySQLDown', 'MonitoringTargetDown', 'ContainerDown', 'ContainerRestarting'}
        require({r['name'] for r in rules} == expected, 'Application rules missing or unexpected')
        require(all(r.get('health') == 'ok' and not r.get('lastError') for r in rules), 'Application rule evaluation error')
        require(all(r.get('state') == 'inactive' for r in rules), 'Application alert pending/firing')
        print(f'  {len(data["activeTargets"])} fresh targets; DB/nginx/probes=1; five application rules inactive', flush=True)

    check('Prometheus, exporters, probes and application alerts', monitoring)
    check('Alertmanager ready', lambda: cluster.http(cluster.service_url(
        'monitoring', 'kps-kube-prometheus-stack-alertmanager', 9093) + '/-/ready'))

    def grafana():
        data = cluster.http(cluster.service_url('monitoring', 'kps-grafana', 80) + '/api/health', as_json=True)
        require(data.get('database') == 'ok', 'Grafana database not healthy')

    check('Grafana health', grafana)
    if args.skip_vkbot:
        print('SKIP VK bot: explicitly disabled for this deployment', flush=True)
    else:
        check('VK bot HTTP handler (no message sent)', lambda: cluster.http(
            cluster.service_url('distro-space', 'vkbot', 8080) + '/webhook', expected=405))
    print('NOT TESTED: login/write operations, full NetworkPolicy enforcement, browser UI, VK delivery.', flush=True)
    print(f'Result: {len(failures)} failed checks. No deployment or DB writes performed.', flush=True)
    return int(bool(failures))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', help='Website address; default: discovered Ingress address')
    parser.add_argument('--host', help='HTTP Host header; default: discovered Ingress host')
    parser.add_argument('--skip-vkbot', action='store_true', help='Explicitly skip absent optional VK bot')
    parser.add_argument('--timeout', type=int, default=10)
    parser.add_argument('--max-scrape-age', type=int, default=180)
    args = parser.parse_args()
    if args.timeout < 1 or args.max_scrape_age < 1:
        parser.error('Timeout and scrape age must be positive')
    if args.base_url:
        url = urllib.parse.urlsplit(args.base_url)
        if url.scheme not in {'http', 'https'} or not url.hostname or url.username or url.password or url.query or url.fragment:
            parser.error('--base-url must be an HTTP(S) URL without credentials, query or fragment')
    return run_checks(args)


if __name__ == '__main__':
    sys.exit(main())
