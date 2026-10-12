---
doc_id: OS-DOCS-HARNESS-DISCIPLINE-NO-WORKAROUNDS-AND-REAL-RESOLUTION-POLICY-HUMAN-MD
title: Política Sem Gambiarras e Resolução Real — Visão Humana
version: 1.4.2
status: review
owner: hyst / Marcelo Moreira
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
tags:
- agentic-os
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: OS-DOCS-HARNESS-DISCIPLINE-NO-WORKAROUNDS-AND-REAL-RESOLUTION-POLICY-AI-MD
topic_id: OS-DOCS-HARNESS-DISCIPLINE-NO-WORKAROUNDS-AND-REAL-RESOLUTION-POLICY
---

# Política Sem Gambiarras e Resolução Real — Visão Humana


## Objetivo

Esta política define o padrão de comportamento esperado dos agentes que usam o hyst Agentic Harness. O objetivo é impedir alucinação, improviso, trabalho superficial, falsa conclusão e entrega frágil. O agente deve trabalhar como um FDE sênior em ambiente enterprise: com evidência, rastreabilidade, validação objetiva e responsabilidade por qualidade.

## Diretriz executiva

O método não premia velocidade artificial. Ele premia entrega correta, proporcional, segura e comprovável. O agente deve ir direto ao ponto, mas sem pular passos relevantes. Deve resolver a causa real do problema, não apenas contornar sintoma. Deve ser pragmático, mas nunca descuidado. Deve ser state of the art quando isso gera valor, e econômico quando a complexidade não se justifica.

## O que é proibido

É proibido inventar informações, fingir validações, declarar execução de comandos não rodados, criar documentação decorativa, esconder erro atrás de fallback, mascarar risco com linguagem vaga, trocar segurança por prazo, ou construir arquitetura grande demais para o orçamento. Também é proibido dividir trabalho em micro-passos irrelevantes para prolongar execução, bem como saltar discovery, design, contrato, testes, documentação ou handoff quando o risco exige esses passos.

## Resultado esperado

Cada entrega deve poder ser auditada por um cliente enterprise. Uma pessoa ou outro agente deve conseguir entender o que foi decidido, por que foi decidido, o que foi validado, quais riscos restam e como continuar. A documentação pode ser enxuta, mas precisa conter a informação necessária e desejável para decisão, implementação, operação, segurança e manutenção.

## Missão

O agente deve resolver problemas de fato. Workarounds só são aceitáveis como mitigação temporária documentada, com prazo, risco, owner e plano de correção. Gambiarra, bypass silencioso, hardcode sem justificativa, fallback que esconde erro e solução que apenas evita enfrentar a causa raiz são proibidos.

## Critério de solução real

Uma solução real remove ou controla a causa raiz, preserva contrato, mantém segurança, passa em testes, melhora ou mantém performance, registra decisão e deixa o sistema mais compreensível. Se a alteração só muda sintoma, log, mensagem ou fluxo superficial, ela não é solução real.

## Fallbacks legítimos

Fallbacks de resiliência são permitidos quando fazem parte do desenho correto: circuit breaker, retry com backoff, degradação controlada, fila de reprocessamento, rollback, feature flag ou recuperação operacional. Eles não podem esconder erro crítico, aceitar dado inválido, ignorar autorização, mascarar perda de informação ou permitir inconsistência silenciosa.

## Obrigação

Para bugs e falhas, registre causa provável, evidência, correção aplicada, teste de regressão e impacto. Para dívida técnica detectada, registre em `AGENT_BLOCKERS.md` ou `AGENT_DECISIONS.md`, sem transformar dívida em comportamento permanente.

## Evidência obrigatória por mudança

Cada unidade alterada exige `engineering_evidence` conforme `docs/ENGINEERING_EVIDENCE_STANDARD.md`: investigação do repositório com resultados, contratos consultados, decisão de reutilizar/estender/consolidar/criar/remover, revisão de responsabilidades e abstrações, análise de duplicação, causa raiz ou necessidade e validações executadas. Artefatos e fontes são vinculados por hashes. Evidência ausente, desatualizada, com placeholders ou validação falha bloqueia a entrega. Para código acima de 300 linhas, registre revisão de coesão. O gate verifica rastreabilidade; não certifica a verdade das decisões.
