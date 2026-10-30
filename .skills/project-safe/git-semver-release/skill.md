---
name: git-semver-release
description: Skill para preparação de commit, tag, changelog, release ou bootstrap de repositório com padrão enterprise-grade, evidência objetiva e sem alucinação.
version: 1.4.0
owner: "hyst / Marcelo Moreira"
---
# Git SemVer Release

## When to use
Use this skill when the task involves preparação de commit, tag, changelog, release ou bootstrap de repositório. Apply it when evidence, deterministic execution, enterprise readiness, Git/SemVer, no-workaround discipline or delivery pacing must be reviewed.

## When not to use
Do not use this skill to avoid implementation, hide failures, bypass security review, skip hDS, skip tests or replace an objective validation command. Do not use it when the task is purely conversational and has no project impact.

## Inputs
- Scope or problem statement.
- Relevant files, docs, logs, tickets or code.
- Acceptance criteria and active implementation contract.
- Known security, performance, delivery and operation risks.
- Available validation commands and expected evidence.

## Instructions
1. Identify the source of truth.
2. Separate facts, hypotheses and gaps.
3. Execute the review without inventing data.
4. Recommend a real resolution, not a workaround that hides the root cause.
5. Record decisions, evidence, validation and residual risks.
6. Update hDS/state when the review changes project direction or delivery status.

## Outputs
- Objective decision or readiness status.
- Evidence used.
- Risks and gaps.
- Required corrective actions.
- Validation commands and results.
- Final status: approved, rejected or blocked.

## Validation
Record the result in `.agentic-harness/state/AGENT_VALIDATION.md` when the skill affects code, documentation, architecture, release or delivery state. If validation fails, create or update `.agentic-harness/state/AGENT_BLOCKERS.md` instead of declaring completion.
