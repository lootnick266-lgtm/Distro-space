#!/usr/bin/env python3
"""Restore one app-only dump into an empty managed target, once per snapshot."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

TABLES = ['bot_knowledge_base', 'chat_messages', 'logs', 'support_requests', 'users']

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot')
    parser.add_argument('sha256')
    args = parser.parse_args()
    data = Path(args.snapshot).read_bytes()
    if hashlib.sha256(data).hexdigest() != args.sha256:
        raise RuntimeError('Snapshot checksum mismatch')
    text = data.decode('utf-8')
    if sorted(re.findall(r'CREATE TABLE `([^\`]+)`', text)) != TABLES:
        raise RuntimeError('Unexpected snapshot tables')
    if re.search(r'(?im)^USE |^CREATE DATABASE|^CREATE USER|^GRANT ', text):
        raise RuntimeError('Only app-table snapshots are accepted')
    expected = {name: len(re.findall(r'^INSERT INTO `' + name + r'` ', text, re.M)) for name in TABLES}
    kubectl = ['/usr/local/bin/k3s', 'kubectl', '--kubeconfig',
               '/etc/rancher/k3s/k3s.yaml', '-n', 'distro-space']
    def run(command, **kwargs):
        return subprocess.run(command, check=True, capture_output=True, timeout=180, **kwargs).stdout
    marker = run(kubectl + ['get', 'configmap', 'database-migration', '--ignore-not-found',
                           '-o', 'jsonpath={.data.sha256}']).decode().strip()
    def sql(query):
        return run(kubectl + ['exec', '-i', 'db-0', '--', 'sh', '-c',
            'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -u root -N -B '
            '--default-character-set=utf8mb4 "$MYSQL_DATABASE"'],
            input=query.encode()).decode()
    def counts():
        query = ';'.join("SELECT '" + name + "',COUNT(*) FROM `" + name + "`" for name in TABLES) + ';'
        return {name: int(count) for name, count in
                (line.split('\t') for line in sql(query).splitlines())}
    if marker:
        if marker != args.sha256:
            raise RuntimeError('A different snapshot was already restored; refusing replacement')
        print('Database snapshot already restored; no changes')
        return
    if any(counts().values()):
        raise RuntimeError('Target database is not empty; refusing replacement or retry after partial import')
    sql(text)
    actual = counts()
    if actual != expected:
        raise RuntimeError('Restored row counts do not match snapshot; marker not written')
    marker_doc = dict(apiVersion='v1', kind='ConfigMap',
                      metadata=dict(name='database-migration', namespace='distro-space'),
                      data=dict(sha256=args.sha256, rows=json.dumps(expected, sort_keys=True)))
    run(kubectl + ['apply', '-f', '-'], input=json.dumps(marker_doc).encode())
    print('Restored database snapshot; row counts verified: ' + json.dumps(actual, sort_keys=True))

if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError:
        raise SystemExit('Database operation failed; sensitive output suppressed')
