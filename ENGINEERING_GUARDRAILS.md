---
doc_id: OS-DOCS-ENGINEERING-GUARDRAILS-MD
title: Global Engineering Guardrails
version: 1.3.0
status: approved
owner: FDE Lead
lang: en-US
audience: tech
last_updated: '2026-10-12'
introduced_in_agentic_os: 1.6.1
updated_in_agentic_os: 1.7.2
tags:
- agentic-os
document_type: guide
pair_required: false
---

# Global Engineering Guardrails

## Purpose

These rules are system-level engineering policy for Agentic Delivery OS capsules. They apply when the work involves implementation, integration, migration, modernization, replatforming, scaffolding, dependency use, or inherited technical structure. They are stack-agnostic and do not prohibit legitimate extensions or refactors when evidence supports them.

## G-OFFICIAL-API-FIRST — Understand Before Extending

Before creating a new abstraction or workaround to bypass behavior of a framework, library, SDK, ORM, database, Terraform provider, cloud SDK, build tool, test tool, CI/CD system, authentication component, observability platform, runtime, or integration already in use, identify the abstraction owner and understand its public contract first.

### Required investigation order

Prefer, in order:

1. the official API of the dependency already in use;
2. official configuration;
3. an official hook or supported extension point;
4. an official plugin, provider, or first-party integration;
5. composition through stable public APIs;
6. a minimal adapter built only on public contracts;
7. a custom wrapper, plugin, middleware, bridge, proxy, patch, structural override, monkey patch, additional abstraction layer, or permanent workaround only when the preceding options are demonstrably inadequate.

### Root-cause gate

Before custom work is accepted, check whether the apparent limitation is actually caused by a misplaced option, incorrect configuration, incorrect object/configuration shape, an existing feature, an incompatible version, an unknown hook, or supported behavior being used incorrectly.

Local types, schemas, generated declarations, installed package documentation, source code, and repository evidence may be sufficient. Internet access is not mandatory when authoritative local evidence is adequate.

### Evidence required for an exception

When custom behavior is still necessary, record at least:

- the problem being solved;
- the abstraction owner;
- official APIs/configuration/hooks/providers investigated;
- alternatives tested or ruled out with evidence;
- the objective reason official options are insufficient;
- maintenance cost and operational risk;
- validation/tests;
- ownership;
- a removal or replacement strategy when one is reasonably available.

A decision record or ADR is required when the custom solution creates a durable architectural boundary, maintenance burden, or compatibility risk.

### Follow-up rule

If a supported official mechanism later replaces an existing workaround, prefer the official mechanism when migration is safe, remove the workaround, run regression validation, and update the relevant decision record.

## G-PRESERVE-INTENT-NOT-ACCIDENTAL-COMPLEXITY — Preserve Intent, Not Accidental Complexity

During migration, copy, modernization, replatforming, adoption of an existing codebase, or ingestion of a prototype, preserve what represents approved product intent, observable behavior, contractual obligation, or explicit requirement. Do not preserve technical complexity merely because the source tool or source implementation happened to generate or require it.

### Preserve when it is part of the mandate

Preserve or explicitly maintain equivalence for items such as:

- UI/UX and approved visual behavior;
- functional behavior;
- contracts and interoperability requirements;
- data and data semantics;
- business rules;
- required compatibility;
- approved content and user experience;
- explicit non-functional requirements.

### Audit rather than preserve by reflex

Evaluate inherited elements such as:

- scaffolding;
- runtime choices;
- wrappers and adapters;
- build systems;
- dependencies;
- services;
- authentication/providers;
- generated boilerplate;
- cloud-specific assumptions;
- development tooling;
- temporary integrations;
- workarounds.

Origin alone is not a reason to remove an element, and existence alone is not a reason to preserve it.

### Evidence gate before removal or replacement

This rule does not authorize indiscriminate refactoring. Before removing or replacing inherited complexity:

- establish why it is not part of the product intent or required contract;
- measure or validate functional impact;
- measure visual impact when visual fidelity is relevant;
- preserve provenance of the source and the change;
- maintain rollback or reversibility appropriate to the risk;
- produce equivalence evidence when the mandate requires equivalence.

If intent cannot be distinguished from implementation accident with available evidence, record the uncertainty and request or obtain the required decision rather than guessing.

## G-LEGACY-CONVERGENCE — Improve What You Touch, Queue What You Do Not

New work must be compliant by construction. Existing technical debt does not authorize an agent to reproduce, extend, or normalize a known bad pattern. When work touches legacy code, the touched surface must not be made worse and must be brought toward the current engineering standard as a whole file before it can be committed. Untouched inherited files are queued and do not block unrelated changes.

### New-code obligation

An agent must not knowingly introduce:

- avoidable duplication of business logic, infrastructure logic, utilities, or abstractions;
- new parallel implementations of logic that already has a suitable canonical owner;
- oversized or multi-responsibility modules/functions/classes when a smaller supported structure is reasonably available;
- new architectural boundary violations;
- accidental complexity that is not required by product intent, compatibility, or an evidenced constraint;
- additional feature stacking on a surface already classified as structurally overloaded without the required plan or waiver.

