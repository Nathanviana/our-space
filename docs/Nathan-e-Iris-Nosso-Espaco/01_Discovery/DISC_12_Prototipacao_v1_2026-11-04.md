---
produto: Nathan & Iris · Nosso Espaço
documento: Prototipação
fase_design_thinking: 2º diamante · Entregar
versao: 1
data: 2026-11-04
po: Nathan
apoio: Iris
status: Aprovado
origem: Funil interno
documento_anterior: DISC-09 PRD (DISC-10 pulada por decisão do PO)
proximo_documento: DISC-13 Validação do Protótipo
---

# 12 Prototipação: Nathan & Iris · Nosso Espaço

> **Como ler este documento.** Registro do que foi construído a partir do 09 PRD, que é o contexto da construção. O protótipo, se validado, é a base do produto. A seção 5 indica quais fluxos da jornada e quais hipóteses do PRD o protótipo permite testar na validação. Os prompts usados não ficam neste documento, e o consumo de mensagens é conferido na 10.

## 1. Base

| Item | Informação |
|---|---|
| PRD usado | DISC-09, versão 3 |
| Síntese da Solução | DISC-08, versão 2 |
| Estimativa de Tokens | Não realizada, etapa pulada por decisão do PO |
| Projeto no Lovable | Não se aplica: construído em código (Next.js), pasta `our-space`, com o Claude Code |
| Banco de dados | Supabase, projeto our-space (sa-east-1), no lugar do Lovable Cloud (PRD v2) |
| Identidade visual | Identidade própria do casal: tons pastel (verde, amarelo, azul-bebê, lilás), minimalista, efeito liquid glass, referência Apple e Tesla |

## 2. Sequência de construção

| # | Etapa | O que foi feito | Situação |
|---|---|---|---|
| 1 | Fundação | Next.js 15 com TypeScript; navegação livre com menu fixo (Início, Temas, + Adicionar, Sortear); as 9 telas do PRD 7.2 com dados fictícios temporários, sem regras | Feito |
| 2 | Identidade visual | Tokens centralizados no CSS: tons pastel verde, amarelo, azul-bebê e lilás; fundo com gradientes suaves; cards, menu e botões em liquid glass (translúcido com desfoque); tipografia do sistema; um tom por tema | Feito |
| 3 | Supabase e banco de dados, com login próprio (JWT) | 7 tabelas do PRD 7.1 com RLS ativada sem políticas públicas; 7 temas padrão; bucket privado de fotos; login com jose e bcrypt em cookie httpOnly; middleware e layout bloqueiam toda tela sem JWT válido; script de criação das contas e das datas | Feito |
| 4 | Módulo: M3 Organização (Temas) | Temas padrão e próprios ligados ao banco: criar, renomear e trocar ícone, excluir só vazio; novo menu Início, Galeria, +, Mapa, Temas | Feito |
| 5 | Módulo: M1 Planos | Adicionar com título ou só link, tipo opcional; listas "vamos fazer" e "já fizemos" por tema; marcar como feito com data e desfazer; editar e excluir (apaga também as fotos); sorteio animado com filtro por tema, registrado no banco; Início provisório com dados reais | Feito |
| 6 | Módulo: M2 Memórias | Registro com fotos (reduzidas no celular, com miniatura, leitura da localização e da data gravadas na foto), frase, música (link), data e lugar no mapa (toque, busca pelo Nominatim, "Estou aqui" ou "Lugar da foto"); edição e exclusão da memória e de cada foto; tela da memória; galeria com visor em tela cheia e "ver mais"; fotos só por URL assinada de 1 hora | Feito |
| 7 | Módulo: M3 Organização (Mapa) | Mapa em tela cheia (Leaflet e OpenStreetMap): "vamos fazer" em amarelo, "já fizemos" em verde, fotos com localização própria no lugar onde foram tiradas e as demais como capa do ponto da memória (DC3); filtros Tudo, Vamos fazer, Já fizemos e Fotos; toque abre o plano ou a memória; foco ao vir de "Ver no mapa"; lugar opcional ao adicionar ou editar um plano | Feito |
| 8 | Módulo: M4 Nossa história | Início com contador do namoro (anos, meses e dias com contagem animada e relógio ao vivo) e da amizade; parallax em camadas pastel ao rolar, ao mover o mouse e ao inclinar o celular; resumo do espaço com números animados (vamos fazer, já fizemos, memórias, fotos, lugares), cartões das áreas com atalho e entrada suave ao rolar; botão Sair; tudo desligado com "reduzir movimento" | Feito |
| 9 | Dados de teste | Não realizado: o casal usa os dados reais desde o início, por decisão do PO | Não se aplica |

## 3. O que foi construído por módulo

| Módulo | Requisitos construídos | Requisitos do MVP não construídos | Observações |
|---|---|---|---|
| M3 Organização | REQ-10, REQ-12 | Nenhum | Mapa construído depois do M2 (ajuste de execução) |
| M1 Planos | REQ-01, REQ-02, REQ-03, REQ-04 | Nenhum (lugar opcional do plano entrou com o Mapa) | Plano criado só com link mostra o endereço do site como título |
| M2 Memórias | REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-11 | Nenhum | Teste ponta a ponta no banco real: foto não abre por URL pública e abre pela URL assinada |
| M4 Nossa história | REQ-13, REQ-14 | Nenhum | Cálculo do tempo testado em 5 casos, incluindo fim de mês; datas lidas do Espaço |

