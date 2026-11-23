---
doc_id: HDS-DOCS-HDS-GOVERNANCE-QUALITY-CONTRACT-HUMAN
title: Qualidade e validação — visão humana
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
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-QUALITY-CONTRACT-AI
topic_id: OS-DOCS-HDS-GOVERNANCE-QUALITY-CONTRACT
---

# Qualidade e validação

Execute `bash scripts/run_all_checks.sh` antes de compartilhar o pacote. O comando falha se um check ou teste falhar.

## Evolução em Git

Use `python3 scripts/validate_hds.py --base-ref COMMIT_BASE` para comparar a documentação com um commit real. Em CI de PR a base é o commit base da solicitação; em push não inicial é o commit anterior. Não invente uma base para ZIPs sem Git.

O check exige bump de versão por documento alterado, data não regressiva, registro de revisão correspondente e incremento da versão do padrão quando os arquivos de política, templates, scripts ou CI mudarem. Escolher patch/minor/major correto continua sendo revisão humana.

## O que os checks cobrem

YAML e tipos, IDs, campos e datas; pares recíprocos e metadados; links locais e âncoras; Markdown básico; resíduos; registros de artefatos; limites de tamanho e waivers; SemVer e changelog; testes de regressão.

Os checks não testam veracidade, ausência de duplicação semântica, equivalência completa entre pares, links externos, permissões efetivas da plataforma ou conformidade legal. Registre explicitamente essas revisões quando aplicáveis.

## Qualidade técnica

Documentos técnicos devem explicitar contratos, invariantes, casos limite, modos de falha, mitigação e fontes quando aplicáveis. Não insira seções vazias para aparentar completude. Acima de 300 linhas há aviso; acima de 500 exige decomposição ou waiver temporário aprovado.

O lint local implementa regras básicas documentadas, não o conjunto completo de uma ferramenta editorial externa. Ferramentas adicionais podem complementar os checks; não são pré-requisito oculto.

## Registros extensos

Registros estruturados de revisões e manifestos de release são índices e podem exceder o limite de linhas sem concentrar narrativa ou lógica. Não recebem a exceção módulos de código, políticas ou documentos narrativos.
