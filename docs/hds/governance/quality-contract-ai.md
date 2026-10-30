---
doc_id: HDS-DOCS-HDS-GOVERNANCE-QUALITY-CONTRACT-AI
title: Qualidade e validação — contrato para agentes
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
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-QUALITY-CONTRACT-HUMAN
topic_id: OS-DOCS-HDS-GOVERNANCE-QUALITY-CONTRACT
---

# Contrato de execução

## Entradas

Raiz do pacote, configuração `.hds/config.yml`, documentos e registros. `--base-ref` é opcional somente para validação inicial sem histórico ou para release comparada previamente.

## Procedimento

1. Executar `bash scripts/run_all_checks.sh`.
2. Em alteração versionada, executar `python3 scripts/validate_hds.py --base-ref COMMIT_BASE`.
3. Falha em qualquer etapa bloqueia a conclusão da unidade.
4. Verificar manualmente semântica dos pares, fontes, classificação SemVer e revisão proporcional.
5. Registrar pendências fora de escopo em `.hds/findings.yml`.

## Limites

Checks offline não verificam links externos, verdade factual, equivalência semântica, proteção real de branch ou conformidade normativa. Nunca transformar sucesso estrutural em aprovação operacional.

## Saídas

Exit code zero com resultado resumido ou exit code não zero com lista de violações e caminhos. O relatório da release informa testes efetivamente executados.

## Exceção por tipo de artefato

Os índices de revisão e manifestos de release não participam do limite narrativo. A exceção é nominal e não se estende a código ou políticas.
