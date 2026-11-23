"""Code-to-documentation and review evidence are OS responsibilities."""
import yaml
import re
from .sources import digest, SUFFIXES, TRANSIENT
from .evidence import validate as evidence
from .evidence import local

FIELDS = ('responsibility', 'contracts', 'invariants', 'failure_modes', 'validation', 'business_impact')

def validate(root, paths, errors, affected=None):
    try:
        data = yaml.safe_load((root / '.agentic-harness/documentation-coverage.yml').read_text())
        if data.get('schema_version') != '1.0.0' or not isinstance(data.get('units'), list):
            raise ValueError('invalid coverage schema/units')
    except (OSError, ValueError, TypeError, yaml.YAMLError) as exc:
        errors.append(f'documentation coverage: {exc}')
        return
    covered, removed = {}, set()
    for entry in data['units']:
        references = set(entry.get('sources', {})) | {entry.get(key) for key in ('human_doc','ai_doc','review_evidence','engineering_evidence')}
        references.update(entry.get('removed_sources', {}))
        try:
            details = yaml.safe_load(local(root, entry.get('engineering_evidence')).read_text())
            references.update(details.get('artifacts', {}))
        except (ValueError, OSError, TypeError, AttributeError, yaml.YAMLError):
            pass  # Selected units fail closed in the evidence validator below.
        if affected is not None and not references & affected and '.agentic-harness/documentation-coverage.yml' not in affected:continue
        try:
            for field in FIELDS:
                if not isinstance(entry.get(field), str) or len(entry[field].strip()) < 20:
                    raise ValueError(f'missing substantive {field}')
            for field in ('human_doc', 'ai_doc', 'review_evidence'):
                path = root / entry[field]
                if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()) or not path.is_file():
                    raise ValueError(f'invalid {field}')
            from hds_validation.common import parse_doc, check_date
            check_date(entry.get('reviewed_on'), 'code review date', errors)
            for field in ('human_doc','ai_doc','review_evidence'):
                rel = entry[field]
                if entry.get('document_hashes', {}).get(rel) != digest(root / rel):
                    errors.append(f'{rel}: documentation/review changed; source review must be refreshed')
                if len((root / rel).read_text().split()) < 40:
                    raise ValueError(f'{field}: insufficient substantive content')
            human, _ = parse_doc((root / entry['human_doc']).read_text())
            ai, _ = parse_doc((root / entry['ai_doc']).read_text())
            if human.get('pair_role') != 'human' or ai.get('pair_role') != 'ai':
                raise ValueError('technical documentation needs human/AI roles')
            if human.get('pair_doc_id') != ai.get('doc_id') or ai.get('pair_doc_id') != human.get('doc_id'):
                raise ValueError('technical documentation must be reciprocal')
            if human.get('document_type') != 'technical' or ai.get('document_type') != 'technical':
                raise ValueError('code documentation must be technical, separate from business rules')
            if not entry.get('reviewed_by') or not entry.get('reviewed_on'):
                raise ValueError('missing review identity/date')
            if entry.get('business_rule_docs'):
                for rel in entry['business_rule_docs']:
                    meta, _ = parse_doc((root / rel).read_text())
                    if meta.get('document_type') != 'business_rule':
                        raise ValueError('business_rule_docs must point to business-rule documents')
            elif not entry.get('no_business_rule_reason'):
                raise ValueError('business rules need separate docs or non-applicability reason')
            if not isinstance(entry['sources'], dict) or (not entry['sources'] and not entry.get('removed_sources')):
                raise ValueError('sources must be nonempty path/hash map')
            for rel, checksum in entry.get('removed_sources', {}).items():
                if (root / rel).exists() or not isinstance(checksum, str) or not re.fullmatch('[0-9a-f]{64}', checksum):
                    raise ValueError('removed source must be absent with its prior SHA256')
                removed.add(rel)
            for rel, checksum in entry['sources'].items():
                if rel in covered:
                    raise ValueError(f'duplicate coverage {rel}')
                covered[rel] = entry
                path = root / rel
                if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
                    raise ValueError('unsafe source coverage path')
                if (affected is None or rel in affected) and (not path.is_file() or digest(path) != checksum):
                    errors.append(f'{rel}: code changed; update hDS documentation and review evidence')
            evidence(root, entry, errors, affected)
        except (ValueError, KeyError, TypeError, OSError, yaml.YAMLError) as exc:
            errors.append(f'coverage unit {entry.get("unit_id", "unknown")}: {exc}')
    for path in paths:
        rel = path.relative_to(root).as_posix()
        if rel not in covered:
            errors.append(f'{rel}: no reviewed human/AI technical documentation coverage')
    for rel in affected or ():
        path = root / rel
        if path.suffix.lower() in SUFFIXES and not path.exists() and not set(path.relative_to(root).parts) & TRANSIENT and rel not in removed:
            errors.append(f'{rel}: removed source needs engineering removal evidence and documentation update')
