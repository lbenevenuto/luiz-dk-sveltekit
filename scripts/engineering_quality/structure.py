"""Hard source-size limits and deterministic syntax checks."""
import ast
import subprocess
import shutil

def validate(root, paths, errors, warnings):
    for path in paths:
        rel = path.relative_to(root).as_posix()
        try:
            text = path.read_text(encoding='utf-8')
        except (UnicodeError, OSError) as exc:
            errors.append(f'{rel}: unreadable UTF-8 source: {exc}')
            continue
        count = len(text.splitlines())
        if count > 500:
            errors.append(f'{rel}: source exceeds 500 lines ({count}); refactor before completion')
        elif count > 300:
            warnings.append(f'{rel}: source exceeds preferred 300 lines ({count}); inspect cohesion')
        try:
            if path.suffix == '.py':
                ast.parse(text, filename=rel)
            elif path.suffix in {'.sh', '.bash'}:
                check = subprocess.run(['bash', '-n', str(path)], capture_output=True, text=True)
                if check.returncode:
                    errors.append(f'{rel}: shell syntax: {check.stderr.strip()}')
            elif path.suffix in {'.mjs', '.cjs'} and shutil.which('node'):
                check = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
                if check.returncode:
                    errors.append(f'{rel}: JavaScript syntax: {check.stderr.strip()}')
        except SyntaxError as exc:
            errors.append(f'{rel}: Python syntax: {exc}')
