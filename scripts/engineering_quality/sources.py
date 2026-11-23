"""One inventory shared by size, duplication and documentation checks."""
from pathlib import Path
import hashlib
import yaml

SUFFIXES = {'.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.go', '.rs',
            '.java', '.kt', '.swift', '.cs', '.rb', '.php', '.vue', '.svelte',
            '.sh', '.bash', '.sql', '.c', '.h', '.cpp', '.hpp', '.scala', '.dart'}
TRANSIENT = {'.git', 'node_modules', '.venv', '__pycache__', '.pytest_cache',
             '.mypy_cache', '.ruff_cache', 'dist', 'build', 'coverage'}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def inventory(root, errors):
    excluded = {}
    registry = root / '.agentic-harness/source-exclusions.yml'
    if registry.exists():
        try:
            data = yaml.safe_load(registry.read_text())
            if data.get('schema_version') != '1.0.0':
                raise ValueError('unsupported exclusions schema')
            for entry in data['files']:
                rel = entry['path']
                if entry.get('kind') not in {'generated','vendor','immutable_history','portable_skill'}:
                    raise ValueError('unsupported source exclusion kind')
                if rel in excluded or not entry.get('reason') or not entry.get('origin'):
                    raise ValueError('duplicate exclusion or missing reason')
                path = root / rel
                if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
                    raise ValueError('unsafe exclusion')
                if not path.is_file() or digest(path) != entry['sha256']:
                    errors.append(f'{rel}: immutable source exclusion changed; review required')
                else:
                    excluded[rel] = entry
        except (ValueError, KeyError, TypeError, OSError, yaml.YAMLError) as exc:
            errors.append(f'source exclusions: {exc}')
    found = []
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if any(part in TRANSIENT for part in rel.parts):
            continue
        if not path.is_file() or path.suffix.lower() not in SUFFIXES:
            continue
        if path.is_symlink():
            errors.append(f'{rel}: source symlink forbidden')
        elif rel.as_posix() not in excluded:
            found.append(path)
    return found
