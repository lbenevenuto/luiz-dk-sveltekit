"""Immutable adoption inventory and a separate, actionable legacy backlog."""
from pathlib import Path
import hashlib
from datetime import date
import yaml
from .sources import SUFFIXES, TRANSIENT, digest, inventory
from .structure import validate as structure
from .duplication import validate as duplication
from .python_clones import validate as python_clones

BASELINE = '.agentic-harness/legacy-baseline.yml'
FINDINGS = '.agentic-harness/legacy-findings.yml'

def capture(root):
    result = {}
    if not root.exists():
        return result
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if any(part in TRANSIENT for part in rel.parts) or path.is_symlink():
            continue
        if path.is_file() and (path.suffix.lower() in SUFFIXES or path.suffix == '.md'):
            result[rel.as_posix()] = digest(path)
    return result

def initialize(root, previous):
    path = root / BASELINE
    if path.exists():
        return  # Adoption is one-time; an edit cannot refresh its own exemption.
    files = {rel: checksum for rel, checksum in previous.items()
             if (root / rel).is_file() and digest(root / rel) == checksum}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump({'schema_version':'1.0.0', 'adopted_on':date.today().isoformat(),
                                    'files':files}, sort_keys=False))

def load(root):
    path = root / BASELINE
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text())
    if not isinstance(data, dict) or data.get('schema_version') != '1.0.0' or not isinstance(data.get('files'), dict):
        raise ValueError('invalid legacy adoption baseline')
    for rel, checksum in data['files'].items():
        target = root / rel
        if Path(rel).is_absolute() or '..' in Path(rel).parts or target.is_symlink() or not target.resolve().is_relative_to(root.resolve()):
            raise ValueError('unsafe legacy baseline path')
        if not isinstance(checksum, str) or len(checksum) != 64:
            raise ValueError('invalid legacy baseline hash')
    return data['files']

def unchanged(root):
    return {rel for rel, checksum in load(root).items()
            if (root / rel).is_file() and digest(root / rel) == checksum}

def audit(root):
    """Write findings to the working tree, never stage or commit them implicitly."""
    errors, warnings, records = [], [], []
    paths = inventory(root, errors)
    for path in paths:
        local_errors = []
        structure(root, [path], local_errors, warnings)
        for message in local_errors:
            records.append(('structure', path.relative_to(root).as_posix(), message))
    duplicate_findings = []
    duplication(root, paths, [], findings=duplicate_findings)
    python_clones(root, paths, [], findings=duplicate_findings)
    for finding in duplicate_findings:
        for rel in finding['paths']:
            records.append(('duplication', rel, finding['message']))
    covered = set()
    coverage = root / '.agentic-harness/documentation-coverage.yml'
    if coverage.exists():
        data = yaml.safe_load(coverage.read_text())
        covered = {rel for unit in data.get('units', []) for rel in unit.get('sources', {})}
    for path in paths:
        rel = path.relative_to(root).as_posix()
        if rel not in covered:
            records.append(('documentation', rel, 'Source has no reviewed human/AI technical documentation coverage.'))
    from hds_validation.common import parse_doc, REQUIRED
    for rel in load(root):
        if not rel.endswith('.md') or not (root / rel).is_file():continue
        try:
            text = (root / rel).read_text()
            meta, _ = parse_doc(text)
            if any(key not in meta for key in REQUIRED):raise ValueError('Missing hDS metadata')
            if len(text.splitlines()) > 500:raise ValueError('Document exceeds 500 lines')
        except (ValueError,UnicodeError,yaml.YAMLError) as exc:
            records.append(('documentation',rel,str(exc)))
    target = root / FINDINGS
    old = yaml.safe_load(target.read_text()) if target.exists() else {}
    previous = {entry['finding_id']:entry for entry in old.get('findings', [])}
    current = {}
    for rule, rel, evidence in records:
        identity = 'LEGACY-' + hashlib.sha256((rule + ':' + rel).encode()).hexdigest()[:16].upper()
        entry = previous.get(identity, {})
        entry.update(finding_id=identity, rule=rule, location=rel, status='open', owner='project-owner',
                     evidence=evidence, source_sha256=digest(root / rel),
                     impact='Inherited debt; blocks a change when the affected file is edited.',
                     next_action='Repair the whole touched file and update its documentation before commit.',
                     closure_criteria='Current scoped engineering checks and review pass.',
                     first_seen=entry.get('first_seen', date.today().isoformat()))
        current[identity] = entry
    for identity, entry in previous.items():
        if identity not in current:
            entry.update(status='resolved', resolution_evidence='No longer detected by the current structural/documentation audit.',
                         resolved_on=date.today().isoformat())
            current[identity] = entry
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(yaml.safe_dump({'schema_version':'1.0.0','findings':list(current.values())}, sort_keys=False))
    return list(current.values())
