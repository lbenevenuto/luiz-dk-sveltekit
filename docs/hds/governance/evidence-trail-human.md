---
doc_id: HDS-DOCS-HDS-GOVERNANCE-EVIDENCE-TRAIL-HUMAN
title: Trilha de evidências — visão humana
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
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-EVIDENCE-TRAIL-AI
topic_id: OS-DOCS-HDS-GOVERNANCE-EVIDENCE-TRAIL
---

# Trilha de evidências

Cada afirmação relevante deve apontar evidência verificável, escopo e limitações. Use commit/PR, documento versionado, ADR, contrato e relatório real. Não preencha um registro com aprovação ou resultado presumido.

## Matriz

| Controle | Documento canônico | Evidência esperada |
|---|---|---|
| Mudança revisada | Política de controle de mudança | PR/MR e revisão registrada |
| Decisão rastreável | ADR | Contexto, alternativas, decisão e consequências |
| Contrato de API | OpenAPI do projeto | YAML válido, revisão e testes aplicáveis |
| Diagrama rastreável | Registro de artefatos | Fonte, export, owner e SHA-256 |
| Revisão documental | Registro de revisões | ID, versão, data, autor e resumo |

## Registro de revisões

Use `docs/evidence/revision-register.yml`: cada revisão informa `doc_id`, `version`, `date`, `author`, `change`, `action` (`created`, `updated` ou `removed`). O Git permanece o histórico de autoria e aprovação; este registro facilita navegação.

## Pendências

Use `.hds/findings.yml` para não conformidades: ID, status, gravidade, owner, localização, evidência, impacto, próxima ação e critério de fechamento. Status `resolved` exige evidência de resolução. Não crie listas paralelas.
