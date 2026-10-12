"""Validate recorded engineering decisions against the exact reviewed snapshot.

This verifies traceability and freshness, never the truth of an agent's claims.
"""
from pathlib import PurePosixPath
import re
import hashlib
import yaml
from .sources import digest

PLACEHOLDER = re.compile(r'\b(TODO|TBD|FIXME|PLACEHOLDER)(?:\b|_)|\{\{', re.I)

def text(value, label):
    if not isinstance(value, str) or len(value.strip()) < 20 or PLACEHOLDER.search(value):
        raise ValueError(f'{label}: substantive evidence required, no placeholders')

def local(root, rel):
    if not isinstance(rel, str) or not rel or PurePosixPath(rel).is_absolute() or '..' in PurePosixPath(rel).parts:
        raise ValueError('unsafe evidence path')
    path = root / rel
    if any(parent.is_symlink() for parent in [path, *path.parents]) or not path.resolve().is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError(f'missing/unsafe evidence artifact: {rel}')
    return path

def command(value, label):
    if not isinstance(value, list) or not value or any(not isinstance(v, str) or not v.strip() for v in value):
        raise ValueError(f'{label}: argument-array command required')

def validate(root, entry, errors, affected=None):
    try:
        rel = entry.get('engineering_evidence')
        path = local(root, rel)
        if entry.get('document_hashes', {}).get(rel) != digest(path):
            raise ValueError('engineering evidence changed; refresh reviewed evidence hash')
        data = yaml.safe_load(path.read_text())
        if not isinstance(data, dict) or data.get('schema_version') != '1.0.0':
            raise ValueError('invalid engineering evidence schema')
        if data.get('unit_id') != entry.get('unit_id') or data.get('reviewer') != entry.get('reviewed_by') or data.get('reviewed_on') != entry.get('reviewed_on'):
            raise ValueError('engineering evidence identity/date differs from coverage review')
        reviewer = data.get('reviewer')
        if not isinstance(reviewer, str) or len(reviewer.strip()) < 3 or PLACEHOLDER.search(reviewer):
            raise ValueError('real review identity required')
        sources = data.get('sources')
        if sources != entry.get('sources'):
            raise ValueError('engineering evidence must cover the same source paths/hashes')
        removed = entry.get('removed_sources', {})
        if data.get('removed_sources', {}) != removed:
            raise ValueError('removal evidence must identify the prior source hashes')
        for source, checksum in sources.items():
            if affected is None or source in affected:
                if digest(local(root, source)) != checksum:
                    raise ValueError(f'{source}: stale engineering evidence')
        artifacts = data.get('artifacts')
        if not isinstance(artifacts, dict) or not artifacts:
            raise ValueError('hashed investigation/validation artifacts required')
        for artifact, checksum in artifacts.items():
            if digest(local(root, artifact)) != checksum:
                raise ValueError(f'{artifact}: stale evidence artifact')
        investigation = data['investigation']
        text(investigation.get('context'), 'investigation context')
        searches = investigation.get('searches')
        if not isinstance(searches, list) or not searches:
            raise ValueError('repository reuse searches required for every change')
        for search in searches:
            command(search.get('command'), 'search')
            text(search.get('scope'), 'search scope')
            text(search.get('result'), 'search result')
            if search.get('artifact') not in artifacts:
                raise ValueError('search must reference a hashed artifact')
        references = investigation.get('references')
        if not isinstance(references, list) or not references:
            raise ValueError('inspected contract/source references required')
        for ref in references:
            if ref not in sources and ref not in artifacts:
                raise ValueError('reference must be a reviewed source or hashed artifact')
        reuse = data['reuse']
        if reuse.get('decision') not in {'reuse', 'extend', 'consolidate', 'new', 'remove'}:
            raise ValueError('explicit reuse/extend/consolidate/new/remove decision required')
        text(reuse.get('rationale'), 'reuse rationale')
        text(reuse.get('alternatives'), 'reuse alternatives')
        candidates = reuse.get('candidates')
        if not isinstance(candidates, list) or (reuse['decision'] in {'reuse', 'extend', 'consolidate'} and not candidates):
            raise ValueError('reuse candidates required for the selected decision')
        for candidate in candidates:
            if candidate not in sources and candidate not in artifacts:
                raise ValueError('reuse candidate must be inspected and hash-bound')
        architecture = data['architecture']
        for field in ('responsibilities', 'boundaries', 'abstraction', 'rationale', 'duplication_review', 'risks'):
            text(architecture.get(field), 'architecture ' + field)
        for source in sources:
            if affected is None or source in affected:
                if len(local(root, source).read_text().splitlines()) > 300:
                    text(architecture.get('cohesion_review'), 'cohesion review above 300 lines')
        resolution = data['resolution']
        if resolution.get('kind') not in {'feature', 'fix', 'refactor', 'removal', 'canonical_export'}:
            raise ValueError('explicit change kind required')
        if removed and resolution.get('kind') != 'removal':
            raise ValueError('removed source requires a removal assessment')
        for field in ('cause_or_need', 'official_mechanisms', 'solution', 'regression'):
            text(resolution.get(field), 'resolution ' + field)
        # A symptom-hiding mitigation cannot complete a compliant implementation.
        if resolution.get('workaround') is not False:
            raise ValueError('unresolved workaround/mitigation cannot pass completion')
        validations = data.get('validation')
        if not isinstance(validations, list) or not validations:
            raise ValueError('executed validation evidence required')
        for check in validations:
            command(check.get('command'), 'validation')
            text(check.get('result'), 'validation result')
            if type(check.get('exit_code')) is not int or check['exit_code'] != 0 or check.get('artifact') not in artifacts:
                raise ValueError('validation must pass and reference hashed output')
    except (OSError, ValueError, KeyError, TypeError, AttributeError, yaml.YAMLError) as exc:
        errors.append(f'engineering evidence {entry.get("unit_id", "unknown")}: {exc}')

def validate_prior_removals(repo, view, affected, base, errors):
    """A removal must identify the actual prior bytes, not an invented checksum."""
    if not base:
        return
    from .change_scope import git
    try:
        data = yaml.safe_load((view / '.agentic-harness/documentation-coverage.yml').read_text())
        for unit in data['units']:
            for rel, checksum in unit.get('removed_sources', {}).items():
                if rel not in affected:
                    continue
                previous = git(repo, 'show', base + ':' + rel, binary=True)
                if hashlib.sha256(previous).hexdigest() != checksum:
                    errors.append(f'{rel}: removal evidence does not match actual prior source')
    except (OSError, ValueError, KeyError, TypeError, AttributeError, yaml.YAMLError) as exc:
        errors.append(f'removal evidence: {exc}')
