---
doc_id: HDS-DOCS-HDS-OPERATIONS-UPGRADE-V2-HUMAN
title: Migração para hDS 2.0.0 — visão humana
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
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-UPGRADE-V2-AI
topic_id: OS-DOCS-HDS-OPERATIONS-UPGRADE-V2
---

# Migração para hDS 2.0.0

Esta é uma mudança major do padrão; não aplique por cima de um projeto existente sem comparação e revisão.

## Sequência

1. Inventarie estado e alterações locais; prepare recuperação por Git ou cópia verificada.
2. Preserve material histórico selecionado com `python3 scripts/migrate_legacy.py ORIGEM`; o script copia sem apagar a origem e registra hashes.
3. Compare políticas, scripts e templates; preserve instruções próprias de `AGENTS.md`, `GUARDRAILS.md` e CI.
4. Converta `active` para `approved` somente com evidência de aprovação; caso contrário use `draft` ou `review`.
5. Escolha audiência primária (`tech`, `manager` ou `c-level`) e registre tags, idioma, tipo e necessidade de par.
6. Preserve IDs canônicos existentes. Configure pares recíprocos por ID e alinhe versão, data, idioma, owner e status.
7. Mapeie diretórios antigos para a taxonomia do projeto sem copiar duas fontes de verdade. Repare links e `related_docs`.
8. Atualize registros de revisões, ownership, artefatos e pendências.
9. Valide estrutura e evolução, revise semântica e só então integre a mudança autorizada.

## Rollback

Reverta a mudança de adoção ou restaure a cópia verificada. Não apague o legado preservado. Migração falha não deve deixar conteúdo incompleto declarado como vigente.

Versão do hDS, versão do produto e versão de cada documento são independentes. No consumidor, configure a atualização da versão do padrão de forma explícita.

## Papel do repositório

Configure `repository_role: consumer` nos projetos que adotam o hDS. Em `standard`, alterações na implementação do próprio padrão exigem incremento da versão do padrão; em `consumer`, as versões documentais evoluem sem transformar a versão do produto na versão do hDS.
