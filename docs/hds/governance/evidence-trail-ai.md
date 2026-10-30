---
doc_id: HDS-DOCS-HDS-GOVERNANCE-EVIDENCE-TRAIL-AI
title: Trilha de evidências — contrato para agentes
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
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-EVIDENCE-TRAIL-HUMAN
topic_id: OS-DOCS-HDS-GOVERNANCE-EVIDENCE-TRAIL
---

# Contrato de evidência

## Procedimento

1. Vincular afirmação a fonte e escopo reais.
2. Atualizar documento e revisão correspondente.
3. Registrar decisões em ADR e propostas em RFC.
4. Registrar artefatos em `.hds/assets.yml`.
5. Abrir finding para dívida material fora do escopo.
6. Encerrar finding somente com `resolution_evidence` verificável.

## Invariantes

Não inventar commit, aprovação, resultado, execução, fonte ou documento. Não substituir evidência por um modelo preenchido sem origem. O validador verifica estrutura; o revisor verifica a suficiência da evidência.
