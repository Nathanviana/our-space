---
produto: Nathan & Iris · Nosso Espaço
documento: Síntese da Solução
fase_design_thinking: 2º diamante · Desenvolver
versao: 1
data: 2026-11-04
po: Nathan
apoio: Iris
status: Aprovado
origem: Funil interno
documento_anterior: DISC-07 Ideação
proximo_documento: DISC-09 PRD
---

# 08 Síntese da Solução: Nathan & Iris · Nosso Espaço

> **Como ler este documento.** Aqui as ideias selecionadas na Ideação viram uma solução clara. Os **módulos funcionais** agrupam o que o produto faz para o usuário (épicos e features); os **módulos base** são as partes estruturais que todo sistema precisa. O **escopo proposto** indica o que deve entrar no MVP. A arquitetura (dados, telas, integrações e permissões) é desenhada no PRD (09), que parte deste documento. Cada feature indica a ideia (S) e a oportunidade (O) que a originaram.

## 1. Ponto de partida

**Problema central (01):** Como podemos proteger os planos e as memórias de Nathan e Iris, para que nada do que querem viver ou já viveram juntos se perca?

**Objetivos para o negócio (01):** 1. Fazer mais programas juntos, tirando do papel o que o casal quer viver. 2. Decidir mais rápido o que fazer juntos. 3. Preservar e reviver os momentos vividos, com a visão de tudo o que já fizeram.

**Ideias selecionadas (07):**

| # | Ideia ou grupo | Oportunidades | Pontos de atenção trazidos da 07 |
|---|---|---|---|
| S1 | G1 A lista que não deixa o plano escapar | O1, O3 | Se registrar um plano não for fácil, o casal volta para o WhatsApp (S7) |
| S2 | G2 Feito vira memória | O2, O1, O3 | Registrar precisa ser rápido; música e frase são hipóteses (S6) |
| S3 | G3 O baú organizado | O1, O2 | Mapa e linha do tempo podem ser pesados para começar; S4 não validada |

## 2. Definição

| É | Não é |
|---|---|
| Um site privado do casal para guardar o que querem viver e o que já viveram juntos | Não é rede social, nem app de conversa como o WhatsApp, nem backup de fotos como o Google Fotos, nem app de conselhos de relacionamento como o Paired |

| Faz | Não faz |
|---|---|
| Guarda os planos por tema, em uma lista "vamos fazer" e "já fizemos" | Não compartilha nada com outras pessoas: é só do casal |
| Ajuda a escolher o próximo programa (sorteio, filmes que os dois querem ver) | Não tem chat |
| Transforma o plano realizado em memória, com foto, música, frase e lugar | Não substitui a galeria nem faz backup automático das fotos |
| Organiza tudo por tema, por lugar e em uma linha do tempo | Não traz lembranças automáticas de "neste dia" nem de datas especiais (G4, guardado) |

## 3. Módulos funcionais, épicos e features

**Módulos funcionais e complexidade**

| # | Módulo funcional | Para que serve | Personas atendidas | Complexidade | Motivo da complexidade |
|---|---|---|---|---|---|
| M1 | Planos | Guardar o que o casal quer fazer e ajudar a escolher o próximo programa | Nathan & Iris | Média | Regras próprias (sorteio, filmes que os dois querem) e possível recebimento de links externos |
| M2 | Memórias | Transformar o programa realizado em lembrança | Nathan & Iris | Média | Envio de fotos, possível integração com serviço de música e aviso para registrar depois do programa |
| M3 | Organização | Encontrar planos e memórias por tema, por lugar e no tempo | Nathan & Iris | Média | O mapa provavelmente depende de integração com serviço de mapas |

*Complexidade: Baixa, cadastros e consultas simples, sem integrações; Média, regras de negócio próprias, cálculos, notificações ou uma integração; Alta, várias integrações, dados sensíveis, pagamentos, recursos de IA, muitos perfis ou fluxos com aprovações.*

