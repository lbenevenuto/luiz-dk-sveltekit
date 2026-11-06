#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
patterns = ['.egg-info', '__pycache__', '.pytest_cache', '.ruff_cache', '.mypy_cache', '.venv', '/runs/', '/briefing/']
errors = []
for cmd in (['git', 'ls-files'], ['git', 'diff', '--cached', '--name-only']):
    res = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if res.returncode != 0:
        continue
    for line in res.stdout.splitlines():
        normalized = '/' + line.strip('/') + '/'
        for pattern in patterns:
            if pattern in normalized or line.endswith(pattern.strip('/')):
                errors.append(f'Generated/private artifact is tracked or staged: {line}')
if errors:
    print('GENERATED METADATA VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('GENERATED METADATA VALIDATION PASSED')
