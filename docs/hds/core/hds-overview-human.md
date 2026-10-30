---
doc_id: HDS-DOCS-HDS-CORE-HDS-OVERVIEW-HUMAN
title: Visão Geral do hDS para Humanos
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-CORE-HDS-OVERVIEW-AI
- HDS-DOCS-HDS-GOVERNANCE-DOCUMENTATION-GOVERNANCE-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-CORE-HDS-OVERVIEW-AI
topic_id: OS-DOCS-HDS-CORE-HDS-OVERVIEW
---

# O que é o hDS

O hDS é um sistema de documentação versionada, auditável e preparada para leitura por pessoas e agentes de IA. Ele aplica princípios de Documentation as Code, governança, rastreabilidade e separação clara por audiência.

# O que ele resolve

- documentação dispersa e inconsistente;
- perda de contexto histórico;
- mistura entre material técnico, gerencial e executivo;
- ausência de padrão para IA interpretar regras e contexto;
- dificuldade para migrar legado sem destruir histórico.

# Como o hDS opera

O hDS organiza documentos em uma estrutura previsível, exige metadados mínimos, separa documentação vigente de documentação herdada e define quando um assunto precisa existir em duas formas: uma para humanos e outra para IA.

# Política de idioma

O idioma da documentação deve seguir `default_language` em `.hds/config.yml`, salvo quando o documento definir `lang` explicitamente no front matter.

O sistema admite a permanência de alguns identificadores estruturais em inglês, como nomes de arquivos-padrão, certos títulos internos, chaves técnicas e convenções de diretório, para manter consistência operacional.

# Benefícios

- mais clareza;
- menos ambiguidade;
- melhor manutenção;
- melhor onboarding;
- melhor auditabilidade;
- melhor uso por agentes de IA.

# Princípio de pareamento

Quando um mesmo tema deve servir a humanos e IA, o hDS exige um par documental. Isso reduz ambiguidade e evita que um único documento tente atender necessidades incompatíveis.
