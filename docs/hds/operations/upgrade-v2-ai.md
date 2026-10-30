---
doc_id: HDS-DOCS-HDS-OPERATIONS-UPGRADE-V2-AI
title: Migração para hDS 2.0.0 — contrato para agentes
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
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-UPGRADE-V2-HUMAN
topic_id: OS-DOCS-HDS-OPERATIONS-UPGRADE-V2
---

# Contrato de upgrade

## Pré-condições

Escopo autorizado, inventário, recuperação disponível e responsável pela adoção.

## Passos

Preservar legado selecionado; comparar arquivos; converter metadados com revisão; preservar IDs; mapear caminhos; configurar pares; registrar fontes, ownership e revisões; executar checks; revisar semântica; integrar somente dentro da autorização.

## Bloqueios

Não converter `active` automaticamente em aprovação. Não sobrescrever instruções locais, CI ou taxonomia sem decisão. Não renomear IDs por conveniência. Não executar commit/push como efeito colateral.

## Pronto

Conteúdo vigente separado do legado, metadados e referências válidos, evidência registrada, checks verdes e revisão humana aplicável concluída.

## Repositório consumidor

Definir `repository_role: consumer`; preservar a separação entre versão do padrão e versão do produto. Alterações de conteúdo continuam exigindo evolução documental e registro de revisão.
