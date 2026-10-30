"""Validate metadata, explicit pairs, revision records and Markdown basics."""
from datetime import date
from .scope import excluded
import re
import yaml
from .common import REQUIRED, TYPES, parse_doc, version_tuple, check_date

RESIDUAL = re.compile(r'||turn\d+(?:file|search)\d+|/Users/|/workspace/|file://', re.I)
PLACEHOLDER = re.compile(r'<(?:owner|voce|você|ID|Título|audiencia)>|\{\{[^}]+\}\}|\bTBD\b|\bTODO\s*:|@hds-maintainers',re.I)

def scan(root,config,errors,warnings):
    documents = {}
    ids = {}
    for path in sorted(root.rglob('*.md')):
        rel = path.relative_to(root).as_posix()
        if excluded(path.relative_to(root), config):
            continue
        try:
            if path.is_symlink():
                raise ValueError('symlink forbidden')
            text=path.read_text(encoding='utf-8')
            data,body=parse_doc(text)
        except (ValueError,OSError,yaml.YAMLError) as exc:
            errors.append(f'{rel}: {exc}')
            continue
        for key in REQUIRED:
            if key not in data or data[key] in (None,'',[]):
                errors.append(f'{rel}: missing {key}')
        for key in ['doc_id','title','owner','lang','status','audience','document_type']:
            if not isinstance(data.get(key),str):
                errors.append(f'{rel}: {key} must be string')
        doc_id=data.get('doc_id')
        if isinstance(doc_id,str):
            if not re.fullmatch(r'[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+',doc_id):
                errors.append(f'{rel}: invalid doc_id')
            if doc_id in ids:
                errors.append(f'{rel}: duplicate doc_id {doc_id}')
            else:
                ids[doc_id]=rel
        if data.get('status') not in config['doc_status_values']:
            errors.append(f'{rel}: invalid status')
        if data.get('audience') not in config['audiences']:
            errors.append(f'{rel}: invalid audience')
        if data.get('document_type') not in TYPES:
            errors.append(f'{rel}: invalid document_type')
        if not isinstance(data.get('lang'),str) or not re.fullmatch(r'[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*',data['lang']):
            errors.append(f'{rel}: invalid lang')
        tags=data.get('tags')
        if not isinstance(tags,list) or not tags or any(not isinstance(t,str) or not t for t in tags):
            errors.append(f'{rel}: tags must be nonempty list of strings')
        try:version_tuple(data.get('version'))
        except ValueError:errors.append(f'{rel}: invalid version')
        check_date(data.get('last_updated'),rel+' last_updated',errors)
        if type(data.get('pair_required')) is not bool:
            errors.append(f'{rel}: pair_required must be boolean')
        if rel.endswith(('-human.md','-ai.md')) and data.get('document_type')!='template' and data.get('pair_required') is not True:
            errors.append(f'{rel}: named human/AI document must declare pair')
        if data.get('document_type') in config['pair_required_types'] and data.get('pair_required') is not True:
            errors.append(f'{rel}: this document_type requires human/AI pair')
        residual_scope = body if config.get('repository_role') == 'standard' else re.sub(r'/Users/|/workspace/|file://', '', body)
        if RESIDUAL.search(residual_scope):
            errors.append(f'{rel}: residual project, conversation or machine reference')
        if data.get('status')=='approved' and PLACEHOLDER.search(re.sub(r'`[^`\n]+`', '', body)+'\n'+str(data.get('owner'))):
            errors.append(f'{rel}: unresolved placeholder in approved document')
        for key in ['related_docs','sources']:
            if key in data and (not isinstance(data[key],list) or any(not isinstance(s,str) for s in data[key])):
                errors.append(f'{rel}: {key} must be list of strings')
        lint(rel,body,errors)
        documents[rel]=(data,body)
    check_pairs(documents,ids,errors)
    return documents,ids

def lint(rel,body,errors):
    fence=None
    headings=[]
    for n,line in enumerate(body.splitlines(),1):
        match=re.match(r'^\s*(`{3,}|~{3,})',line)
        if match:
            marker=match[1]
            if fence is None:fence=marker
            elif marker[0]==fence[0] and len(marker)>=len(fence):fence=None
            continue
        if fence:continue
        if re.search(r'\t',line):errors.append(f'{rel}:{n}: tab outside code fence')
        if line.rstrip()!=line and not (line.endswith('  ') and not line.endswith('   ')):
            errors.append(f'{rel}:{n}: trailing whitespace')
        h=re.match(r'^(#{1,6})\s+(.+)',line)
        if h:
            level=len(h[1])
            if headings and level>headings[-1]+1:
                errors.append(f'{rel}:{n}: skipped heading level')
            headings.append(level)
    if fence:errors.append(f'{rel}: unclosed code fence')
    if not headings:errors.append(f'{rel}: no Markdown heading')

def check_pairs(documents,ids,errors):
    topics={}
    for rel,(data,_) in documents.items():
        for ref in data.get('related_docs',[]) if isinstance(data.get('related_docs',[]),list) else []:
            if ref not in ids:errors.append(f'{rel}: unknown related_docs ID {ref}')
        if data.get('status')=='deprecated':
            if data.get('superseded_by') not in ids or not data.get('deprecation_reason'):
                errors.append(f'{rel}: deprecation requires successor and reason')
        if data.get('pair_required') is not True:continue
        role=data.get('pair_role')
        partner=ids.get(data.get('pair_doc_id'))
        topic=data.get('topic_id')
        if role not in {'human','ai'} or not isinstance(topic,str) or not topic:
            errors.append(f'{rel}: invalid pair_role/topic_id')
        else:topics.setdefault(topic,[]).append(role)
        if not partner or partner==rel:
            errors.append(f'{rel}: missing or self pair_doc_id')
            continue
        other=documents[partner][0]
        if other.get('pair_doc_id')!=data.get('doc_id') or other.get('pair_required') is not True:
            errors.append(f'{rel}: pair is not reciprocal')
        if other.get('pair_role')==role or other.get('topic_id')!=topic:
            errors.append(f'{rel}: pair role/topic mismatch')
        for key in ['version','last_updated','status','owner','lang']:
            if data.get(key)!=other.get(key):errors.append(f'{rel}: pair {key} mismatch')
    for topic,roles in topics.items():
        if sorted(roles)!=['ai','human']:errors.append(f'{topic}: must identify exactly one human/AI pair')
