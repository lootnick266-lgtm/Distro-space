#!/usr/bin/env python3
"""Offline repository checks. Never deploys or connects to the application DB."""
import argparse
import copy
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

try:
    import yaml
except ImportError:
    sys.exit('Missing PyYAML: install scripts/requirements-checks.txt')

ROOT = Path(__file__).resolve().parents[1]


class CheckError(Exception):
    pass


class UniqueLoader(yaml.SafeLoader):
    pass


# GitHub Actions uses YAML 1.2: its "on" key must not become boolean True.
UniqueLoader.yaml_implicit_resolvers = copy.deepcopy(yaml.SafeLoader.yaml_implicit_resolvers)
for key, resolvers in UniqueLoader.yaml_implicit_resolvers.items():
    UniqueLoader.yaml_implicit_resolvers[key] = [
        pair for pair in resolvers if pair[0] != 'tag:yaml.org,2002:bool'
    ]
UniqueLoader.add_implicit_resolver('tag:yaml.org,2002:bool', re.compile(r'^(?:true|false)$', re.I), list('tTfF'))


def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise CheckError(f'duplicate YAML key at line {key_node.start_mark.line + 1}')
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def run(args, *, cwd=ROOT, env=None):
    try:
        result = subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, timeout=240)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise CheckError(f'{args[0]} unavailable or timed out') from exc
    if result.returncode:
        # Only checker/tool output; secret values and scanner matches are never printed.
        detail = (result.stdout + result.stderr).strip()
        raise CheckError(f'{args[0]} exited {result.returncode}:\n{detail[:5000]}')
    return result.stdout


