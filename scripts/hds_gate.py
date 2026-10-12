#!/usr/bin/env python3
"""Deterministic offline gate for hDS documentation."""
from pathlib import Path
import argparse,json,sys
try:
    import yaml
except ImportError:
    raise SystemExit('Install requirements-docs.txt with Python 3.11+ before validation.')
from hds_validation.common import load_yaml,REQUIRED,version_tuple
from hds_validation.scope import excluded
from hds_validation.documents import scan
from hds_validation.links import validate as validate_links
from hds_validation.registries import validate as validate_registries
from hds_validation.evolution import validate as validate_evolution

def run(root,base=None,legacy_documents=None,git_root=None):
    errors=[];warnings=[]
    required=['README.md','AGENTS.md','GUARDRAILS.md','VERSION','CHANGELOG.md',
              '.hds/config.yml','.hds/ownership.yml','.hds/findings.yml','.hds/assets.yml','.hds/waivers.yml',
              'docs/evidence/revision-register.yml','requirements-docs.txt',
              'scripts/run_all_checks.sh',
              'docs/hds/operations/adoption-runbook-human.md','docs/hds/operations/adoption-runbook-ai.md']
    for rel in required:
        if not (root/rel).is_file():errors.append(f'{rel}: required file missing')
    try:
        config=load_yaml((root/'.hds/config.yml').read_text(encoding='utf-8'))
        if not isinstance(config,dict):raise ValueError('config must be mapping')
        if legacy_documents:
            config['independently_governed_paths'] = config.get('independently_governed_paths',[]) + sorted(legacy_documents)
        if config.get('schema_version')!='2.0.0':raise ValueError('unsupported schema version')
        if config.get('repository_role') not in {'standard','consumer'}:raise ValueError('invalid repository_role')
        if config.get('audiences')!=['tech','manager','c-level']:raise ValueError('invalid canonical audiences')
        if config.get('doc_status_values')!=['draft','review','approved','deprecated']:raise ValueError('invalid canonical statuses')
        if set(config.get('required_front_matter',[]))!=REQUIRED:raise ValueError('required_front_matter differs from contract')
        if config.get('pair_required_types')!=['business_rule','process','technical']:raise ValueError('invalid required pair types')
        for key in ['ownership_file','findings_file','assets_registry','waivers_file','default_language']:
            if not isinstance(config.get(key),str) or not config[key]:raise ValueError(f'invalid {key}')
        limits=config.get('line_limits',{})
        if type(limits.get('warning')) is not int or type(limits.get('maximum')) is not int or not 0<limits['warning']<limits['maximum']<=500:
            raise ValueError('invalid line_limits or maximum > 500')
        version_tuple(config.get('standard_version'))
        if config.get('repository_role')=='standard' and version_tuple(config.get('standard_version'))!=version_tuple((root/'VERSION').read_text().strip()):
            raise ValueError('standard_version differs from VERSION')
    except (ValueError,OSError,TypeError,yaml.YAMLError) as exc:
        errors.append(f'config: {exc}')
        return {'success':False,'errors':errors,'warnings':warnings,'documents':0}
    try:
        for path in root.rglob('*'):
            if path.suffix not in {'.yml','.yaml'} or not path.is_file():continue
            if excluded(path.relative_to(root),config):continue
            try:load_yaml(path.read_text(encoding='utf-8'))
            except (ValueError,yaml.YAMLError) as exc:errors.append(f'{path.relative_to(root)}: invalid YAML: {exc}')
        documents,ids=scan(root,config,errors,warnings)
        validate_links(root,documents,errors)
        revisions=validate_registries(root,config,documents,ids,errors,warnings)
        if base:validate_evolution(root,base,documents,revisions,errors,config,git_root)
    except (ValueError,TypeError,KeyError,OSError,yaml.YAMLError) as exc:
        errors.append(f'validation cannot complete on malformed input: {type(exc).__name__}: {exc}')
        documents={}
    return {'success':not errors,'errors':errors,'warnings':warnings,'documents':len(documents),
            'external_links_checked':False,'semantic_parity_checked':False,'base_ref_checked':bool(base)}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--base-ref',help='real Git commit/ref used for evolution checks')
    parser.add_argument('--json',action='store_true')
    args=parser.parse_args();result=run(args.root.resolve(),args.base_ref)
    if args.json:print(json.dumps(result,ensure_ascii=False,indent=2))
    else:
        for warning in result['warnings']:print('WARNING: '+warning)
        for error in result['errors']:print('ERROR: '+error)
        print('HDS VALIDATION PASSED' if result['success'] else 'HDS VALIDATION FAILED')
        print(f"Documents checked: {result['documents']}; external links/semantic parity require separate review.")
    return 0 if result['success'] else 1

if __name__=='__main__':sys.exit(main())
