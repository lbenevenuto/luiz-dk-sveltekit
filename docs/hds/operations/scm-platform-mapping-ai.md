---
doc_id: HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-AI
title: Mapeamento de Governança do hDS para GitHub, GitLab e Bitbucket — Estrutura
  para IA
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-HUMAN
topic_id: OS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING
---

# Objetivo

Definir equivalências de implementação da governança do hDS em diferentes plataformas SCM.

# Política canônica

A política é definida na documentação do hDS. Recursos de plataforma são implementações derivadas.

# Capacidades mínimas necessárias

- proteção da branch principal;
- revisão rastreável;
- bloqueio de merge com critérios;
- ownership por área;
- checks automáticos quando possível.

# Equivalências

## GitHub

- review_request := pull request
- branch_protection := required reviews + status checks
- ownership_adapter := CODEOWNERS opcional

## GitLab

- review_request := merge request
- branch_protection := protected branches + approval rules
- ownership_adapter := grupos e approval rules

## Bitbucket

- review_request := pull request
- branch_protection := branch permissions + merge checks
- ownership_adapter := default reviewers e regras de branch

# Regra de interpretação

Não deduzir governança a partir de um único mecanismo de plataforma. Ler sempre a documentação canônica do hDS.
