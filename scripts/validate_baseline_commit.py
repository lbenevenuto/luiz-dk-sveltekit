#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []
if not (ROOT / '.git').exists():
    errors.append('Missing .git directory')
else:
    rev = subprocess.run(['git', 'rev-parse', '--verify', 'HEAD'], cwd=ROOT, text=True, capture_output=True)
    if rev.returncode != 0:
        errors.append('No baseline commit exists. Create a bootstrap baseline commit before implementation.')
    status = subprocess.run(['git', 'status', '--short'], cwd=ROOT, text=True, capture_output=True)
    if status.returncode != 0:
        errors.append('git status failed')
    elif status.stdout.strip():
        errors.append('Working tree is not clean after baseline commit:\n' + status.stdout.strip())
    tracked = subprocess.run(['git', 'ls-files', 'briefing'], cwd=ROOT, text=True, capture_output=True)
    if tracked.returncode == 0 and tracked.stdout.strip():
        errors.append('Raw briefing files are tracked by Git. This requires explicit human approval and policy update.')
if errors:
    print('BASELINE COMMIT VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('BASELINE COMMIT VALIDATION PASSED')
