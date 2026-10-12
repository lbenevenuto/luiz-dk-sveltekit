#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []
briefing = ROOT / 'briefing'
briefing_exists = briefing.exists()
project_brief = ROOT / 'PROJECT_BRIEF.md'
hds_brief = ROOT / 'docs' / 'hds' / 'discovery' / 'PROJECT_BRIEF.md'
open_questions = ROOT / 'docs' / 'hds' / 'discovery' / 'open-questions.md'
handoff = ROOT / 'AGENT_HANDOFF.md'
gitignore = ROOT / '.gitignore'
if briefing_exists:
    if not project_brief.exists():
        errors.append('briefing/ exists but PROJECT_BRIEF.md is missing')
    if not hds_brief.exists():
        errors.append('briefing/ exists but docs/hds/discovery/PROJECT_BRIEF.md is missing')
    if not open_questions.exists():
        errors.append('briefing/ exists but docs/hds/discovery/open-questions.md is missing')
    if gitignore.exists() and 'briefing/' not in gitignore.read_text(encoding='utf-8'):
        errors.append('briefing/ exists but is not ignored in .gitignore')
    if handoff.exists():
        text = handoff.read_text(encoding='utf-8').lower()
        for term in ['briefing', 'project_brief', 'read']:
            if term not in text:
                errors.append(f'AGENT_HANDOFF.md does not clearly reference briefing status: {term}')
    else:
        errors.append('briefing/ exists but AGENT_HANDOFF.md is missing')
if errors:
    print('BRIEFING BOOTSTRAP VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('BRIEFING BOOTSTRAP VALIDATION PASSED')
