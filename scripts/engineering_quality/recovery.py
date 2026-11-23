"""Reconcile the persisted checkpoint with actual files and Git, without writes."""
from .continuity import validate, config, protected
from .continuity_history import head, validate_base, decision_history
from .change_scope import selected, git, has_head

def inspect(root):
    errors = []
    try:
        paths = selected(root,root)
        validate(root,errors,paths)
        validate_base(root,root,paths,'HEAD' if has_head(root) else None,errors)
        data = head(root)
        cfg = config(root)
        status = git(root,'status','--short')
        return dict(success=not errors, errors=errors, checkpoint_id=data['checkpoint_id'],
            phase=data['phase'], outcome=data['outcome'], current_task=data['current_task'],
            tasks=data['tasks'], decisions=data['decisions'], blockers=data['blockers'], questions=data['questions'],
            historical_decisions=decision_history(root),
            validation=data['validation'], next_action=data['next_action'], resume_checks=data['resume_checks'],
            canonical_state_files=cfg['state_files'],read_next=data['read_next'],git_status=status,
            changed_paths=sorted(p for p in paths if not protected(p)),
            instruction='Reconcile actual Git and unrecorded changes before implementation; preserve evidence and save a fresh checkpoint. Never infer approval or unsaved decisions.')
    except (OSError,ValueError,KeyError,TypeError,AttributeError) as exc:
        return dict(success=False,errors=errors+[str(exc)],instruction='Stop implementation and reconcile missing/corrupt continuity controls; do not overwrite the immutable history.')
