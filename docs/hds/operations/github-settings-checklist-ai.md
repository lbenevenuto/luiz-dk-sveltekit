---
doc_id: HDS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST-AI
title: Checklist de Configuração de Repositório Git para Operar o hDS — Estrutura
  para IA
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST-HUMAN
topic_id: OS-DOCS-HDS-OPERATIONS-GITHUB-SETTINGS-CHECKLIST
---

# Objetivo

Definir checklist mínimo de configuração de repositório Git para operação do hDS.

# Itens obrigatórios

- branch principal definida;
- política de revisão definida;
- política de merge definida;
- política de versionamento e release definida;
- ownership canônico documentado;
- validação automatizada habilitada quando possível.

# Itens recomendados

- bloqueio de push direto em branch principal;
- checks obrigatórios antes do merge;
- template de PR/MR;
- hooks locais compartilháveis.
