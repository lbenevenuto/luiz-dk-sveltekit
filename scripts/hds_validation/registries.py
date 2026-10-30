"""Ownership, evidence registries, asset integrity and scoped waivers."""
from datetime import date
from .scope import excluded
from fnmatch import fnmatchcase
import hashlib
from .common import load_registry,fields,unique_records,check_date,resolve_local,version_tuple

def validate(root,config,documents,ids,errors,warnings):
    areas=load_registry(root,config['ownership_file'],'areas',errors)
    for entry in areas:fields(entry,['path','owner','responsibility'],'ownership',errors)
    for rel in documents:
        if not any(isinstance(a.get('path'),str) and fnmatchcase(rel,a['path']) for a in areas):
            errors.append(f'{rel}: missing ownership coverage')
    revisions=load_registry(root,'docs/evidence/revision-register.yml','revisions',errors)
    revision_keys=set()
    for entry in revisions:
        fields(entry,['doc_id','version','date','author','change','action'],'revision',errors)
        if entry.get('action') not in {'created','updated','removed'}:errors.append('revision: invalid action')
        check_date(entry.get('date'),'revision date',errors)
        try:version_tuple(entry.get('version'))
        except ValueError:errors.append('revision: invalid version')
        doc_id=entry.get('doc_id');version=entry.get('version')
        if isinstance(doc_id,str) and isinstance(version,str):
            key=(doc_id,version)
            if key in revision_keys:errors.append(f'revision: duplicate {key}')
            revision_keys.add(key)
        if doc_id not in ids and entry.get('action')!='removed':errors.append(f'revision: unknown doc_id {doc_id}')
    for rel,(metadata,_) in documents.items():
        if (metadata.get('doc_id'),metadata.get('version')) not in revision_keys:
            errors.append(f'{rel}: current revision not registered')
        else:
            entry=next(e for e in revisions if e.get('doc_id')==metadata.get('doc_id') and e.get('version')==metadata.get('version'))
            if entry.get('date')!=metadata.get('last_updated') or entry.get('action')=='removed':
                errors.append(f'{rel}: revision date/action mismatch')
    findings=load_registry(root,config['findings_file'],'findings',errors)
    unique_records(findings,'finding_id','findings',errors)
    for entry in findings:
        fields(entry,['finding_id','status','severity','owner','location','evidence','impact','next_action','closure_criteria'],'finding',errors)
        if entry.get('status') not in {'open','in_progress','resolved','accepted_risk'}:errors.append('finding: invalid status')
        if entry.get('severity') not in {'low','medium','high','critical'}:errors.append('finding: invalid severity')
        try:
            if not resolve_local(root,entry.get('location')).exists():raise ValueError('missing location')
        except ValueError as exc:errors.append(f'finding: {exc}')
        if entry.get('status')=='resolved' and not entry.get('resolution_evidence'):errors.append('finding: resolved without evidence')
        if entry.get('status')=='accepted_risk':
            fields(entry,['approved_by','reason','expires_on'],'accepted_risk',errors)
            expiry=check_date(entry.get('expires_on'),'accepted_risk expiry',errors,True)
            if expiry and expiry<date.today():errors.append('finding: risk acceptance expired')
    validate_assets(root,config,documents,ids,errors)
    waivers=load_registry(root,config['waivers_file'],'waivers',errors)
    unique_records(waivers,'waiver_id','waivers',errors)
    approved=set()
    for entry in waivers:
        before=len(errors)
        fields(entry,['waiver_id','path','rule','reason','approved_by','approved_on','expires_on','compensating_control'],'waiver',errors)
        if entry.get('rule')!='file_size':errors.append('waiver: unsupported rule')
        start=check_date(entry.get('approved_on'),'waiver approved_on',errors)
        expiry=check_date(entry.get('expires_on'),'waiver expires_on',errors,True)
        if expiry and (expiry<date.today() or (start and expiry<start)):errors.append('waiver: expired or invalid interval')
        try:
            if not resolve_local(root,entry.get('path')).is_file():raise ValueError('missing waiver target')
        except ValueError as exc:errors.append(f'waiver: {exc}')
        if len(errors)==before:approved.add(entry['path'])
    size_checks(root,config,approved,errors,warnings)
    return revisions

