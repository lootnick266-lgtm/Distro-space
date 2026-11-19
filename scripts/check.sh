#!/usr/bin/env bash
set -euo pipefail
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$task_root"
export PYTHONDONTWRITEBYTECODE=1
exec python3 scripts/check.py "$@"
