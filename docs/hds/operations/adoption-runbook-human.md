---
doc_id: HDS-DOCS-HDS-OPERATIONS-ADOPTION-RUNBOOK-HUMAN
title: Adoção do hDS — visão humana
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-ADOPTION-RUNBOOK-AI
topic_id: OS-DOCS-HDS-OPERATIONS-ADOPTION-RUNBOOK
---

# Adoção do hDS

## Projeto novo

Extraia em pasta vazia, instale dependências e rode os checks. Ajuste identidade e ownership, inicialize Git se necessário, instale hooks e selecione os templates necessários. Crie contexto de projeto, arquitetura, roadmap, resumo executivo e par de regras/processos quando aplicável. Registre revisões e fontes reais.

## Projeto existente

Siga o [upgrade revisado](upgrade-v2-human.md). Não copie este pacote por cima da raiz: compare AGENTS, guardrails, scripts e CI. Preserve IDs e documentação vigente. Material selecionado como histórico pode ser copiado pelo script de migração.

## Governança de plataforma

GitHub: workflow incluído. GitLab/Bitbucket: adapte e ative arquivos de `ci/`. Configure identidades reais para ownership, revisores, checks obrigatórios e proteção da branch. Nada disso é ativado automaticamente pelo ZIP.

## Critério de pronto

Documentos selecionados completos, metadados válidos, evidências reais, pares consistentes, legacy separado, checks verdes e responsabilidades definidas. Para trabalho compartilhado, revisão e proteção devem estar efetivamente configuradas.