### Touched-legacy obligation

When a unit modifies legacy code that is not compliant with current policy:

1. preserve required behavior and intent;
2. do not worsen the existing debt;
3. do not copy or extend a known bad pattern merely because it already exists;
4. prefer reuse or consolidation over adding another equivalent implementation;
5. repair all applicable file-level violations, including size and duplication, using safe behavior-preserving decomposition;
6. add or improve characterization/regression evidence when touched legacy behavior is insufficiently protected for the proposed change.

This is a governed convergence rule, not authorization for broad cleanup. A large file, long function, or similar-looking code is a signal for investigation, not by itself proof that a refactor is correct. The current file-size policy is authoritative for each new or edited file; a plan or adoption record does not exempt that file.

### Untouched legacy debt

When significant legacy debt is discovered outside the active unit:

- do not silently ignore a material finding;
- do not opportunistically perform an unrelated repository-wide refactor;
- record the debt through the project's existing governed finding, queue, TODO, blocker, or decision mechanism;
- include enough evidence to locate the surface, explain the problem, state risk/impact, and describe the likely remediation;
- create a separate remediation unit when correction would materially broaden scope.

Do not create a parallel debt-governance system when the project already has a canonical queue or finding mechanism.

### Completion gate

A unit must not be declared complete if the unit itself knowingly:

- introduces a new applicable engineering-guardrail violation;
- increases avoidable duplication;
- adds another implementation where a suitable canonical implementation should have been reused or consolidated;
- worsens a structural hotspot without an approved plan or waiver;
- leaves required validation for the touched legacy behavior red, skipped, or unsupported.

Pre-existing unrelated debt does not automatically block an otherwise compliant unit. Material debt discovered outside scope must remain visible and governed rather than being hidden or falsely attributed to the current change.

### Investigation signals

When relevant to the touched area, actively inspect for:

- duplicated business or infrastructure logic;
- oversized modules, classes, or functions;
- mixed responsibilities;
- dead or unreachable code;
- parallel abstractions solving the same problem;
- missing tests around touched legacy behavior;
- accidental complexity and workaround layers;
- inconsistent architectural patterns or ownership boundaries.

These signals require engineering judgment and evidence. They are not license for cosmetic churn or behavior-changing refactors.

## Generic Behavioral Examples

- If a framework property appears ignored, inspect the supported configuration shape and API before creating a plugin.
- If an ORM appears not to support a database operation, inspect its native API and supported SQL escape hatch before creating a parallel data-access layer.
- If an infrastructure provider appears not to support an attribute, inspect its schema and version support before introducing an external shell workaround.
- If a prototype uses a particular backend service but the mandate is visual/behavioral fidelity, preserve the approved experience and evaluate whether the service itself is required.
- If a source framework generated server-side rendering but the product mandate does not require it, evaluate SSR by requirement and equivalence evidence rather than preserving it automatically.

## Capsule Inheritance

New capsules exported by Agentic Delivery OS 1.6.1 or later receive this policy as `ENGINEERING_GUARDRAILS.md`. Capsule `START_HERE_FOR_AGENTS.md`, `AGENTS.md`, and `GUARDRAILS.md` must make it part of the mandatory operating context. Structural validation verifies presence, version, and rule identifiers; it does not attempt to prove semantically that every engineering decision complied.

## Existing Projects and Backport

Projects exported before this policy are not mutated automatically. They may inherit it through an explicit capsule upgrade, opt-in policy sync, or reviewed manual backport. The backport must preserve project-specific decisions and must not silently overwrite local guardrails.

## Scope and Exceptions

These rules do not impose a technology stack, prohibit custom extensions, require internet research when local authoritative evidence is sufficient, or require removal of source-system tooling solely because of its origin. They require understanding, evidence, and intentionality before durable complexity is added or inherited complexity is removed.

## Visual-reference specialization

When `G-PRESERVE-INTENT-NOT-ACCIDENTAL-COMPLEXITY` applies to a project with an approved executable visual reference and a fidelity mandate, visual equivalence evidence must follow `docs/VISUAL_REFERENCE_HUMAN_PARITY_STANDARD.md`. Automated comparison supports evidence and triage; Human Visual Acceptance remains the final parity authority.

## G-DOCUMENTED-ENGINEERING — Blocking quality and documentation

Read docs/DOCUMENTED_ENGINEERING_STANDARD.md. hDS is mandatory documentation.
New and changed implementations require separate business-rule and technical
human/AI pairs with provenance, source coverage and review evidence. Correct
blocking quality defects before completion. A refactor plan or a pending record
does not waive a failing engineering gate. Prefer cohesive reusable classes,
extensions/composition, helpers, functions and procedures over repeated code.
New or edited source above 500 lines fails; intact inherited violations are queued. Semantic duplication and architecture require
explicit review in addition to deterministic detection. No silent bypass.
