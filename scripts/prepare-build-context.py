#!/usr/bin/env python3
"""Prepare allow-listed, content-fingerprinted source for application images."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'ansible/roles/distro/files'


def fingerprint(name, paths):
    digest = hashlib.sha256()
    digest.update(name.encode() + b'\0')
    for label, content in sorted(paths):
        digest.update(label.encode() + b'\0')
        digest.update(content)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--include-telegram', action='store_true')
    args = parser.parse_args()

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
                shutil.copyfile(ROOT / 'Alerts' / name, bot / name)
            shutil.copyfile(ROOT / 'Docker/Dockerfile.telegrambot', context / 'Dockerfile.telegrambot')

        files = [(p.relative_to(context).as_posix(), p.read_bytes())
                 for p in sorted(context.rglob('*')) if p.is_file()]
        php_files = [(n, b) for n, b in files if (
            n == 'Dockerfile.php' or n in {'config.php', 'php-runtime.ini'} or
            (n.startswith('src/') and n.endswith('.php')))]
        nginx_files = [(n, b) for n, b in files if (
            n in {'Dockerfile.nginx', 'nginx-site.conf'} or n.startswith('public/'))]
        fingerprints = {
            'php': fingerprint('php', php_files),
            'nginx': fingerprint('nginx', nginx_files),
        }
        if args.include_telegram:
            telegram_files = [(n, b) for n, b in files if (
                n == 'Dockerfile.telegrambot' or n.startswith('telegrambot/'))]
            fingerprints['telegrambot'] = fingerprint('telegrambot', telegram_files)

        shutil.copytree(context, args.output, dirs_exist_ok=True)
        print(json.dumps(fingerprints, sort_keys=True, separators=(',', ':')))


if __name__ == '__main__':
    main()