## 4. Diferenças em relação ao PRD

| Item | Previsto no PRD | Como ficou | Motivo | Tipo | Encaminhamento |
|---|---|---|---|---|---|
| Primeira tela | Início com temas e últimos planos e memórias | Pedido: contador animado do tempo juntos (amizade e namoro) com parallax e resumo do site, estilo landing page | Pedido do PO após ver a Fundação | Mudança de escopo | Feito: DISC-08 v2 e DISC-09 v3 aprovadas (10 pulada por decisão do PO) |
| Galeria | Não previsto | Pedido: tela só com as fotos | Pedido do PO após ver a Fundação | Mudança de escopo | Feito: DISC-08 v2 e DISC-09 v3 aprovadas |
| Mapa com fotos | F15 Mapa na Fase 3 do roadmap | Pedido: tela de mapa no MVP, com as fotos no lugar onde foram tiradas | Pedido do PO após ver a Fundação | Mudança de escopo | Feito: DISC-08 v2 e DISC-09 v3 aprovadas |
| Telas dedicadas e intuitivas | Telas do PRD 7.2 | Cada tela focada na própria função, com uso intuitivo | Pedido do PO | Ajuste de execução | Nenhum: aplicado nos módulos |
| Ordem do M3 | M3 inteiro antes do M1 | Temas no início; Mapa (REQ-12) depois do M2 | O mapa usa os lugares das memórias | Ajuste de execução | Nenhum |
| Edição do plano | Dentro da tela Plano | Tela própria de edição, aberta pela tela Plano | Formulário mais limpo no celular | Ajuste de execução | Nenhum |

## 5. Fluxos cobertos para a validação

| # | Fluxo da jornada | Persona | Oportunidade atendida | Módulos envolvidos | Hipóteses do PRD testadas |
|---|---|---|---|---|---|
| FL1 | Guardar um plano que surgiu na conversa ou num vídeo: título ou só o link, tema e lugar opcional | Nathan & Iris | O1, O3 | M1, M3 | H1, H7 |
| FL2 | Escolher o próximo programa pela lista "vamos fazer" do tema ou pelo sorteio | Nathan & Iris | O1 | M1 | H5 |
| FL3 | Marcar o plano como feito e registrar a memória com fotos, frase, música e lugar no mapa | Nathan & Iris | O1, O2 | M1, M2 | H6, H2 |
| FL4 | Reviver os momentos pela galeria e pelo mapa, com as fotos no lugar | Nathan & Iris | O2 | M2, M3 | H2 |
| FL5 | Abrir o site, ver o tempo juntos e o resumo do espaço e seguir para uma área | Nathan & Iris | O2 | M4 | H4 |
| FL6 | Encontrar um plano e uma memória específicos pelos temas | Nathan & Iris | O1, O2 | M3, M1, M2 | H7 |
| FL7 | Uso livre de todos os fluxos pela Iris, sozinha | Nathan & Iris | O1, O2, O3 | M1, M2, M3, M4 | H3 |

Não há oportunidade de prioridade alta (DISC-06). As sete hipóteses do PRD v3 (H1 a H7) aparecem em pelo menos um fluxo.

## 6. Dados de teste

Sem dados de teste, por decisão do PO: o casal usa o site com os próprios dados desde o início, que é também como a H4 será testada. Os únicos registros criados pela construção foram os testes automáticos de ponta a ponta, apagados ao final de cada teste.

| Entidade | Volume aproximado | Observação |
|---|---|---|
| Usuário | 2 | Contas reais de Nathan e Iris, criadas pelo próprio PO com o script |
| Espaço | 1 | Datas reais da amizade e do namoro, informadas pelo PO |
| Tema | 7 | Temas padrão (C11) |
| Plano, Memória, Foto, Sorteio | 0 | Preenchidos pelo casal no uso real |

## 7. Atualizações

Primeira construção, sem atualizações.

## 8. Ajustes do PO

Mudanças feitas pelo PO sobre propostas da skill, com o motivo.

| Item | Proposta original | Como ficou | Motivo | Classificação |
|---|---|---|---|---|
| Plataforma de construção | Lovable, com prompts do padrão do time | Código (Next.js, Supabase e Vercel), construído com o Claude Code | Decisão do PO; PRD atualizado na v2 | Informado pelo PO |
| Identidade visual | Design system da Grownt (produto interno) | Identidade própria do casal | Site pessoal do casal | Informado pelo PO |
| Estimativa de Tokens | Fazer a 10 antes da 12 | Etapa pulada | Decisão do PO | Contraria evidência |
| Dados de teste | Gerar dados fictícios para demonstrar os fluxos | Etapa não realizada; uso com dados reais desde o início | Decisão do PO; o uso real é o teste da H4 | Informado pelo PO |

## Histórico de versões

| Versão | Data | Autor | Alteração |
|---|---|---|---|
| 1 | 2026-11-04 | Nathan | Criação do documento: construção em código dos 4 módulos do MVP (PRD v3), aprovado pelo PO |
