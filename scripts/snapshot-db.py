#!/usr/bin/env python3
"""Export only the application's database to a private directory outside the repository."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

TABLES = ['bot_knowledge_base', 'chat_messages', 'logs', 'support_requests', 'users']

def main():
    listing = subprocess.run(
        ['kubectl', '--request-timeout=30s', '-n', 'distro-space', 'exec', 'db-0', '--',
         'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -u root -N -B '
         '-e "SHOW FULL TABLES" "$MYSQL_DATABASE"'],
        capture_output=True, text=True, timeout=45)
    if listing.returncode:
        raise RuntimeError('Cannot inspect source schema; details suppressed')
    objects = [line.split('\t') for line in listing.stdout.splitlines()]
    if sorted(row[0] for row in objects) != TABLES or any(row[1] != 'BASE TABLE' for row in objects):
        raise RuntimeError('Unexpected source tables or views; review migration scope first')
    work = Path(tempfile.mkdtemp(prefix='distro-vps-db-', dir=Path.home()))
    os.chmod(work, 0o700)
    snapshot = work / 'database.sql'
    cmd = ['kubectl', '--request-timeout=120s', '-n', 'distro-space', 'exec', 'db-0', '--',
           'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -u root '
           '--single-transaction --quick --skip-lock-tables --skip-add-locks '
           '--skip-extended-insert --complete-insert --hex-blob --set-gtid-purged=OFF '
           '--no-tablespaces --column-statistics=0 --skip-triggers '
           '--default-character-set=utf8mb4 "$MYSQL_DATABASE" ' + ' '.join(TABLES)]
    with snapshot.open('xb') as output:
        os.chmod(snapshot, 0o600)
        result = subprocess.run(cmd, stdout=output, stderr=subprocess.PIPE, timeout=180)
    if result.returncode:
        raise RuntimeError('Database export failed; SQL and stderr were not printed')
    data = snapshot.read_bytes()
    text = data.decode('utf-8')
    tables = sorted(re.findall(r'CREATE TABLE `([^\`]+)`', text))
    if tables != TABLES or '-- Dump completed on ' not in text:
        raise RuntimeError('Incomplete snapshot or unexpected schema')
    counts = {name: len(re.findall(r'^INSERT INTO `' + name + r'` ', text, re.M)) for name in TABLES}
    metadata = dict(sha256=hashlib.sha256(data).hexdigest(), rows=counts,
                    created=datetime.datetime.now(datetime.timezone.utc).isoformat())
    meta = work / 'metadata.json'
    meta.write_text(json.dumps(metadata, indent=2) + '\n')
    os.chmod(meta, 0o600)
    print('SNAPSHOT_DIRECTORY=' + str(work))
    print('SNAPSHOT_SHA256=' + metadata['sha256'])
    print('ROW_COUNTS=' + json.dumps(counts))

if __name__ == '__main__':
    main()
