#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []
policy = ROOT / 'ENGINEERING_GUARDRAILS.md'
if not policy.exists():
    errors.append('Missing ENGINEERING_GUARDRAILS.md')
else:
    text = policy.read_text(encoding='utf-8')
    for token in ['version: 1.3.0', 'G-OFFICIAL-API-FIRST', 'G-PRESERVE-INTENT-NOT-ACCIDENTAL-COMPLEXITY', 'G-LEGACY-CONVERGENCE', 'New work must be compliant by construction']:
        if token not in text:
            errors.append(f'ENGINEERING_GUARDRAILS.md missing required token: {token}')
for rel in ['START_HERE_FOR_AGENTS.md', 'AGENTS.md', 'GUARDRAILS.md']:
    p = ROOT / rel
    if not p.exists() or 'ENGINEERING_GUARDRAILS.md' not in p.read_text(encoding='utf-8'):
        errors.append(f'{rel} must reference ENGINEERING_GUARDRAILS.md')
manifest = ROOT / '.agentic-harness' / 'manifest.yml'
if not manifest.exists() or 'engineering_guardrails_version: 1.3.0' not in manifest.read_text(encoding='utf-8'):
    errors.append('Capsule manifest must record engineering_guardrails_version: 1.3.0')
if errors:
    print('ENGINEERING GUARDRAILS VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('ENGINEERING GUARDRAILS VALIDATION PASSED')
