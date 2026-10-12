---
doc_id: HDS-DOCS-HDS-OPERATIONS-ADOPTION-RUNBOOK-AI
title: Adoção do hDS — contrato para agentes
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-ADOPTION-RUNBOOK-HUMAN
topic_id: OS-DOCS-HDS-OPERATIONS-ADOPTION-RUNBOOK
---

# Contrato de adoção

1. Verificar escopo e estado do destino.
2. Novo: extrair em pasta vazia; existente: comparar e aplicar upgrade revisado.
3. Instalar `requirements-docs.txt` com Python 3.11+.
4. Configurar identidade, ownership e documentos mínimos.
5. Criar pares por IDs, atualizar revisões e registrar evidências.
6. Executar `bash scripts/run_all_checks.sh` e comparação Git quando aplicável.
7. Configurar recursos da plataforma sob autorização específica.

Não confundir ZIP válido com governança externa já ativa; não criar conteúdo de projeto fictício; não executar push ou deploy como parte do bootstrap.
