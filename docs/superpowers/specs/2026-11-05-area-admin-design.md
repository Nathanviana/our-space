# Área de admin do Nosso Espaço: design

Data: 2026-11-05 · PO: Nathan · Status: aguardando aprovação

## 1. Intenção

Hoje, nome, senha e datas do contador só mudam rodando o script `npm run criar-contas` no terminal. Para limpar ou reorganizar muitos planos, é preciso abrir um por um. Também não há como saber quanto do plano gratuito da Supabase já foi usado.

A área de admin é um lugar separado do uso do dia a dia para cuidar do espaço "por trás". Nela ficam:

1. **Métricas** do espaço.
2. **Gestão dos dois usuários e do tempo juntos.**
3. **Ações em lote** sobre planos, memórias, fotos e temas.
4. **Infra**: quanto do banco e do armazenamento já foi usado.

## 2. Quem usa

Nathan e Iris, com o mesmo poder. Não há papel de administrador: quem está logado entra. O login atual (JWT no cookie, middleware e `exigirSessao`) continua sendo a única barreira, e toda ação nova também chama `exigirSessao()`.

## 3. Objetivos, não objetivos e anti-objetivos

**Objetivos**
- Alterar nome, e-mail e senha de qualquer um dos dois, e as datas de amizade e namoro, sem terminal.
- Apagar ou modificar vários itens de uma vez, com confirmação que mostra o tamanho do estrago.
- Ver os indicadores do PRD (seção 2) e os totais do espaço.
- Ver quanto do banco e do armazenamento de fotos já foi usado, em relação aos limites do plano gratuito.

**Não objetivos**
- Criar ou remover contas. Continuam sendo só as duas, e criar continua no script.
- Números que só a API de gestão da Supabase tem, como plano contratado, banda do mês e histórico. *Decisão:* não guardar um token pessoal da conta Supabase no site, porque ele dá acesso à conta inteira.
- Desfazer exclusões, lixeira ou backup.
- Gráficos elaborados. Números e uma tabela simples por mês bastam.

**Anti-objetivos (seria fracasso mesmo funcionando)**
- Apagar algo sem uma confirmação clara do que vai sumir, incluindo quantas fotos.
- Apagar do banco e deixar as fotos ocupando o armazenamento.
- Permitir que alguém que já não sabe a senha antiga continue logado depois de uma troca de senha.
- Atrapalhar o uso do dia a dia: o menu de baixo continua com os mesmos 5 itens.

## 4. Como se chega lá

- Rota `/admin`, dentro do grupo `(app)`, de modo que herda o layout com sessão obrigatória e o menu de baixo.
- *Minha decisão:* a entrada é um link discreto "⚙ Admin" no topo da página inicial, e não um 6º item no menu.
- A rota tem 4 subpáginas, com navegação por abas no topo: `/admin` (métricas), `/admin/pessoas`, `/admin/lote` e `/admin/infra`.
- Fica também em `/admin/pessoas` o botão "Sair", que hoje não aparece em lugar nenhum da interface. *Decisão minha:* usa a action `sair` que já existe.

## 5. Partes

### 5.1 Métricas (`/admin`)
- **Totais:** planos em "vamos fazer", planos em "já fizemos", memórias, fotos, lugares distintos, temas e sorteios. Reaproveita `resumoDoEspaco()` e acrescenta o que falta.
- **Indicadores do PRD**, por mês, nos últimos 12 meses, em tabela:
  1. Planos marcados como feitos no mês (`planos.feito_em`).
  2. Sorteios no mês e, desses, quantos viraram programa. *Decisão minha:* o sorteio entra no mês em que foi feito, e planos distintos sorteados no mês são contados uma vez cada, mesmo que sorteados várias vezes. Um plano "virou programa" se hoje está em "já fizemos" e tem `feito_em` maior ou igual à data do sorteio.
  3. Percentual de planos feitos que têm memória. *Decisão minha:* uma coluna por mês, usando o mês de `feito_em`, mais um número geral de todo o período. A conta é planos "já fizemos" com memória ÷ total de "já fizemos".
- **Por pessoa:** planos criados, memórias registradas e fotos enviadas por cada um (colunas `criado_por`, `registrada_por`, `enviada_por`).
- **Por tema:** quantos planos em cada situação.

### 5.2 Pessoas e tempo (`/admin/pessoas`)
- Um cartão para cada um dos dois usuários, com:
  - **nome** (obrigatório, até 40 caracteres);
  - **e-mail** (obrigatório, único, guardado em minúsculas);
  - **nova senha** com confirmação (mínimo de 8 caracteres, a mesma regra do script).