**Total:** 3 módulos funcionais (0 baixa, 3 média, 0 alta)

**Estrutura**

```
Nathan & Iris · Nosso Espaço
├── M1 Planos
│   ├── E1 Lista de planos
│   │   ├── F1 Adicionar um plano (filme, lugar, receita, programa) em um tema
│   │   ├── F2 Separar "vamos fazer" e "já fizemos" e marcar como feito
│   │   ├── F3 Guardar um plano a partir de um link ou vídeo
│   │   └── F4 Sugestões de programas quando o tema estiver vazio
│   └── E2 Escolher o próximo programa
│       ├── F5 Sortear um plano
│       └── F6 Ver os filmes que os dois querem assistir
├── M2 Memórias
│   ├── E3 Registrar o momento
│   │   ├── F7 Ao marcar um plano como feito, registrar a lembrança dele
│   │   ├── F8 Anexar fotos
│   │   ├── F9 Anexar uma música
│   │   ├── F10 Anexar uma frase
│   │   ├── F11 Registrar o lugar
│   │   └── F12 Convite para registrar logo depois do programa
│   └── E4 Reviver
│       └── F13 Ver a memória como uma pequena história
└── M3 Organização
    ├── E5 Temas
    │   └── F14 Temas padrão e criação de novos
    └── E6 Navegar pelo que viveram
        ├── F15 Mapa dos lugares que querem ir e onde já foram
        └── F16 Linha do tempo do casal
```

**Rastreabilidade**

| Feature | Épico | Módulo | Ideia | Oportunidade | Persona |
|---|---|---|---|---|---|
| F1 Adicionar um plano em um tema | E1 | M1 | S1 (I2) | O1 | Nathan & Iris |
| F2 "Vamos fazer" e "já fizemos" | E1 | M1 | S1 (I2) | O1 | Nathan & Iris |
| F3 Guardar a partir de um link ou vídeo | E1 | M1 | S1 (I10) | O1, O3 | Nathan & Iris |
| F4 Sugestões quando o tema estiver vazio | E1 | M1 | S1 (I7, I18) | O1 | Nathan & Iris |
| F5 Sortear um plano | E2 | M1 | S1 (I11) | O1 | Nathan & Iris |
| F6 Filmes que os dois querem assistir | E2 | M1 | S1 (I8, I16) | O1 | Nathan & Iris |
| F7 Registrar a lembrança ao marcar como feito | E3 | M2 | S2 (I15) | O1, O2 | Nathan & Iris |
| F8 Anexar fotos | E3 | M2 | S2 (I3) | O2 | Nathan & Iris |
| F9 Anexar uma música | E3 | M2 | S2 (I3) | O2 | Nathan & Iris |
| F10 Anexar uma frase | E3 | M2 | S2 (I3) | O2 | Nathan & Iris |
| F11 Registrar o lugar | E3 | M2 | S2 (I4) | O2 | Nathan & Iris |
| F12 Convite para registrar depois do programa | E3 | M2 | S2 (I14) | O2, O3 | Nathan & Iris |
| F13 Memória como pequena história | E4 | M2 | S2 (I6) | O2 | Nathan & Iris |
| F14 Temas padrão e criação de novos | E5 | M3 | S3 (I1) | O1, O2 | Nathan & Iris |
| F15 Mapa dos lugares | E6 | M3 | S3 (I12) | O1, O2 | Nathan & Iris |
| F16 Linha do tempo do casal | E6 | M3 | S3 (I17) | O2 | Nathan & Iris |

Nenhuma oportunidade tem prioridade alta (DISC-06); O1, O2 e O3 têm pelo menos uma feature.

## 4. Módulos base

Partes estruturais que todo sistema precisa.