def files():
    names = run(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0')
    return sorted({Path(name) for name in names if name and (ROOT / name).is_file()})


def protected(path):
    name = path.name.lower()
    return (name == 'install.sh' or name == '.env' or name.startswith('.env.')
            or name in {'secret.yaml', 'secret.yml', 'config.php', 'vault.yml', 'vault.yaml'}
            or name.endswith(('.vault.yml', '.vault.yaml'))
            or name.endswith(('.key', '.pem', '.p12', '.pfx'))
            or name in {'id_rsa', 'id_ed25519'}
            or 'telegrambot-secret' in name)


def check_secrets():
    tracked = run(['git', 'ls-files', '-z']).split('\0')
    forbidden = [name for name in tracked if name and protected(Path(name))
                 and Path(name).name.lower() != 'install.sh'
                 and not name.endswith(('.example', '.sample'))]
    if forbidden:
        raise CheckError('Sensitive paths tracked by Git (contents not read): ' + ', '.join(forbidden))
    patterns = [
        re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
        re.compile(r'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),
        re.compile(r'\bgithub_pat_[A-Za-z0-9_]{30,}\b'),
        re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
        re.compile(r'\bvk1\.a\.[A-Za-z0-9_-]{30,}'),
        re.compile(r'\b[0-9]{8,12}:[A-Za-z0-9_-]{30,}\b'),
    ]
    findings = []
    for path in files():
        if protected(path) or (ROOT / path).stat().st_size > 1024 * 1024:
            continue
        if path.suffix.lower() not in {'.php', '.go', '.js', '.yaml', '.yml', '.md', '.json', '.sh', '.py', '.txt'}:
            continue
        for number, line in enumerate((ROOT / path).read_text(errors='replace').splitlines(), 1):
            if any(pattern.search(line) for pattern in patterns):
                findings.append(f'{path}:{number}')
    if findings:
        raise CheckError('Possible secrets; values redacted: ' + ', '.join(findings))
    print('  Sensitive path guard and high-confidence token/private-key patterns passed')


def load_documents(text, name):
    try:
        return [doc for doc in yaml.load_all(text, Loader=UniqueLoader) if doc is not None]
    except (yaml.YAMLError, CheckError, TypeError) as exc:
        # Do not echo YAML source: a parser error can otherwise reveal a secret.
        mark = getattr(exc, 'problem_mark', None)
        location = f' line {mark.line + 1}' if mark else ''
        reason = str(exc) if isinstance(exc, CheckError) else 'invalid YAML'
        raise CheckError(f'{name}{location}: {reason}') from exc


def check_yaml():
    count = 0
    for path in files():
        if path.suffix not in {'.yaml', '.yml'} or protected(path):
            continue
        if path.parts[0] not in {'k3s', '.github', 'ansible'}:
            continue
        docs = load_documents((ROOT / path).read_text(), str(path))
        count += 1
        for doc in docs:
            if path.parts[0] == 'ansible':
                if not isinstance(doc, (dict, list)):
                    raise CheckError(f'{path}: expected an Ansible mapping or task/play list')
                continue
            if not isinstance(doc, dict):
                raise CheckError(f'{path}: expected a mapping')
            if path.parts[0] == '.github':
                if not {'on', 'jobs'} <= doc.keys():
                    raise CheckError(f'{path}: missing workflow trigger/jobs')
            elif path.parent.name == 'base' or 'exporters' in path.parts or doc.get('kind') == 'PrometheusRule':
                if not doc.get('apiVersion') or not doc.get('kind'):
                    raise CheckError(f'{path}: missing resource apiVersion/kind')
    rendered = run(['kubectl', 'kustomize', 'k3s/base'])
    resources = load_documents(rendered, 'Kustomize output')
    identities = set()
    for doc in resources:
        metadata = doc.get('metadata', {})
        identity = (doc.get('apiVersion'), doc.get('kind'), metadata.get('namespace'), metadata.get('name'))
        if not identity[3] or identity in identities:
            raise CheckError('Kustomize output has unnamed or duplicate resources')
        identities.add(identity)
    print(f'  {count} YAML files; {len(resources)} rendered Kubernetes resources')


def image(name, default):
    value = os.environ.get(name, default)
    run(['docker', 'image', 'inspect', value])
    return value


def docker_args(image_name, entrypoint):
    return ['docker', 'run', '--rm', '--pull=never', '--network=none', '--read-only',
            '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=128',
            '--memory=512m', '--entrypoint=' + entrypoint]


def check_php():
    source = [p.as_posix() for p in files() if p.suffix == '.php' and not protected(p)]
    if not source:
        raise CheckError('No PHP sources found')
    php_image = image('PHP_CHECK_IMAGE', 'distro-php:1.1')
    args = docker_args(php_image, 'sh')
    args += ['-v', f'{ROOT}:/workspace:ro', '-w', '/workspace', php_image,
             '-c', 'for file do php -n -l "$file" || exit; done', 'lint', *source]
    run(args)
    print(f'  {len(source)} PHP files linted; code was not executed')


def check_go():
    env = dict(os.environ, GOPROXY='off', GOSUMDB='off', GOTOOLCHAIN='local')
    module = ROOT / 'Alerts'
    run(['go', 'mod', 'verify'], cwd=module, env=env)
    print(run(['go', 'test', '-count=1', './...'], cwd=module, env=env).strip())
    run(['go', 'vet', './...'], cwd=module, env=env)


def check_monitoring():
    prom = image('PROMETHEUS_CHECK_IMAGE', 'quay.io/prometheus/prometheus:v3.15.1-distroless')
    am = image('ALERTMANAGER_CHECK_IMAGE', 'quay.io/prometheus/alertmanager:v0.34.1')
    rule = load_documents((ROOT / 'k3s/monitoring/distro-space-alerts.yaml').read_text(), 'PrometheusRule')[0]
    if rule.get('kind') != 'PrometheusRule' or not rule.get('spec', {}).get('groups'):
        raise CheckError('Missing PrometheusRule groups')
    with tempfile.TemporaryDirectory(prefix='distro-checks-') as directory:
        target = Path(directory)
        target.chmod(0o755)
        (target / 'rules.yaml').write_text(yaml.safe_dump(rule['spec'], allow_unicode=True))
        shutil.copyfile(ROOT / 'k3s/monitoring/alertmanager-config.yml', target / 'alertmanager.yaml')
        for file in target.iterdir():
            file.chmod(0o644)
        args = docker_args(prom, '/bin/promtool')
        run(args + ['-v', f'{target}:/checks:ro', prom, 'check', 'rules', '/checks/rules.yaml'])
        args = docker_args(am, '/bin/amtool')
        run(args + ['-v', f'{target}:/checks:ro', am, 'check-config', '/checks/alertmanager.yaml'])
    print('  promtool rules and amtool check-config passed (network disabled)')



def check_ansible():
    with tempfile.TemporaryDirectory(prefix='distro-ansible-local-') as directory:
        env = dict(os.environ, ANSIBLE_CONFIG=str(ROOT / 'ansible/ansible.cfg'),
                   ANSIBLE_LOCAL_TEMP=directory, ANSIBLE_NOCOLOR='1',
                   PYTHONDONTWRITEBYTECODE='1')
        run(['ansible-playbook', '-i', 'inventory.example.yml', 'site.yml', '--syntax-check'],
            cwd=ROOT / 'ansible', env=env)
        run(['ansible-playbook', '-i', 'inventory.example.yml', 'deploy.yml', '--syntax-check'],
            cwd=ROOT / 'ansible', env=env)
        run(['ansible-playbook', '-i', 'localhost,', 'validate.yml'],
            cwd=ROOT / 'ansible', env=env)
    print('  Ansible syntax and both offline template modes passed; no target provisioned')


def check_checker():
    run(['bash', '-n', 'scripts/check.sh'])
    run(['bash', '-n', 'scripts/health.sh'])
    run([sys.executable, '-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_*.py'])
    print('  Shell syntax and checker regression tests passed')


def main():
    checks = {'checker': check_checker, 'secrets': check_secrets, 'yaml': check_yaml, 'php': check_php,
              'go': check_go, 'monitoring': check_monitoring, 'ansible': check_ansible}
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only', choices=checks, help='Run a single check group')
    args = parser.parse_args()
    failed = []
    for name, check in checks.items():
        if args.only and args.only != name:
            continue
        print(f'[{name}]', flush=True)
        try:
            check()
            print('  PASS', flush=True)
        except CheckError as exc:
            print(f'  FAIL: {exc}', flush=True)
            failed.append(name)
    if failed:
        print('Failed groups: ' + ', '.join(failed))
        return 1
    print('All requested checks passed. No deployment was performed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
