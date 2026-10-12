---
doc_id: HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-HUMAN
title: Mapeamento de Governança do hDS para GitHub, GitLab e Bitbucket — Visão Humana
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-AI
- HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-AI
topic_id: OS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING
---

# Objetivo

Explicar como aplicar o mesmo modelo de governança do hDS em diferentes plataformas de Git sem acoplar o sistema a uma só ferramenta.

# Princípio principal

A governança canônica do hDS é definida em documentação. A plataforma apenas implementa essa governança com os recursos disponíveis.

# Elementos de governança que devem existir em qualquer plataforma

- branch principal protegida;
- revisão rastreável;
- bloqueio de merge sem critérios mínimos;
- responsabilidade por área;
- checks automatizados quando disponíveis;
- política de release e versionamento.

# GitHub

Implementações típicas:

- pull requests;
- branch protection;
- required status checks;
- required reviews;
- `CODEOWNERS` quando fizer sentido.

Observação importante: `CODEOWNERS` é um adaptador opcional da plataforma, não a definição canônica de ownership do hDS.

# GitLab

Implementações típicas:

- merge requests;
- protected branches;
- approval rules;
- approvals por grupo ou função;
- pipelines e regras de merge.

# Bitbucket

Implementações típicas:

- pull requests;
- branch permissions;
- default reviewers;
- merge checks;
- políticas de integração configuradas no workspace ou repositório.

# Como escolher a implementação

A equipe deve preservar a intenção da governança e adaptar a mecânica técnica à plataforma. O erro é confundir o mecanismo específico da ferramenta com a política do sistema.

# Ownership sem depender de usuário individual

Ownership pode ser expresso como:

- papel;
- função;
- time;
- grupo;
- área responsável.

Se a plataforma suportar amarrar isso a usuários ou grupos reais, ótimo. Se não suportar da forma ideal, a documentação continua sendo a fonte de verdade da responsabilidade.