| Módulo base | Necessário | Observação |
|---|---|---|
| Autenticação e login | Sim | O espaço é privado; só Nathan e Iris entram |
| Perfis e permissões | Não | Um único perfil, os dois com os mesmos acessos; o login só identifica quem é quem (F6) |
| Banco de dados | Sim | Lovable Cloud |
| Segurança | Sim | Fotos e memórias pessoais não podem ficar expostas |
| Administração | Não | Não há ninguém além do casal para gerenciar |
| Notificações | Avaliar | Depende de como a F12 (convite para registrar) vai funcionar |
| LGPD e consentimento | Sim | Fotos e dados pessoais, com uso restrito ao casal; versão simplificada |
| Logs e auditoria | Não | Sem ações críticas |
| Upload de arquivos | Sim | Fotos das memórias (F8) |
| Relatórios | Não | Sem indicadores |
| Integrações | Avaliar | Possíveis: serviço de música (F9), mapas (F15) e leitura de links (F3); detalhadas na arquitetura do PRD |

## 5. Insumos para o PRD

Pontos técnicos que surgiram no Discovery e que o PRD (09) vai transformar em arquitetura. Aqui só se registra o que foi citado, sem modelar.

| Tipo | O que foi citado | Origem |
|---|---|---|
| Perfil de usuário | Dois usuários, Nathan e Iris, com os mesmos acessos | DISC-01 seção 6; DISC-02 C7 |
| Dado sensível | Fotos e memórias íntimas do casal | DISC-03 M7 e R4 |
| Sistema ou integração | O WhatsApp é de onde vêm os planos hoje | DISC-02 C4; DISC-07 I10 |
| Sistema ou integração | A galeria do celular é de onde vêm as fotos | DISC-02 C5 |
| Sistema ou integração | Serviço de música para anexar músicas (a confirmar) | DISC-07 I3; F9 |
| Sistema ou integração | Serviço de mapas (a confirmar) | DISC-07 I12; F15 |
| Ponto fora do padrão Lovable | É um site, mas as fotos e o WhatsApp estão no celular: precisa funcionar bem no navegador do celular | DISC-01 tipo de produto; DISC-02 C5 |

## 6. Escopo proposto

| Módulo, épico ou feature | Situação | Motivo |
|---|---|---|
| F1 Adicionar um plano em um tema | Entra no MVP | Núcleo da O1 |
| F2 "Vamos fazer" e "já fizemos" | Entra no MVP | Ideia original do PO e base da S5 |
| F3 Guardar a partir de um link ou vídeo | Entra no MVP | Na versão simples, colando o link; reduz o esforço de registrar, principal risco da S7 |
| F5 Sortear um plano | Entra no MVP | Simples e atende o objetivo 2 (decidir mais rápido) |
| F7 Registrar a lembrança ao marcar como feito | Entra no MVP | Liga o plano à memória, núcleo da O2 |
| F8 Anexar fotos | Entra no MVP | Testa a S6 |
| F9 Anexar uma música | Entra no MVP | Como link, para testar a S6 sem depender de integração |
| F10 Anexar uma frase | Entra no MVP | Testa a S6 |
| F11 Registrar o lugar | Entra no MVP | Como texto, para testar a S6 sem depender de mapas |
| F14 Temas padrão e criação de novos | Entra no MVP | Testa a S4 e vem da ideia original do PO |
| F4 Sugestões quando o tema estiver vazio | Fica para depois | Complemento, não ataca a dor principal |
| F6 Filmes que os dois querem assistir | Fica para depois | Exige marcação individual e a S3 segue aberta |
| F12 Convite para registrar depois do programa | Fica para depois | Depende de notificações, ainda em avaliação |
| F13 Memória como pequena história | Fica para depois | Ver a memória já atende o MVP |
| F15 Mapa dos lugares | Fica para depois | Depende de integração de mapas |
| F16 Linha do tempo do casal | Fica para depois | A lista "já fizemos" cobre isso no início |
| Chat, compartilhamento com terceiros, "neste dia", datas especiais e revezar registro | Fora do escopo | Definidos no "Não faz" e nas ideias guardadas da 07 (G4, G5) |

