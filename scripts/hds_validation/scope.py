"""Documentation scope. Source-code quality belongs to the delivery OS."""
def excluded(rel, config):
    parts = rel.parts
    if any(p in parts for p in {'.git', 'legacy-documentation', '.venv', '.hds-local', '__pycache__', 'node_modules'}):
        return True
    value = rel.as_posix()
    return any(value == prefix.rstrip('/') or value.startswith(prefix.rstrip('/') + '/')
               for prefix in config.get('independently_governed_paths', []))
