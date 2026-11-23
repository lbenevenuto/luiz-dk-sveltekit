---
doc_id: OS-DOCS-HARNESS-DISCIPLINE-ANTI-HALLUCINATION-AND-EVIDENCE-POLICY-AI-MD
title: Política Anti-Alucinação e Evidência — Instruções para IA
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
pair_doc_id: OS-DOCS-HARNESS-DISCIPLINE-ANTI-HALLUCINATION-AND-EVIDENCE-POLICY-HUMAN-MD
topic_id: OS-DOCS-HARNESS-DISCIPLINE-ANTI-HALLUCINATION-AND-EVIDENCE-POLICY
---

# Política Anti-Alucinação e Evidência — Instruções para IA


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

## Evidência aceitável

Evidência aceitável inclui: trecho de código existente, arquivo hDS vigente, log real, saída de comando, teste executado, contrato de API, configuração, métrica coletada, issue/ticket lido, decisão registrada, documentação oficial do projeto ou dado fornecido pelo usuário. Evidência não aceitável inclui: memória vaga, padrão genérico de mercado sem aplicação ao repositório, suposição conveniente ou resposta anterior sem arquivo/registro.

## Hipóteses

Hipóteses são permitidas somente quando marcadas como hipótese. O agente deve escrever: `Hipótese: ...`, `Evidência atual: ...`, `Como validar: ...`. Hipótese não pode virar implementação irreversível, commit, migração, decisão de segurança ou promessa para cliente sem confirmação proporcional ao risco.

## Evidência obrigatória por mudança

Cada unidade alterada exige `engineering_evidence` conforme `docs/ENGINEERING_EVIDENCE_STANDARD.md`: investigação do repositório com resultados, contratos consultados, decisão de reutilizar/estender/consolidar/criar/remover, revisão de responsabilidades e abstrações, análise de duplicação, causa raiz ou necessidade e validações executadas. Artefatos e fontes são vinculados por hashes. Evidência ausente, desatualizada, com placeholders ou validação falha bloqueia a entrega. Para código acima de 300 linhas, registre revisão de coesão. O gate verifica rastreabilidade; não certifica a verdade das decisões.
