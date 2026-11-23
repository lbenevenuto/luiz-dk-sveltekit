---
doc_id: HDS-DOCS-HDS-OPERATIONS-MIGRATION-RUNBOOK-HUMAN
title: Preservação de documentação legada — visão humana
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
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-MIGRATION-RUNBOOK-AI
topic_id: OS-DOCS-HDS-OPERATIONS-MIGRATION-RUNBOOK
---

# Preservação de documentação legada

Execute `python3 scripts/migrate_legacy.py ORIGEM`. O script aceita arquivo ou diretório, copia para uma importação única em `legacy-documentation/`, gera manifesto SHA-256 e verifica os bytes. Não apaga nem move a origem.

O script recusa links simbólicos, diretórios `.git`, travessia de caminhos e uma origem que contém o próprio destino. Não aponte para a raiz do repositório. Selecione somente o material classificado como legado.

Após preservar, registre a origem e revise o conteúdo vigente. Mapeie documentos novos às fontes e substitua documentação atual somente por mudança revisada. O legado é histórico e não aprovação do estado atual.

Em falha de cópia ou hash, o script remove somente a importação parcial criada por ele, preservando a origem. O comando pode ser chamado de qualquer diretório; o destino é relativo à raiz deste pacote.