*Entra no MVP: proposta de primeira versão, que o PRD (09) fecha e a prototipação constrói. Fica para depois: faz parte da solução, mas não entra na primeira versão (vai para o roadmap do PRD). Fora do escopo: não faz parte desta solução.*

## 7. Restrições e premissas

**Checklist base**

| Restrição | Se aplica | Descrição |
|---|---|---|
| LGPD e dados pessoais | Sim | Fotos e memórias pessoais, com uso restrito ao casal; versão simplificada |
| Integração com sistemas do cliente | Não | Não há sistema existente para integrar |
| Orçamento de tokens | Não | Sem limite definido pelo PO |
| Prazo | Não | Sem prazo definido pelo PO |
| Limitações do Lovable | Avaliar | Envio de fotos pelo celular e bom funcionamento no navegador do celular, a confirmar no PRD |
| Privacidade do casal | Sim | Somente Nathan e Iris acessam qualquer conteúdo |

**Premissas:** os dois têm celular com internet e vão acessar o site pelo navegador; as fotos vêm do celular; o produto é de uso pessoal, sem venda e sem outros usuários.

## 8. Visão do produto (pitch)

| | |
|---|---|
| **Para** | Nathan e Iris, casal recém-formado que adora sair, cozinhar, ir à praia e ver filmes juntos |
| **Que estão insatisfeitos com** | os filmes e lugares que se perdem na conversa do WhatsApp e as fotos misturadas na galeria de um celular só |
| **Nosso produto** | Nathan & Iris · Nosso Espaço é um site privado do casal para guardar o que querem viver e o que já viveram juntos |
| **Que fornece** | uma lista por temas do que vão fazer, que vira memória com foto, música, frase e lugar quando o programa acontece |
| **Ao contrário de** | apps de lista de casal, como o Sparkz, que guardam só o plano, e espaços de memória, como o Between, que guardam só as fotos |
| **O valor diferencial** | juntar no mesmo lugar, por temas, o plano e a lembrança dele: o "vamos fazer" vira "já fizemos" com o momento guardado |

**Pitch em texto corrido:** Para Nathan e Iris, casal recém-formado que adora sair, cozinhar, ir à praia e ver filmes juntos, e que está insatisfeito com os filmes e lugares que se perdem na conversa do WhatsApp e com as fotos misturadas na galeria de um celular só, o Nathan & Iris · Nosso Espaço é um site privado do casal para guardar o que querem viver e o que já viveram juntos. Ele fornece uma lista por temas do que vão fazer, que vira memória com foto, música, frase e lugar quando o programa acontece. Ao contrário de apps de lista de casal, como o Sparkz, que guardam só o plano, e de espaços de memória, como o Between, que guardam só as fotos, ele junta no mesmo lugar, por temas, o plano e a lembrança dele.

## 9. Pendências para as próximas etapas

| # | Pendência | Para a etapa |
|---|---|---|
| P1 | Notificações (Avaliar): definir se e como a F12 vai avisar o casal | 09 PRD |
| P2 | Integrações (Avaliar): serviço de música (F9), mapas (F15) e leitura de links (F3) | 09 PRD |
| P3 | Limitações do Lovable (Avaliar): envio de fotos pelo celular e uso no navegador do celular | 09 PRD e 12 Prototipação |
| P4 | Suposições do foco S1, S2, S3 e S7, de risco alto | 13 Validação |
| P5 | Suposições sobre a solução S4 (temas), S5 (vamos fazer e já fizemos) e S6 (foto, música, frase e lugar) | 13 Validação |
| P6 | D5: o que o casal prefere não registrar | 13 Validação |

## 10. Ajustes do PO

Mudanças feitas pelo PO sobre propostas da skill, com o motivo.

Sem ajustes.

## Histórico de versões

| Versão | Data | Autor | Alteração |
|---|---|---|---|
| 1 | 2026-11-04 | Nathan | Criação do documento, aprovado pelo PO |
