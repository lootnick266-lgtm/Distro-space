#!/usr/bin/env python3
"""Create and remove temporary Cloudflare zone IP Access Rules for Fail2ban."""
import configparser
import ipaddress
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CONFIG = Path('/etc/fail2ban/distro-cloudflare.ini')
API = 'https://api.cloudflare.com/client/v4/zones/{}/firewall/access_rules/rules'


def request_json(url, headers, method='GET', payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    request = Request(url, data=data, headers=headers, method=method)
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def find_our_rules(endpoint, headers, target, address, note):
    query = urlencode({
        'mode': 'block',
        'configuration.target': target,
        'configuration.value': str(address),
        'notes': note,
        'page': 1,
        'per_page': 100,
    })
    result = request_json(endpoint + '?' + query, headers)
    if not result.get('success'):
        raise SystemExit('Cloudflare rejected a Fail2ban rule lookup')
    return [
        rule for rule in result.get('result', [])
        if rule.get('mode') == 'block'
        and rule.get('configuration', {}).get('target') == target
        and rule.get('configuration', {}).get('value') == str(address)
        and rule.get('notes') == note
    ]


def main():
    if len(sys.argv) != 4 or sys.argv[1] not in {'ban', 'unban'}:
        raise SystemExit('Usage: distro-cloudflare-ban.py ban|unban IP JAIL')
    operation, raw_ip, jail = sys.argv[1:]
    address = ipaddress.ip_address(raw_ip)
    config = configparser.ConfigParser()
    if not config.read(CONFIG):
        raise SystemExit('Cloudflare Fail2ban credentials are unavailable')
    zone = config.get('cloudflare', 'zone_id')
    token = config.get('cloudflare', 'api_token')
    if not re.fullmatch(r'[A-Fa-f0-9]{32}', zone) or not token:
        raise SystemExit('Cloudflare Fail2ban credentials are invalid')

    target = 'ip6' if address.version == 6 else 'ip'
    endpoint = API.format(zone)
    note = 'Fail2Ban ' + jail
    headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
    }

    matches = find_our_rules(endpoint, headers, target, address, note)
    if operation == 'ban':
        if matches:
            return
        result = request_json(endpoint, headers, method='POST', payload={
            'mode': 'block',
            'configuration': {'target': target, 'value': str(address)},
            'notes': note,
        })
        if not result.get('success'):
            raise SystemExit('Cloudflare rejected a Fail2ban IP ban')
        return

    for rule in matches:
        rule_id = rule.get('id')
        if not rule_id:
            raise SystemExit('Cloudflare unban lookup returned no rule id')
        result = request_json(
            endpoint + '/' + rule_id,
            headers,
            method='DELETE',
            payload={'cascade': 'none'},
        )
        if not result.get('success'):
            raise SystemExit('Cloudflare rejected a Fail2ban IP unban')


if __name__ == '__main__':
    try:
        main()
    except (HTTPError, URLError, OSError, ValueError, KeyError, configparser.Error):
        raise SystemExit('Cloudflare Fail2ban API operation failed')
