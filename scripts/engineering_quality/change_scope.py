"""Resolve changed paths and validate an exact index/commit snapshot."""
from pathlib import Path
from contextlib import contextmanager
import subprocess
import tempfile
import tarfile
import io
from .legacy import unchanged, BASELINE

def git(root, *args, binary=False, check=True):
    result = subprocess.run(['git', '-C', str(root), *args], capture_output=True)
    if check and result.returncode:
        raise ValueError(result.stderr.decode().strip() or 'Git scope command failed')
    return result.stdout if binary else result.stdout.decode()

def has_head(root):
    return bool(git(root, 'rev-parse', '--verify', 'HEAD', check=False).strip())

def changed(root, base=None, target=None, staged=False):
    args = ['diff', '--no-renames', '--name-only', '-z']
    if staged:
        args.append('--cached')
        if has_head(root):args.append('HEAD')
    elif base:
        args.extend([base, target or 'HEAD'])
    elif has_head(root):args.append('HEAD')
    else:
        return set(filter(None,git(root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0')))
    result = set(filter(None, git(root, *args).split('\0')))
    if not staged and not base:
        result.update(filter(None, git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')))
    return result

def enforce_baseline_identity(repo, view, base=None):
    ref = base or ('HEAD' if has_head(repo) else None)
    if not ref:return
    previous = git(repo, 'show', ref + ':' + BASELINE, binary=True, check=False)
    if previous and ((not (view / BASELINE).is_file()) or (view / BASELINE).read_bytes() != previous):
        raise ValueError('Legacy adoption baseline is immutable; resolve findings, do not refresh exemptions.')

@contextmanager
def snapshot(repo, staged=False, target=None):
    """All gates read the same tree; unstaged repairs cannot mask staged defects."""
    with tempfile.TemporaryDirectory(prefix='agentic-index-') as directory:
        view = Path(directory)
        if staged:
            git(repo, 'checkout-index', '--all', '--force', '--prefix=' + str(view) + '/')
        else:
            data = git(repo, 'archive', '--format=tar', target or 'HEAD', binary=True)
            with tarfile.open(fileobj=io.BytesIO(data)) as archive:
                archive.extractall(view, filter='data')
        yield view

def selected(repo, view, base=None, target=None, staged=False, all_files=False):
    if all_files:
        return None
    enforce_baseline_identity(repo, view, base)
    try:paths = changed(repo, base, target, staged)
    except ValueError:
        if (repo / '.git').exists():raise
        paths = {p.relative_to(view).as_posix() for p in view.rglob('*') if p.is_file()}
    # Hash exemptions apply only to initial adoption, never to a later edit or revert.
    baseline_ref = base or ('HEAD' if has_head(repo) else None)
    baseline_in_head = git(repo, 'show', baseline_ref + ':' + BASELINE, binary=True, check=False) if baseline_ref else b''
    if baseline_in_head:return paths
    return paths - unchanged(view)
