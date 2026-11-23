---
name: test-strategy
version: 1.2.0
description: "Test Strategy for production-grade agentic delivery"
owner: "hyst / Marcelo Moreira"
---
# Test Strategy Skill

## When to use
Use this skill when the task requires test planning, coverage design or validation strategy. It is intended for production-grade projects using the hyst Agentic Harness, hDS, gold-standard engineering and banking-grade security expectations.

## When not to use
Do not use this skill to bypass an implementation contract, ignore project architecture, skip security review, replace objective sensors with subjective judgment, access production data without authorization, or create changes outside the approved scope.

## Inputs
- User request, issue, ticket or implementation contract.
- Relevant hDS documents and active project state.
- Code paths, architecture constraints and quality gates.
- Security, privacy, tenant, performance and compatibility constraints.
- Expected output, acceptance criteria and validation commands.

## Instructions
Map risk to unit, integration, contract, E2E, smoke, regression, security and golden-file tests. Prioritize sensors that prevent repeat failures.

Use progressive disclosure. Load only the files needed for the current decision. Prefer reuse and extension before new code. If risk appears, update `AGENT_BLOCKERS.md` or `AGENT_DECISIONS.md`. Keep outputs reviewable and traceable.

## Outputs
Test plan, test implementation notes and validation checklist.

## Validation
Run the applicable sensors through `bash scripts/run_all_checks.sh` plus stack-specific lint, typecheck, tests and build when available. Record results in `.agentic-harness/state/AGENT_VALIDATION.md`. If validation fails, do not declare completion; create a blocker or self-healing task within the approved contract.
