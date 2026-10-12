"""Read-only Git evolution gate."""
import subprocess
from pathlib import Path
from .scope import excluded
from .common import parse_doc,version_tuple,valid_date,load_yaml

def git(root,*args):
    p=subprocess.run(['git','-C',str(root),*args],text=True,capture_output=True)
    if p.returncode:raise ValueError(p.stderr.strip() or 'Git command failed')
    return p.stdout

def validate(root,base,documents,revisions,errors,config_override=None,git_root=None):
    repo=git_root or root
    try:
        resolved=git(repo,'rev-parse','--verify',base+'^{commit}').strip()
        names=git(repo,'ls-tree','-r','--name-only',resolved).splitlines()
    except ValueError as exc:
        errors.append(f'base-ref: {exc}');return
    config=config_override or load_yaml((root/'.hds/config.yml').read_text())
    previous={}
    for rel in names:
        if not rel.endswith('.md') or excluded(Path(rel),config):continue
        try:
            text=git(repo,'show',resolved+':'+rel)
            metadata,body=parse_doc(text)
            previous[metadata['doc_id']]=(rel,metadata,body,text)
        except (ValueError,KeyError):continue
    for rel,(metadata,body) in documents.items():
        doc_id=metadata.get('doc_id');old=previous.get(doc_id)
        if not old:continue
        if (root/rel).read_text(encoding='utf-8')==old[3]:continue
        try:
            if version_tuple(metadata['version'])<=version_tuple(old[1]['version']):
                errors.append(f'{rel}: changed document requires version increase')
            if valid_date(metadata['last_updated'])<valid_date(str(old[1]['last_updated'])):
                errors.append(f'{rel}: last_updated regressed')
        except ValueError as exc:errors.append(f'{rel}: evolution metadata {exc}')
        if not any(e.get('doc_id')==doc_id and e.get('version')==metadata.get('version') and e.get('action')=='updated' for e in revisions):
            errors.append(f'{rel}: changed document requires updated revision')
    current={m.get('doc_id') for m,_ in documents.values()}
    for doc_id,(rel,metadata,_,_) in previous.items():
        if doc_id not in current and not any(e.get('doc_id')==doc_id and e.get('action')=='removed' for e in revisions):
            errors.append(f'{rel}: removed identity requires removed revision')
    if '.hds/config.yml' not in names or 'VERSION' not in names:
        return
    try:
        old_version=git(repo,'show',resolved+':VERSION').strip()
        new_version=(root/'VERSION').read_text().strip()
        changed=git(repo,'diff','--name-only',resolved,'--').splitlines()
        changed+=git(repo,'ls-files','--others','--exclude-standard').splitlines()
        config=config_override or load_yaml((root/'.hds/config.yml').read_text())
        prefixes=('.hds/policies/','.github/','scripts/','tests/','ci/','docs/_templates/','docs/_shared/','docs/hds/')
        if config.get('repository_role')=='standard' and any(p.startswith(prefixes) for p in changed) and version_tuple(new_version)<=version_tuple(old_version):
            errors.append('VERSION: standard implementation/policy change requires version increase')
    except (ValueError,OSError) as exc:errors.append(f'standard evolution: {exc}')
