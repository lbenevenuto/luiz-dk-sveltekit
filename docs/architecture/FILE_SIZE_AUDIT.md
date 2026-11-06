---
doc_id: OS-DOCS-ARCHITECTURE-FILE-SIZE-AUDIT-MD
title: File Size Audit — luiz-dk-sveltekit
version: 0.1.0
status: review
owner: project-owner
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- agentic-os
document_type: guide
pair_required: false
---

# File Size Audit

## Policy

Preferred maximum is 300 lines. Hand-maintained source above 500 lines is a blocking failure and must be refactored before completion. A plan or source-size waiver does not make it pass. Read docs/DOCUMENTED_ENGINEERING_STANDARD.md.

## Initial status

Run `python3 scripts/validate_file_size_policy.py` after bootstrap and before feature stacking in adopted codebases.

## Required action

Record overloaded files, waivers, and structural refactor plans here.
