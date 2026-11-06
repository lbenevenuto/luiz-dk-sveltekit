---
doc_id: HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-AI
title: Política de Pull Request, Merge e Versionamento Semântico do hDS — Estrutura
  para IA
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-HUMAN
- HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-AI
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-HUMAN
topic_id: OS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY
---

# Objetivo

Fornecer regras operacionais para classificação e aprovação de mudanças via PR/MR e para sua tradução em SemVer.

# Definições

## pr_mr

Solicitação de integração de branch em branch alvo, com revisão rastreável.

## semver_class

Classe de impacto da mudança: `none`, `patch`, `minor`, `major`.

## compatibility

Estado de compatibilidade: `compatible` ou `breaking`.

# Regras

## regra 1

Mudanças relevantes em repositório compartilhado devem usar branch + PR/MR.

## regra 2

Toda PR/MR deve declarar:

- objetivo;
- problema;
- documentos alterados;
- audiência impactada;
- `semver_class`;
- risco;
- necessidade de migração.

## regra 3

`patch` quando a mudança corrige ou refina sem quebrar compatibilidade.

## regra 4

`minor` quando a mudança adiciona capacidade compatível.

## regra 5

`major` quando a mudança é breaking ou exige adaptação explícita.

## regra 6

Mudança breaking exige:

- justificativa;
- plano de adaptação;
- changelog;
- atualização major.

## regra 7

Revisão deve validar consistência entre a classificação proposta e o impacto real.

## regra 8

`CHANGELOG.md` deve ser atualizado quando a mudança for relevante para adoção, operação, governança, compatibilidade ou migração.

# Tabela decisória

## editorial fix

- `semver_class`: patch ou none conforme política local
- `compatibility`: compatible

## new compatible guide or template

- `semver_class`: minor
- `compatibility`: compatible

## governance update without break

- `semver_class`: minor
- `compatibility`: compatible

## incompatible taxonomy or mandatory field change

- `semver_class`: major
- `compatibility`: breaking

# Merge

Merge somente quando:

- validação local/CI estiver verde;
- revisão necessária concluída;
- classificação SemVer estiver aceita;
- documentação relacionada estiver atualizada.

# Saídas esperadas

- PR/MR classificada;
- SemVer coerente;
- merge rastreável;
- changelog coerente;
- estado principal consistente.

## Contrato de evolução em 2.0.0

Toda alteração de conteúdo de documento exige incremento de sua versão e registro de revisão. Exceções de fluxo de PR não dispensam esses requisitos. A versão do padrão deve evoluir quando seu contrato, implementação ou modelos mudarem.
