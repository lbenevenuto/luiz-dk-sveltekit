"""Shared parsing and safety contracts; no network or repository mutation."""
from pathlib import Path
from datetime import date
import re
import yaml

SEMVER = re.compile(r'^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$')
TYPES = {'guide','policy','business_rule','process','adr','rfc','runbook','template','example','record','technical'}
REQUIRED = {'doc_id','title','version','status','owner','lang','audience','last_updated','tags','document_type','pair_required'}

class UniqueLoader(yaml.SafeLoader):
    pass

def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f'Duplicate YAML key: {key}')
        result[key] = loader.construct_object(value_node, deep=deep)
    return result

UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)

def load_yaml(text):
    return yaml.load(text, Loader=UniqueLoader)

def version_tuple(value):
    if not isinstance(value, str) or not SEMVER.fullmatch(value):
        raise ValueError('expected numeric SemVer without leading zeros')
    return tuple(map(int, value.split('.')))

def valid_date(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        raise ValueError('expected YYYY-MM-DD string')
    return date.fromisoformat(value)

def parse_doc(text):
    match = re.match(r'^---\n(.*?)\n---(?:\n|$)(.*)$', text, re.S)
    if not match:
        raise ValueError('missing YAML front matter')
    metadata = load_yaml(match[1])
    if not isinstance(metadata, dict):
        raise ValueError('front matter must be mapping')
    return metadata, match[2]

def resolve_local(root, value):
    if not isinstance(value, str) or not value or '\\' in value:
        raise ValueError('invalid relative path')
    path = Path(value)
    if path.is_absolute() or '..' in path.parts:
        raise ValueError('registry path must be relative without traversal')
    target = root / path
    if not target.resolve().is_relative_to(root.resolve()):
        raise ValueError('path outside repository')
    if any((root / Path(*path.parts[:i])).is_symlink() for i in range(1,len(path.parts)+1)):
        raise ValueError('symbolic link forbidden')
    return target

def load_registry(root, rel, key, errors):
    try:
        payload = load_yaml(resolve_local(root,rel).read_text(encoding='utf-8'))
        if not isinstance(payload,dict) or payload.get('schema_version') != '2.0.0':
            raise ValueError('schema_version must be 2.0.0')
        records = payload.get(key)
        if not isinstance(records,list) or any(not isinstance(x,dict) for x in records):
            raise ValueError(f'{key} must be list of mappings')
        return records
    except (ValueError,OSError,yaml.YAMLError) as exc:
        errors.append(f'{rel}: {exc}')
        return []

def fields(entry, keys, label, errors):
    for key in keys:
        if key not in entry or entry[key] in (None,'',[]):
            errors.append(f'{label}: missing {key}')

def unique_records(records, key, label, errors):
    seen = set()
    for entry in records:
        value = entry.get(key)
        if not isinstance(value,str) or not value:
            errors.append(f'{label}: invalid {key}')
        elif value in seen:
            errors.append(f'{label}: duplicate {key} {value}')
        else:
            seen.add(value)

def check_date(value,label,errors,future_allowed=False):
    try:
        parsed = valid_date(value)
        if not future_allowed and parsed > date.today():
            raise ValueError('future date')
        return parsed
    except ValueError as exc:
        errors.append(f'{label}: {exc}')
        return None
