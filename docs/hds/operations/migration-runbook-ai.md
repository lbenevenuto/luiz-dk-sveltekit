---
doc_id: HDS-DOCS-HDS-OPERATIONS-MIGRATION-RUNBOOK-AI
title: Preservação de documentação legada — contrato para agentes
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
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-MIGRATION-RUNBOOK-HUMAN
topic_id: OS-DOCS-HDS-OPERATIONS-MIGRATION-RUNBOOK
---

# Contrato de preservação

Entrada: caminho existente de arquivo ou diretório selecionado como legado.

Pré-condições: leitura da origem, escrita no destino e autorização de preservação.

Saída: importação única, cópia verificada e `IMPORT_MANIFEST.json` com caminhos e hashes; nenhuma mutação da origem.

Falhas bloqueantes: symlink, `.git`, origem contendo destino, caminho inválido, erro de cópia ou hash divergente. Nunca declarar sucesso parcial; remover só a cópia parcial criada nesta execução.

A migração documental posterior exige revisão e não é executada por este copiador.
