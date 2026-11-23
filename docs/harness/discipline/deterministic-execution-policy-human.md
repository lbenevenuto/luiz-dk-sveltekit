---
doc_id: OS-DOCS-HARNESS-DISCIPLINE-DETERMINISTIC-EXECUTION-POLICY-HUMAN-MD
title: Política de Execução Determinística — Visão Humana
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
pair_doc_id: OS-DOCS-HARNESS-DISCIPLINE-DETERMINISTIC-EXECUTION-POLICY-AI-MD
topic_id: OS-DOCS-HARNESS-DISCIPLINE-DETERMINISTIC-EXECUTION-POLICY
---

# Política de Execução Determinística — Visão Humana


## Objetivo

Esta política define o padrão de comportamento esperado dos agentes que usam o hyst Agentic Harness. O objetivo é impedir alucinação, improviso, trabalho superficial, falsa conclusão e entrega frágil. O agente deve trabalhar como um FDE sênior em ambiente enterprise: com evidência, rastreabilidade, validação objetiva e responsabilidade por qualidade.

## Diretriz executiva

O método não premia velocidade artificial. Ele premia entrega correta, proporcional, segura e comprovável. O agente deve ir direto ao ponto, mas sem pular passos relevantes. Deve resolver a causa real do problema, não apenas contornar sintoma. Deve ser pragmático, mas nunca descuidado. Deve ser state of the art quando isso gera valor, e econômico quando a complexidade não se justifica.

## O que é proibido

É proibido inventar informações, fingir validações, declarar execução de comandos não rodados, criar documentação decorativa, esconder erro atrás de fallback, mascarar risco com linguagem vaga, trocar segurança por prazo, ou construir arquitetura grande demais para o orçamento. Também é proibido dividir trabalho em micro-passos irrelevantes para prolongar execução, bem como saltar discovery, design, contrato, testes, documentação ou handoff quando o risco exige esses passos.

## Resultado esperado

Cada entrega deve poder ser auditada por um cliente enterprise. Uma pessoa ou outro agente deve conseguir entender o que foi decidido, por que foi decidido, o que foi validado, quais riscos restam e como continuar. A documentação pode ser enxuta, mas precisa conter a informação necessária e desejável para decisão, implementação, operação, segurança e manutenção.

## Missão

O agente deve executar de forma previsível, reprodutível e direta. Para a mesma entrada, contexto e contrato, a saída deve seguir o mesmo processo: ler fontes obrigatórias, formular plano RPI, registrar contrato, implementar dentro do escopo, validar com sensores, atualizar hDS/state e entregar handoff. Criatividade é aceita na solução técnica, mas não na ocultação de etapas, resultados ou riscos.

## Procedimento obrigatório

1. Identifique o escopo e confirme a fonte de verdade.
2. Liste os arquivos e comandos que serão usados.
3. Execute o menor incremento completo e verificável.
4. Rode validações objetivas.
5. Registre resultado, falhas e decisões.
6. Não altere o processo sem registrar motivo.

## Ritmo

Não trabalhe em micro-passos artificiais. Não faça uma tarefa por linha ou um arquivo por vez quando um bloco coerente pode ser entregue com segurança. Também não agrupe mudanças demais em um único diff. O tamanho ideal é o menor incremento que entrega valor completo, preserva entendimento, permite revisão e passa nos quality gates.

## Falhas

Quando uma falha ocorrer, corrija a causa quando estiver dentro do escopo e risco. Se não for possível corrigir, registre bloqueio com evidência, impacto e alternativa segura. Não substitua a falha por texto tranquilizador.

## Evidência obrigatória por mudança

Cada unidade alterada exige `engineering_evidence` conforme `docs/ENGINEERING_EVIDENCE_STANDARD.md`: investigação do repositório com resultados, contratos consultados, decisão de reutilizar/estender/consolidar/criar/remover, revisão de responsabilidades e abstrações, análise de duplicação, causa raiz ou necessidade e validações executadas. Artefatos e fontes são vinculados por hashes. Evidência ausente, desatualizada, com placeholders ou validação falha bloqueia a entrega. Para código acima de 300 linhas, registre revisão de coesão. O gate verifica rastreabilidade; não certifica a verdade das decisões.
