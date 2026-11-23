#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []
input_root = ROOT / 'docs' / 'input'
if input_root.exists():
    for domain in input_root.iterdir():
        if not domain.is_dir():
            continue
        required = [domain / 'README.md', domain / 'provenance' / 'input-assets-manifest.yaml']
        for req in required:
            if not req.exists():
                errors.append(f'Missing input scaffold artifact: {req.relative_to(ROOT)}')
        check = subprocess.run(['git', 'check-ignore', '-q', str(domain.relative_to(ROOT))], cwd=ROOT)
        if check.returncode == 0:
            errors.append(f'Input scaffold is ignored but must be trackable: {domain.relative_to(ROOT)}')
if errors:
    print('INPUT ASSETS SCAFFOLD VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('INPUT ASSETS SCAFFOLD VALIDATION PASSED')
