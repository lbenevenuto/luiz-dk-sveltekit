---
doc_id: OS-DOCS-VISUAL-REFERENCE-HUMAN-PARITY-STANDARD-MD
title: Visual Reference & Human Parity Standard
version: 1.0.1
status: approved
owner: FDE Lead
lang: en-US
audience: tech
last_updated: '2026-10-12'
introduced_in_agentic_os: 1.6.3
tags:
- agentic-os
document_type: guide
pair_required: false
standard_version: 1.0.0
---

# Visual Reference & Human Parity Standard

## Purpose

This standard governs claims of visual or UX/UI fidelity when a project has an approved executable visual reference. It protects observable product intent while keeping automated comparison in its proper role as evidence rather than final design authority.

## Conditional trigger

The Visual Review Gate is mandatory when both conditions are true:

1. an approved executable visual reference exists; and
2. the implementation, migration, modernization, replatforming or release claims visual, UX or UI fidelity to that reference.

The existence of a frontend alone does not trigger this gate.

A reference may be a controlled external application, an approved prototype, a legacy frontend, a previous release, a pinned branch/commit or another executable implementation. No source type has special authority merely because of its tooling or vendor.

## Authority model

`AUTOMATED VISUAL COMPARISON = evidence / triage`

`HUMAN VISUAL ACCEPTANCE = final visual parity authority`

Agents must not claim visual parity from textual descriptions, code inspection, isolated screenshots or pixel thresholds alone. Automated exactness can support review but cannot grant Human acceptance. An automated difference is a finding, not an automatic rejection.

## Parity is not Taste

Visual Review answers: **Did we faithfully reproduce the approved reference?**

Taste and Quality Review answers: **Is this a good experience?**

A faithful reproduction may still fail a broader Taste Review. A product-quality judgment must not be silently converted into a parity judgment, or vice versa.

## Reference and target identity

Every governed run must pin immutable identity for both sides. Identity should use a commit SHA, immutable release/version, content hash or equivalent controlled identifier. The run must also pin the required scenario matrix and relevant viewport matrix.

If reference identity, target identity, required scenario matrix or relevant viewport matrix changes after Human acceptance, the prior acceptance remains historically valid only for its old run. Current parity becomes `STALE` and requires a new run. Version 1.0 of this standard permits no automatic acceptance carry-forward.

## Scenario matrix

Coverage is declared as executable scenarios, not pages alone. A scenario may identify:

- category or surface;
- route;
- observable state;
- interactions;
- viewport;
- deterministic data condition;
- frozen clock/timezone when relevant.

The required matrix must be known before a parity-dependent gate closes.

## Evidence and provenance

A run must preserve enough provenance to answer what was compared and how. At minimum retain:

- run ID and schema version;
- reference identity and source kind;
- target identity and source kind;
- scenario-matrix identity/hash;
- relevant viewport-matrix identity/hash;
- runtime identity/provenance;
- automated comparison metadata;
- Human review decision;
- evidence hash/index or durable evidence locator.

Large screenshot sets do not have to be Git-tracked. They must, however, remain durably retained somewhere appropriate to the project whenever they are evidence for an accepted gate.

## Immutability

Historical accepted evidence must not be silently overwritten.

- `run.json` is immutable once created.
- completed capture evidence is immutable for that run;
- completed comparison evidence and diff artifacts are immutable for that run;
- Human review may evolve while `pending-review`;
- `human-accepted` and `human-rejected` are terminal for that run;
- report regeneration must not silently mutate terminal evidence.

A new comparison against changed identity uses a new run.

## Human Acceptance

Human acceptance is run-level authority. A reviewer does not need to click an approval action for every pair when the complete matrix is automatically captured and all pairs remain navigable. Pair-level decisions may record exceptions, rejections, notes and supporting detail.

A run may close as Human-accepted only when:

1. required scenarios/viewports were captured;
2. evidence and provenance are preserved;
3. automated comparison completed;
4. reported/material differences were available for review;
5. the Human reviewer explicitly accepts that run.

## Waivers

`WAIVED` is a governance/gate status, not a Visual Review Harness Human status. Only an authorized Human can waive the conditional gate. A waiver records reason, scope, authority and compensating validation. The Harness must never grant a waiver.

## Existing projects

This standard does not silently mutate existing projects. Projects may adopt it through a new capsule, explicit capsule upgrade, reviewed policy sync or deliberate backport.
