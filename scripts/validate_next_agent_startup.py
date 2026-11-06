#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
startup = ROOT / '00-NEXT_AGENT_STARTUP.md'
start_here = ROOT / 'START_HERE_FOR_AGENTS.md'
handoff = ROOT / 'AGENT_HANDOFF.md'
errors = []
required_sections = [
    'Current Phase', 'Mission', 'First Files to Read', 'Mandatory First Command',
    'Prohibited Actions', 'Required Work', 'Expected Outputs', 'Stop Condition', 'Final Report'
]
if not startup.exists():
    errors.append('Missing 00-NEXT_AGENT_STARTUP.md')
else:
    text = startup.read_text(encoding='utf-8')
    for section in required_sections:
        if section not in text:
            errors.append(f'00-NEXT_AGENT_STARTUP.md missing required section: {section}')
    for phrase in ['bash scripts/run_all_checks.sh', 'Do not start product implementation', 'private Agentic Delivery OS', 'AGENT_HANDOFF.md']:
        if phrase not in text:
            errors.append(f'00-NEXT_AGENT_STARTUP.md missing required instruction: {phrase}')
if start_here.exists():
    if '00-NEXT_AGENT_STARTUP.md' not in start_here.read_text(encoding='utf-8'):
        errors.append('START_HERE_FOR_AGENTS.md does not reference 00-NEXT_AGENT_STARTUP.md')
else:
    errors.append('Missing START_HERE_FOR_AGENTS.md')
if handoff.exists():
    if '00-NEXT_AGENT_STARTUP.md' not in handoff.read_text(encoding='utf-8'):
        errors.append('AGENT_HANDOFF.md does not reference 00-NEXT_AGENT_STARTUP.md')
else:
    errors.append('Missing AGENT_HANDOFF.md')
if errors:
    print('NEXT AGENT STARTUP VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('NEXT AGENT STARTUP VALIDATION PASSED')
