---
doc_id: OS-DOCS-CONTINUITY-STANDARD-MD
title: Project continuity and enforced checkpoints
owner: hyst
lang: en
audience: tech
tags:
- agentic-os
document_type: guide
pair_required: false
status: review
version: 0.1.1
last_updated: '2026-10-12'
---

# Project continuity and enforced checkpoints

## Purpose and ownership

A replacement agent resumes from the directory: operating instructions, hDS
business and technical contracts, implementation, tests, Git and saved work state.
AGENTS.md contains operating rules. AGENT_STATE, PROGRESS, TODO, DECISIONS,
BLOCKERS, VALIDATION and HANDOFF carry different aspects of the same active state.
The canonical paths are fixed in .agentic-harness/continuity-config.yml. A capsule
uses root AGENT files; the OS standard uses .agentic-harness/state/. Other paths
must redirect to the canonical records rather than maintain competing live state.

The active pointer is .agentic-harness/continuity.yml. It points to the newest
immutable checkpoint, whose hash chain preserves earlier records, complete state
snapshots and referenced evidence. Canonical Markdown is a human-readable
presentation generated from explicitly supplied facts; its checkpoint, phase,
outcome and hashes must agree with the structured record. History is append-only
and cannot be rewritten or deleted relative to the real Git base.

## Required operational checkpoints

Run python3 scripts/resume_project.py at session entry. Inspect the reported phase,
current task, pending acceptance criteria, decisions, blockers, questions, actual
validation status, next action and reading order. Reconcile actual Git status,
uncommitted files, tests, contracts and observed external actions before changing
anything. A discrepancy is work to reconcile, never permission to discard changes
or assume that a previous command succeeded.

Save explicit checkpoints before starting implementation, immediately after a
material decision or external action, after validation milestones, at least every
15 minutes of substantive work, and before handoff or planned interruption. A hook
can enforce the saved state at commit/push; it cannot observe an agent's internal
reasoning or force a checkpoint during an abrupt process crash. The new agent
recovers the last persisted facts and reconciles later filesystem changes. No
claim of automatic capture of 100% of conversations, memory or unsaved decisions.

## Recording facts and validation

Prepare a request from docs/_templates/harness/template-checkpoint.yml and replace
all incomplete fields with observed facts. Tasks have stable IDs, titles, statuses,
acceptance criteria, remaining work and evidence for completion. Record decisions
with rationale and evidence; blockers reference tasks; questions remain explicit.
Empty lists need a substantive non-applicability/assessment statement. An empty
question list must never mean requirements were confirmed without inspection.

Validation records contain argument-array command, actual status (passed, failed,
not_run), exit code, result and captured artifact when executed. The recorder does
not execute a supplied command or invent its result. Completion cannot coexist
with pending work, open blockers/questions, failed or unexecuted required checks.
Blocked work needs an open blocker. Interrupted and in-progress checkpoints may
preserve pending validations without claiming completed delivery. Existing
engineering, documentation and product gates still block their own violations.

Run python3 scripts/record_checkpoint.py --input /path/to/request.yml to capture
working changes. For a partial commit, stage implementation first and use
--scope staged: changed-file hashes come from the exact Git index, while state
updates are prepared in the working tree. Inspect and stage all seven canonical
state files, new checkpoint history, continuity pointer, revision register and
referenced evidence together. The recorder never stages files automatically.
Do not put a temporary request into Git unless it is intentionally part of the
change; the checkpoint archives the supplied request independently.

## Enforced commit consistency

Every changed project file needs an active checkpoint whose file hash or deletion
matches the indexed/committed bytes. State files must match the active checkpoint
and its archived snapshots. Evidence must exist and match its recorded hash.
A new project change requires a newer checkpoint than the base. Missing controls,
stale state, inconsistent completion, absent tasks, corrupted archives, omitted
changes, history rewrite or configuration substitution fail. Pre-push and CI use
the same snapshot implementation. An unstaged checkpoint cannot approve staged
code, and an unstaged repair cannot hide the committed state.

History, its head and fixed configuration are checked independently to avoid a
self-referential hash cycle. PACKAGE_MANIFEST.json is a generated release receipt
checked separately by verify_package.py. Neither exception exempts product files.
Untouched inherited debt remains queued and does not block unrelated correction;
checkpoint requirements apply to the actual changed unit, not a demand to repair
all legacy code.

## Retention and recovery

Persist local checkpoints frequently and commit/push at approved delivery
boundaries. Reinstalling Cursor is recoverable if the directory or Git backup is
preserved. Uncommitted checkpoints survive a process restart in that directory;
a fresh clone contains only what was committed and pushed. Never store credentials
in checkpoints. A failed recording is reported as inconsistent: preserve its
request/state/evidence files and reconcile deliberately; do not silently rewrite
an earlier event. Independent agent truth and semantic quality still require
review. The enforced guarantees are persistence of recorded facts, structural
consistency, freshness, traceability and immutable committed history.

## Pending queue and decision retention

Omitting a task never completes it. The recorder carries forward every previously unfinished task, including tasks omitted by older checkpoints. The active checkpoint must contain the unresolved inventory reconstructed from history. Closing a task requires explicit done evidence; cancellation additionally requires `cancellation_reason` with substantive authority/reason and nonempty `evidence`. Recovery exposes historical decisions as well as current decisions, so an empty new-decision list does not erase previous context.
