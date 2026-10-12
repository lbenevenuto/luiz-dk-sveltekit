---
doc_id: HDS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST-HUMAN
title: Checklist de Configuração de Repositório Git para Operar o hDS — Visão Humana
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST-AI
- HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST-AI
topic_id: OS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST
---

# Objetivo

Fornecer um checklist prático de configuração para qualquer plataforma Git usada com hDS.

# Checklist mínimo

## Branch principal

- definir branch principal;
- impedir push direto quando o repositório for compartilhado;
- exigir revisão para mudanças relevantes;
- exigir checks automáticos quando disponíveis.

## Fluxo de revisão

- definir quem revisa por área;
- definir quando uma aprovação basta e quando são necessárias múltiplas;
- definir como lidar com mudanças urgentes.

## Merge

- escolher estratégia principal de merge;
- documentar quando squash é preferível;
- documentar quando merge commit é preferível;
- evitar que a equipe use múltiplas estratégias sem critério.

## Versionamento e release

- definir onde `VERSION` é mantido;
- definir quando `CHANGELOG.md` deve ser atualizado;
- definir como tags e releases serão feitos;
- alinhar a cadência à necessidade da organização.

## Ownership

- registrar ownership canônico em documentação;
- refletir ownership na plataforma se houver recurso adequado;
- não deixar áreas críticas sem responsável.

## Qualidade

- ativar validação em CI quando possível;
- instalar hooks locais quando útil;
- revisar templates de PR/MR.

# Observação

A política é independente da plataforma. O arquivo mantém seu nome para compatibilidade de navegação.
