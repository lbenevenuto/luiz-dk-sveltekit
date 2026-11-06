---
doc_id: HDS-TEMPLATE-TECHNICAL-AI
title: Documentação técnica — ai
version: 1.0.0
status: draft
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- technical
- template
document_type: template
pair_required: true
pair_role: ai
pair_doc_id: HDS-TEMPLATE-TECHNICAL-HUMAN
topic_id: HDS-TEMPLATE-TECHNICAL
---

# Contrato técnico para agentes

## Unidade e escopo

- Identificar arquivos e símbolos cobertos, ownership e implementação canônica.
- Declarar precondições, entradas, saídas e efeitos observáveis.
- Separar responsabilidade de UI, domínio, persistência e integração quando aplicável.

## Dependências e contratos

- Enumerar interfaces públicas e consumidores.
- Registrar limites transacionais, autorização, idempotência e compatibilidade.
- Vincular cada regra de negócio ao respectivo par em docs/business.

## Invariantes e alterações proibidas

- Enumerar invariantes verificáveis e comportamento que deve ser preservado.
- Proibir cópias de implementações canônicas e abstrações sem responsabilidade.
- Registrar limites, concorrência, dados inválidos e falhas externas pertinentes.

## Erros e recuperação

- Declarar condições, resultados e mecanismos reais de diagnóstico e recuperação.
- Distinguir erro bloqueante, incerteza e resultado ainda não validado.

## Execução de validação

- Registrar comandos reais, fixtures, resultados e localização de evidências.
- Atualizar documentação, versão, revisão, cobertura e hashes após inspeção.
- Não inferir aprovação humana ou ausência de duplicação semântica de um check verde.

## Referências e continuidade

- Vincular a apresentação humana e fontes primárias do projeto.
- Informar impacto nos consumidores e pendências com critérios de fechamento.
- Este template permanece draft até ser preenchido; não comprova implementação.
