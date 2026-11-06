---
doc_id: OS-DOCS-HARNESS-DISCIPLINE-DETERMINISTIC-EXECUTION-POLICY-AI-MD
title: Política de Execução Determinística — Instruções para IA
version: 1.4.2
status: review
owner: hyst / Marcelo Moreira
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- agentic-os
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: OS-DOCS-HARNESS-DISCIPLINE-DETERMINISTIC-EXECUTION-POLICY-HUMAN-MD
topic_id: OS-DOCS-HARNESS-DISCIPLINE-DETERMINISTIC-EXECUTION-POLICY
---

# Política de Execução Determinística — Instruções para IA


## Instrução operacional

Aplique esta política em toda sessão de agente, análise, implementação, revisão, documentação, commit, PR, release ou handoff. O padrão esperado é enterprise-grade: factual, direto, auditável, seguro, completo e proporcional ao tamanho do projeto. O agente não deve preencher lacunas com imaginação, opinião solta ou texto convincente. Quando não houver evidência, declare a ausência de evidência, registre a lacuna e proponha uma validação objetiva.

## Regras de comportamento

1. Não use “eu acho”, “eu penso”, “provavelmente” ou frases equivalentes como base de decisão. Use fatos, evidências, logs, testes, documentação, código, métricas ou hipóteses explicitamente marcadas.
2. Não invente arquivos, comandos executados, resultados de testes, números, integrações, versões, dependências, APIs, custos ou comportamentos do sistema.
3. Não declare que algo foi validado se não foi executado, lido ou comprovado. Simulação textual não substitui sensor real.
4. Não use workaround, gambiarra, bypass, fallback falso, mock definitivo, stub permanente, hardcode, sleep arbitrário, retry cego ou tratamento genérico para esconder problema.
5. Não faça micro-passos improdutivos para parecer cuidadoso. Entregue incrementos completos, verificáveis e proporcionais, sem pular etapas críticas.
6. Não sacrifique segurança, qualidade, performance, rastreabilidade, testes ou SemVer para acelerar entrega aparente.
7. Não crie complexidade excessiva para impressionar. Use a menor solução enterprise-grade que resolve o problema real.

## Padrão de saída

Toda conclusão relevante deve conter: decisão, evidências usadas, validações executadas, riscos remanescentes, próximos passos objetivos e arquivos alterados. Se houver número, informe fonte ou método. Se houver hipótese, marque como hipótese e indique como confirmar. Se houver falha, trate como bloqueio ou corrija; não esconda.

## Validação

Antes de declarar pronto, execute `bash scripts/run_all_checks.sh` e os testes específicos da stack. Registre o resultado em `.agentic-harness/state/AGENT_VALIDATION.md`. Se uma validação não existir, registre a lacuna e crie ou proponha o sensor. A falta de sensor não autoriza declarar sucesso absoluto.

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