def validate_assets(root,config,documents,ids,errors):
    assets=load_registry(root,config['assets_registry'],'assets',errors)
    unique_records(assets,'asset_id','assets',errors)
    registered=set()
    for entry in assets:
        fields(entry,['asset_id','kind','files','used_by','owner','last_updated','provenance','checksums'],'asset',errors)
        if entry.get('kind') not in {'diagram','image','pdf','data','other'}:errors.append('asset: invalid kind')
        check_date(entry.get('last_updated'),'asset last_updated',errors)
        files=entry.get('files');sources=entry.get('editable_sources');used_by=entry.get('used_by')
        if not isinstance(files,list) or not files or any(not isinstance(x,str) for x in files):
            errors.append('asset: invalid files');continue
        if not isinstance(sources,list) or any(not isinstance(x,str) for x in sources):
            errors.append('asset: editable_sources must be list');sources=[]
        if entry.get('kind')=='diagram' and not sources:errors.append('asset: diagram requires editable source')
        if not set(sources).issubset(files):errors.append('asset: sources must be included in files')
        if not isinstance(used_by,list) or not used_by or any(not isinstance(x,str) or x not in ids for x in used_by):
            errors.append('asset: invalid used_by');used_by=[]
        checksums=entry.get('checksums')
        if not isinstance(checksums,dict):errors.append('asset: invalid checksums');checksums={}
        if set(checksums)!=set(files):errors.append('asset: checksum paths must equal files')
        for rel in files:
            if not rel.startswith('docs/assets/'):errors.append(f'asset: invalid placement {rel}');continue
            if rel in registered:errors.append(f'asset: file registered twice {rel}')
            registered.add(rel)
            try:
                p=resolve_local(root,rel)
                if not p.is_file():raise ValueError('missing file')
                if hashlib.sha256(p.read_bytes()).hexdigest()!=checksums.get(rel):raise ValueError('SHA-256 mismatch')
            except (ValueError,OSError) as exc:errors.append(f'asset {rel}: {exc}')
        for doc_id in used_by:
            from .links import extract,visible
            from urllib.parse import unquote,urlsplit
            consumer=ids[doc_id]
            links,_=extract(visible(documents[consumer][1]))
            targets={(root/consumer).parent.joinpath(unquote(urlsplit(link).path)).resolve() for link in links if not urlsplit(link).scheme}
            if not any((root/file).resolve() in targets for file in files):
                errors.append(f'asset: {doc_id} does not link its registered artifact')
    assets_dir=root/'docs/assets'
    for p in assets_dir.rglob('*') if assets_dir.exists() else []:
        if p.is_file() and p.name!='.gitkeep' and p.relative_to(root).as_posix() not in registered:
            errors.append(f'{p.relative_to(root)}: unregistered asset')

def size_checks(root,config,waivers,errors,warnings):
    maximum=config['line_limits']['maximum'];warning=config['line_limits']['warning']
    for p in root.rglob('*'):
        if not p.is_file() or p.suffix != '.md':continue
        rel=p.relative_to(root).as_posix()
        if excluded(p.relative_to(root), config):continue
        if rel in {'docs/evidence/revision-register.yml','PACKAGE_MANIFEST.json','VALIDATION_REPORT.json','SOURCE_PROVENANCE.json'}:continue
        if p.is_symlink():errors.append(f'{rel}: symlink forbidden');continue
        try:count=len(p.read_text(encoding='utf-8').splitlines())
        except UnicodeDecodeError:errors.append(f'{rel}: text file is not UTF-8');continue
        if count>maximum and rel not in waivers:errors.append(f'{rel}: exceeds file_size maximum ({count}>{maximum})')
        elif count>warning:warnings.append(f'{rel}: file_size warning ({count}>{warning})')