- Qualquer um dos dois pode alterar os dados do outro. Para trocar senha, pedir a **senha atual de quem está logado**, como confirmação. Assim, um celular desbloqueado e esquecido não basta para trocar a senha.
- **Troca de senha derruba as sessões abertas da conta.** Isso exige a nova coluna `usuarios.sessao_desde timestamptz`. A troca grava `now()`, e `exigirSessao()` passa a recusar um JWT com `iat` anterior a esse valor. Se a pessoa trocou a própria senha, o servidor emite um cookie novo para ela, que continua logada.
  - *Decisão minha:* a verificação fica só no servidor, em `exigirSessao()`, e o middleware continua sem acessar o banco.
  - Ao recusar um token, `exigirSessao()` redireciona para uma nova rota `GET /sair`, um route handler que apaga o cookie e manda para `/login`. Isso evita o ciclo em que o middleware veria o JWT ainda assinado e devolveria a pessoa para `/`.
  - O middleware deixa `/sair` passar sempre.
- Se a pessoa mudou o próprio nome, o cookie é reemitido com o nome novo, porque o nome vai dentro do JWT.
- **Tempo juntos:** um cartão com as duas datas, início da amizade e início do namoro, que alimentam o contador. A validação é que nenhuma data seja futura e que o namoro não seja anterior à amizade.

### 5.3 Ações em lote (`/admin/lote`)
- Abas por tipo: **Planos**, **Memórias**, **Fotos** e **Temas**.
- Cada aba tem uma lista com caixa de seleção por linha, "selecionar todos os visíveis" e filtros simples:
  - planos: tema, situação e busca por texto;
  - fotos: memória ou mês.
- **Ações:**
  - **Planos:** apagar; mudar de tema; marcar como "vamos fazer" (limpa `feito_em`); marcar como "já fizemos" (grava `feito_em` = hoje). *Decisão minha:* planos que já estão em "já fizemos" são pulados, para não sobrescrever a data real. Se o plano já tem memória e é marcado como "vamos fazer", a memória continua guardada, como acontece hoje no "desfazer".
  - **Memórias:** apagar (com as fotos; o plano fica e continua "já fizemos").
  - **Fotos:** apagar.
  - **Temas:** renomear um por vez (já existe em /temas); apagar em lote só os vazios. *Decisão minha:* tema com planos não é apagado; a tela diz quais foram pulados e por quê.
- **Confirmação:** antes de apagar, um diálogo com a contagem do que vai sumir em cascata, por exemplo "12 planos, 4 memórias e 30 fotos. Isso não tem volta". Para apagar, é preciso digitar a palavra `apagar`.
- **Fotos no armazenamento:** toda exclusão primeiro junta os caminhos das fotos afetadas e os remove do bucket `fotos`. Só depois apaga as linhas do banco, seguindo o padrão de `excluirPlano`. Se a remoção do armazenamento falhar, o banco não é tocado e a tela mostra o erro.
- **Limite:** no máximo 200 itens por ação, para não estourar o tempo de uma Server Action na Vercel.

### 5.4 Infra (`/admin/infra`)
- **Banco:** tamanho atual e porcentagem dos 500 MB do plano gratuito.
- **Armazenamento de fotos:** total ocupado, número de arquivos e tamanho médio, com a porcentagem de 1 GB.
- **Linhas por tabela:** contagem de cada tabela pública.
- **Fotos órfãs:** arquivos no bucket sem linha correspondente em `fotos`, com um botão para apagá-los, que usa a mesma confirmação da 5.3.
- Os limites (500 MB e 1 GB) ficam em constantes no código, com comentário dizendo de onde vêm.
- **Como ler esses números:** nova função SQL `public.admin_infra()` (`security definer`), que lê `pg_database_size(current_database())`, a soma de `metadata->>'size'` em `storage.objects` do bucket `fotos` e as contagens. O direito de execução fica revogado de `public`, `anon` e `authenticated` e concedido só a `service_role`. É chamada por `db().rpc('admin_infra')`.

## 6. Mudanças no banco

Uma migração nova, `supabase/migrations/20261105000001_area_admin.sql`, com:
- `alter table usuarios add column sessao_desde timestamptz not null default '1970-01-01'`. *Decisão minha:* usar um valor antigo para que aplicar a migração não desconecte ninguém. O valor só muda numa troca de senha.
- a função `admin_infra()` com os grants da seção 5.4.

**Aplicar em produção** não é feito pelo assistente sem autorização explícita do PO. O código lida com a migração ausente: a tela de infra mostra "migração pendente" em vez de quebrar.

**Isso vale também para `sessao_desde`.** Sem a coluna, `exigirSessao` precisa continuar funcionando, ignorando a verificação, para o site não sair do ar entre a publicação e a migração. O ideal é aplicar a migração antes de publicar.

## 7. Restrições

- Next 15 (App Router), Server Components e Server Actions, como no resto do projeto. Nenhuma dependência nova.
- Todo acesso ao banco pelo servidor com a chave de serviço (`db()`), nunca pelo navegador.
- Visual: reaproveitar `globals.css` e `components/ui.tsx`. A área tem que funcionar no celular, primeiro.
- Textos em português, no tom do resto do site.

## 8. Deixado para quem constrói

- Layout exato das tabelas e cartões.
- Como paginar ou rolar listas longas no lote.
- Organização interna das funções em `src/lib/dados/admin.ts` e `src/app/(app)/admin/**/actions.ts`.
