"""Explicit stack checks cannot silently disappear when product code exists."""
import subprocess
import os
import json
import yaml

def validate(root, paths, errors):
    product = [p for p in paths if p.relative_to(root).parts[0] not in {'scripts','tests','tooling'}]
    if not product:
        return
    try:
        config = yaml.safe_load((root / '.agentic-harness/stack-checks.yml').read_text())
        for category in ('lint', 'typecheck', 'test', 'build'):
            entry = config[category]
            if not isinstance(entry, dict):
                raise ValueError(f'{category}: expected command mapping')
            command = entry.get('command')
            if command is None and category == 'typecheck' and entry.get('not_applicable_reason'):
                continue
            if not isinstance(command, list) or not command or any(not isinstance(v, str) or not v for v in command):
                raise ValueError(f'{category}: explicit argument-array command required')
            env = dict(os.environ, AGENTIC_CHANGED_SOURCE_FILES_JSON=json.dumps([p.relative_to(root).as_posix() for p in paths]))
            result = subprocess.run(command, cwd=root, env=env, check=False)
            if result.returncode:
                errors.append(f'stack {category}: command failed ({result.returncode})')
    except (OSError, KeyError, ValueError, TypeError, yaml.YAMLError) as exc:
        errors.append(f'product stack checks: {exc}')
