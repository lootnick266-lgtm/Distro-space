#!/usr/bin/env python3
"""Prepare a clean, fingerprinted source context for the Ansible VPS build."""
import argparse
import hashlib
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'ansible/roles/distro/files'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--namespace', required=True)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--include-telegram', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', args.namespace):
        parser.error('Invalid GHCR namespace')
    if not re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}', args.tag) or args.tag == 'latest':
        parser.error('Use an explicit version tag')
    names = subprocess.check_output(
        ['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
        cwd=ROOT).decode().split('\0')
    with tempfile.TemporaryDirectory(prefix='distro-image-context-') as work:
        context = Path(work)
        for name in names:
            if not name:
                continue
            path = Path(name)
            if path.parts[0] not in {'src', 'public'}:
                continue
            if path.name.startswith('.') or path.name in {
                'config.php', 'test.php', 'socket-server.php', 'socket-client.php', 'test.txt'
            }:
                continue
            source = ROOT / path
            if source.is_symlink() or not source.is_file():
                raise RuntimeError('Only regular source files are accepted')
            allowed = name == 'public/TechSupport/assets/fontawesome/LICENSE.txt' or (
                path.parts[0] == 'src' and path.suffix == '.php') or (
                path.parts[0] == 'public' and path.suffix.lower() in {
                    '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif',
                    '.ico', '.svg', '.webp', '.woff', '.woff2', '.ttf'})
            if not allowed:
                continue
            target = context / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        for name in ['runtime-config.php', 'php-runtime.ini', 'nginx-site.conf']:
            shutil.copyfile(CONFIG / name, context / ('config.php' if name == 'runtime-config.php' else name))
        for service in ['php', 'nginx']:
            shutil.copyfile(CONFIG / f'Dockerfile.{service}', context / f'Dockerfile.{service}')
        if args.include_telegram:
            bot = context / 'telegrambot'
            bot.mkdir()
            for name in ['TelegramAlertBot.go', 'go.mod', 'go.sum']:
                shutil.copyfile(ROOT / 'VKAlerts' / name, bot / name)
            shutil.copyfile(ROOT / 'Docker/Dockerfile.telegrambot', context / 'Dockerfile.telegrambot')
        shutil.copytree(context, args.output, dirs_exist_ok=True)
        digest = hashlib.sha256()
        digest.update((args.namespace + ':' + args.tag).encode())
        for path in sorted(context.rglob('*')):
            if path.is_file():
                digest.update(path.relative_to(context).as_posix().encode() + b'\0')
                digest.update(path.read_bytes())
        print(digest.hexdigest())

if __name__ == '__main__':
    main()
