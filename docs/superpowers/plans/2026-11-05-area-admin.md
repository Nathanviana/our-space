# Área de admin — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** área `/admin` com métricas, gestão das duas pessoas e das datas, ações em lote e infra do Supabase.

**Arquitetura:** a área é formada por páginas Server Component dentro de `src/app/(app)/admin/`, que herdam a sessão obrigatória, e por Server Actions que sempre chamam `exigirSessao()`.
- A lógica que dá para isolar (cálculo das métricas, validações, plano de exclusão em lote, fotos órfãs, validade da sessão) fica em módulos puros, **sem imports**, em `src/lib/admin/`, e é testada com `node --test`.
- O acesso ao banco fica em `src/lib/dados/admin.ts`.

**Stack técnica:** Next 15 App Router, React 19, Supabase JS com service role, bcryptjs, jose e `node:test` (Node 24, roda `.ts` direto).

**Spec:** `docs/superpowers/specs/2026-11-05-area-admin-design.md`

## Restrições globais

- Nenhuma dependência nova no `package.json`. Os testes usam `node --test`.
- Os módulos em `src/lib/admin/*.ts` não importam nada, nem `@/`, para rodar em `node --test` sem bundler.
- Os testes ficam em `tests/*.test.mjs` e importam `../src/lib/admin/<x>.ts`.
- Toda Server Action nova começa com `await exigirSessao()`.
- Banco só via `db()` no servidor.
- IDs são validados com `/^[0-9a-f-]{36}$/i`.
- Exclusão: primeiro remover do bucket `fotos` o caminho **e** `caminhoMini(caminho)` de cada foto. Se o storage der erro, não apagar nada no banco e devolver o erro.
- Lote: no máximo **200** ids por ação. Para apagar, é preciso confirmar digitando exatamente `apagar`.
- Limites do plano gratuito: banco **500 MB** (`500 * 1024 * 1024`) e armazenamento **1 GB** (`1024 ** 3`).
- Senha com no mínimo **8** caracteres e hash com `bcrypt.hash(senha, 12)`. Nome com até **40** caracteres. E-mail com trim, em minúsculas e único.
- Textos em português do Brasil. Visual com as classes de `globals.css` (`card`, `formulario`, `botao`, `lista`, `item`, `erro`, `chips`, `chip`). O layout precisa funcionar no celular.
- Não fazer commit: o PO pede commit separadamente. Não aplicar a migração em produção sem autorização.
- O botão "Sair" já existe na página inicial (`src/app/(app)/page.tsx`). Não duplicar.

## Pontos de revisão

1. Fotos ficam órfãs quando a remoção no storage falha no meio de um lote. O esperado é que o banco não seja tocado e a tela mostre o erro. A regra é coberta no Task 5 (`planoDeExclusao`) e na ordem das operações da action.
2. A migração ainda não foi aplicada (falta a coluna `sessao_desde` ou a função `admin_infra`). O esperado é o site continuar funcionando, com a tela de infra mostrando "Migração pendente". Coberto no Task 1 (`sessaoAindaValida` com `null`) e no Task 6.
3. Alguém troca o e-mail para um que já é do outro. O esperado é a mensagem "Esse e-mail já é usado pela outra conta.", sem erro genérico. Coberto no Task 3.
4. Sessão de um aparelho antigo depois da troca de senha. O esperado é ir para `/login` sem entrar em ciclo de redirecionamento. Coberto no Task 1.
5. Lote com tema que tem planos, ou com plano já em "já fizemos". O esperado é pular esses itens e dizer quantos foram pulados. Coberto no Task 5.

---

### Task 1: Base de testes, migração e sessão revogável

**Arquivos:**
- Modificar: `package.json`, adicionar o script `"test": "node --test tests/"`.
- Criar: `src/lib/admin/sessao.ts`, `tests/sessao.test.mjs`.
- Criar: `supabase/migrations/20261105000001_area_admin.sql`.
- Modificar: `src/lib/auth.ts`, `src/lib/sessao.ts` (expor `iat`), `src/middleware.ts`.
- Criar: `src/app/sair/route.ts`.

**Interfaces:**
- Produz: `sessaoAindaValida(iatSeg: number | undefined, sessaoDesdeIso: string | null): boolean`.
- Produz: `Sessao` passa a ter `iat?: number`.
- Produz: a rota `GET /sair`.
- Produz: na migração, a coluna `usuarios.sessao_desde` e a função `public.admin_infra()`, que devolve `jsonb` no formato `{ banco_bytes: number, fotos_bytes: number, fotos_arquivos: number, tabelas: { [nome]: number }, objetos: string[] }`. `objetos` traz os nomes dos arquivos do bucket `fotos`.

- [ ] **Passo 1: testes que falham** em `tests/sessao.test.mjs`:
  - `sessaoDesde null → true`: `sessaoAindaValida(100, null) === true` (migração ausente ou nunca trocou).
  - `iat ausente → false quando há sessaoDesde`: `sessaoAindaValida(undefined, "2026-11-05T10:00:00Z") === false`.
  - `iat anterior → false`: o `iat` de `2026-11-05T09:59:59Z` em segundos dá `false`.
  - `iat igual ou posterior → true`: `iat = Date.parse("2026-11-05T10:00:00Z")/1000` dá `true`.
- [ ] **Passo 2:** `npm test` → FALHA (módulo inexistente).
- [ ] **Passo 3:** implementar `sessaoAindaValida`. A comparação é em segundos inteiros: `iat >= Math.floor(Date.parse(desde)/1000)`.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5: migração.**
  - `alter table public.usuarios add column if not exists sessao_desde timestamptz not null default '1970-01-01';`
  - `create or replace function public.admin_infra() returns jsonb language sql security definer set search_path = public, storage`. O corpo devolve:
    - `banco_bytes`: `pg_database_size(current_database())`;
    - `fotos_bytes`: soma de `(metadata->>'size')::bigint`;
    - `fotos_arquivos`: contagem;
    - `objetos`: `jsonb_agg(name)` de `storage.objects where bucket_id = 'fotos'`, com `coalesce` para `0` ou `[]`;
    - `tabelas`: `jsonb_build_object` com `count(*)` de cada uma das 7 tabelas públicas.
  - `revoke all on function public.admin_infra() from public, anon, authenticated; grant execute on function public.admin_infra() to service_role;`
- [ ] **Passo 6:** `verificarSessao` devolve `iat` do payload.
- [ ] **Passo 7:** `exigirSessao()` busca `usuarios.sessao_desde` pelo `sub`.
  - Se a consulta der erro, por exemplo porque a coluna não existe, a sessão é tratada como válida.
  - Se não houver linha, ou se `!sessaoAindaValida(...)`, faz `redirect("/sair")`.
- [ ] **Passo 8:** `src/app/sair/route.ts` com `GET`, que apaga o cookie `COOKIE_SESSAO` e redireciona 303 para `/login`.
  - No middleware, `/sair` passa sem nenhuma checagem.
- [ ] **Passo 9:** `npx tsc --noEmit` sem erros.

### Task 2: Casca da área de admin

**Arquivos:**
- Criar: `src/app/(app)/admin/layout.tsx`, `src/app/(app)/admin/abas.tsx` (client).
- Modificar: `src/app/(app)/page.tsx` (link "⚙ Admin" no topo, `href="/admin"`, classe `admin-link`).
- Modificar: `src/app/globals.css` (`.admin-link`, `.abas`, `.aba`, `.aba.ativo`, `.tabela`, `.barra-uso`).

**Interfaces:**
- Produz: o layout com `<Cabecalho titulo="Admin" voltar="/" />` e as abas Métricas (`/admin`), Pessoas (`/admin/pessoas`), Lote (`/admin/lote`) e Infra (`/admin/infra`).
- Produz: `.aba.ativo`, usando `usePathname`; Métricas fica ativa só quando o caminho é exatamente `/admin`.
- Produz: `.tabela`, uma tabela com rolagem horizontal própria (`overflow-x:auto` no contêiner), para a página não rolar de lado.
- Produz: `.barra-uso`, uma barra de progresso.

- [ ] **Passo 1:** implementar o layout e as abas.
- [ ] **Passo 2:** `npx tsc --noEmit` sem erros. Depois, `npm run dev` e abrir `/admin`: as abas aparecem a 375 px de largura, sem rolagem horizontal da página.

### Task 3: Pessoas e tempo juntos

**Arquivos:**
- Criar: `src/lib/admin/validacao.ts`, `tests/validacao.test.mjs`.
- Criar: `src/app/(app)/admin/pessoas/page.tsx`, `src/app/(app)/admin/pessoas/actions.ts`, `src/app/(app)/admin/pessoas/form-pessoa.tsx`, `src/app/(app)/admin/pessoas/form-datas.tsx`.

**Interfaces:**
- Produz: `validarPessoa(d: { nome: string; email: string; novaSenha: string; confirmacao: string }): { erro?: string; nome: string; email: string; trocarSenha: boolean }`.
- Produz: `validarDatas(amizade: string, namoro: string, hoje: string): string | null`, que devolve a mensagem de erro ou `null`.
- Produz: `salvarPessoa(_: EstadoForm, form: FormData): Promise<EstadoForm>` e `salvarDatas(_: EstadoForm, form: FormData): Promise<EstadoForm>`, com `interface EstadoForm { erro?: string; ok?: string }`.

- [ ] **Passo 1: testes que falham**
  - `validarPessoa`:
    - com nome vazio, dá o erro `"Preencha o nome."`;
    - um nome de 41 caracteres sai cortado em 40;
    - `" Iris@X.com "` vira o email `"iris@x.com"`;
    - um email sem `@` dá `"E-mail inválido."`;
    - com nova senha vazia e confirmação vazia, `trocarSenha` é `false` e não há erro;
    - uma senha de 7 caracteres dá `"A senha precisa ter pelo menos 8 caracteres."`;
    - se a confirmação for diferente, o erro é `"As senhas não conferem."`.
  - `validarDatas`, com `hoje="2026-11-05"`:
    - um formato inválido dá `"Use datas válidas."`;
    - uma amizade futura dá `"As datas não podem ser no futuro."`;
    - um namoro antes da amizade dá `"O namoro não pode começar antes da amizade."`;
    - se as datas forem iguais, o resultado é `null`.
- [ ] **Passo 2:** `npm test` → FALHA.
- [ ] **Passo 3:** implementar as validações.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5:** implementar a action `salvarPessoa` (campos `id`, `nome`, `email`, `novaSenha`, `confirmacao`, `senhaAtual`).
  - Se `trocarSenha` for verdadeiro, confere `senhaAtual` com o hash **de quem está logado** (`sessao.sub`). Se não bater, devolve `"Sua senha atual não confere."`.
  - O `update` grava `nome` e `email` e, se trocou a senha, também `senha_hash` e `sessao_desde = new Date().toISOString()`.
  - Se o Postgres devolver o código `23505`, a resposta é `"Esse e-mail já é usado pela outra conta."`.
  - Se `id === sessao.sub` e houve troca de nome ou de senha, emite um cookie novo com `assinarSessao`, usando as mesmas opções de `login/actions.ts`. Para isso, extrair essas opções para `opcoesCookie()` em `src/lib/sessao.ts` e usar nos dois lugares.
  - Termina com `revalidatePath("/", "layout")` e `{ ok: "Salvo." }`.
- [ ] **Passo 6:** implementar a action `salvarDatas`, que faz `upsert` em `espaco` com `id: 1` e usa `hoje()` de `@/lib/hoje`.
- [ ] **Passo 7:** página com um cartão por usuário (`select id, nome, email order by criado_em`).
  - O cartão tem os campos de senha marcados "deixe em branco para manter". O campo "sua senha atual" aparece com a legenda "só para trocar senha".
  - Mais um cartão "Tempo juntos" com os dois `input type="date"`.
  - Os formulários são client e usam `useActionState`.
- [ ] **Passo 8:** `npx tsc --noEmit` sem erros. No `npm run dev`:
  - mudar o próprio nome atualiza o contador da página inicial;
  - um e-mail duplicado mostra a mensagem certa.

### Task 4: Métricas

**Arquivos:**
- Criar: `src/lib/admin/metricas.ts`, `tests/metricas.test.mjs`.
- Criar: `src/lib/dados/admin.ts` (com a função `dadosMetricas`).
- Criar: `src/app/(app)/admin/page.tsx`.

**Interfaces:**
- Consome: `resumoDoEspaco()`.
- Produz:
  ```ts
  type PlanoM = { id: string; temaId: string; situacao: "vamos_fazer"|"ja_fizemos"; feitoEm: string|null; temMemoria: boolean; criadoPor: string|null }
  type SorteioM = { planoId: string; data: string }   // ISO
  type LinhaMes = { mes: string /* "2026-11" */; feitos: number; sorteados: number; sorteadosFeitos: number; comMemoria: number }
  calcularMeses(planos: PlanoM[], sorteios: SorteioM[], hoje: string /* AAAA-MM-DD */): LinhaMes[] // 12 linhas, do mês de hoje para trás
  percentualComMemoria(planos: PlanoM[]): number | null // 0–100 arredondado; null se nenhum feito
  ```
- Produz: `dadosMetricas(): Promise<{ resumo: Resumo; temas: number; sorteios: number; meses: LinhaMes[]; geralComMemoria: number|null; porPessoa: { nome: string; planos: number; memorias: number; fotos: number }[]; porTema: { nome: string; icone: string; vamosFazer: number; jaFizemos: number }[] }>`.

- [ ] **Passo 1: testes que falham**
  - `calcularMeses`, com `hoje="2026-11-05"`:
    - o resultado tem 12 linhas, a primeira com `mes "2026-11"` e a última com `"2025-12"`;
    - um plano feito em `2026-10-20` com memória conta `feitos=1` e `comMemoria=1` na linha `"2026-10"`;
    - um plano sorteado 2 vezes em novembro dá `sorteados=1`;
    - um plano sorteado em `2026-11-01T12:00Z` e feito em `2026-11-03` dá `sorteadosFeitos=1`;
    - um plano sorteado em `2026-11-04` e feito em `2026-11-03` dá `sorteadosFeitos=0`;
    - um plano sorteado que está em "vamos fazer" dá `sorteadosFeitos=0`;
    - sorteios e feitos de mais de 12 meses atrás são ignorados.
  - `percentualComMemoria`:
    - com 3 feitos, dos quais 2 com memória, dá `67`;
    - sem nenhum feito, dá `null`.
- [ ] **Passo 2:** `npm test` → FALHA.
- [ ] **Passo 3:** implementar. O "virou programa" segue a spec 5.1: `situacao === "ja_fizemos" && feitoEm >= data.slice(0,10)`.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5:** `dadosMetricas()` busca:
  - planos com `id, tema_id, situacao, feito_em, criado_por, memorias(id)`;
  - sorteios;
  - usuários;
  - temas;
  - as contagens por pessoa de `memorias.registrada_por` e de `fotos.enviada_por`.
- [ ] **Passo 6:** página com:
  - cards de totais (reaproveitando os números do resumo, mais temas e sorteios);
  - a tabela mensal, com as colunas Mês, Feitos, Sorteados, Sorteados que viraram programa e % com memória (`comMemoria/feitos`, ou "—");
  - o geral com memória;
  - uma tabela por pessoa e uma por tema.
- [ ] **Passo 7:** `npx tsc --noEmit` sem erros.

### Task 5: Ações em lote

**Arquivos:**
- Criar: `src/lib/admin/lote.ts`, `tests/lote.test.mjs`.
- Criar: `src/app/(app)/admin/lote/page.tsx`, `src/app/(app)/admin/lote/actions.ts`, `src/app/(app)/admin/lote/lista-lote.tsx` (client).
- Modificar: `src/lib/dados/admin.ts` (com a função `itensLote`).

**Interfaces:**
- Produz:
  ```ts
  const LIMITE_LOTE = 200
  validarIds(ids: string[]): string | null   // vazio → "Selecione ao menos um item."; >200 → "No máximo 200 itens por vez."; id fora do padrão → "Seleção inválida."
  confirmacaoOk(texto: string): boolean       // texto.trim().toLowerCase() === "apagar"
  caminhosComMini(caminhos: string[]): string[] // [c, c.replace(/\.jpg$/, "-mini.jpg")] — MESMA regra de caminhoMini em src/lib/dados/memorias.ts; o implementador confere e copia a regra
  separarFeitos(planos: {id:string; situacao:string}[]): { aplicar: string[]; pulados: number }
  ```
- Produz: em `actions.ts`, `type Tipo = "planos"|"memorias"|"fotos"|"temas"` e:
  - `contarExclusao(tipo, ids): Promise<{ planos: number; memorias: number; fotos: number; temas: number; temasComPlanos: number }>`;
  - `apagarLote(tipo, ids, confirmacao): Promise<{ erro?: string; ok?: string }>`;
  - `moverPlanos(ids, temaId)`;
  - `marcarPlanos(ids, situacao)`.
  - Todas devolvem `{ erro?: string; ok?: string }`, e o `ok` diz quantos itens foram afetados e quantos foram pulados.
- Produz: `itensLote(tipo: Tipo, filtros: { tema?: string; situacao?: string; q?: string })`, uma lista de linhas `{ id, titulo, detalhe }` com até 500 itens.

- [ ] **Passo 1: testes que falham**
  - `validarIds`: casos vazio, 201 itens e `"abc"`, cada um com sua mensagem; 200 UUIDs válidos dão `null`.
  - `confirmacaoOk`: `" Apagar "` dá `true`; `"apaga"` dá `false`.
  - `caminhosComMini`: devolve o par para cada caminho.
  - `separarFeitos`: planos já em `ja_fizemos` vão para `pulados`.
- [ ] **Passo 2:** `npm test` → FALHA.
- [ ] **Passo 3:** implementar. Se a regra de `caminhoMini` for diferente da que está acima, ajustar o teste e o código para a regra real.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5:** implementar as actions.
  - `apagarLote`:
    1. valida ids e confirmação;
    2. junta os caminhos de fotos de todos os afetados em cascata (plano → memórias → fotos);
    3. remove do bucket em blocos de 100, usando `caminhosComMini`. Se algum bloco der `error`, retorna `"Não consegui apagar as fotos do armazenamento. Nada foi apagado."`, sem tocar no banco;
    4. só então faz `delete().in("id", ids)`.
  - Temas: apaga só os que estão sem planos e devolve no `ok` quantos foram pulados.
  - `marcarPlanos("ja_fizemos")` usa `separarFeitos` e `feito_em = hoje()`; `"vamos_fazer"` limpa `feito_em`.
  - Toda action termina com `revalidatePath("/", "layout")`.
- [ ] **Passo 6:** a página lê `searchParams` (`tipo`, `tema`, `situacao`, `q`), mostra os chips de tipo e os filtros como formulário GET, e renderiza `ListaLote`.
- [ ] **Passo 7:** `ListaLote`:
  - caixas de seleção, "selecionar todos visíveis" e um contador de selecionados;
  - barra de ações conforme o tipo;
  - "Apagar" chama `contarExclusao` e abre um `<dialog>` com o texto "Você vai apagar X planos, Y memórias e Z fotos. Isso não tem volta.", um campo para digitar `apagar` e o botão desabilitado até `confirmacaoOk`;
  - mostra o `ok` ou o `erro` da action.
- [ ] **Passo 8:** `npx tsc --noEmit` sem erros. No `npm run dev`, mover 2 planos de tema e apagar 1 plano de teste com foto; a foto some do bucket.

### Task 6: Infra

**Arquivos:**
- Criar: `src/lib/admin/infra.ts`, `tests/infra.test.mjs`.
- Criar: `src/app/(app)/admin/infra/page.tsx`, `src/app/(app)/admin/infra/actions.ts`, `src/app/(app)/admin/infra/orfas.tsx` (client).
- Modificar: `src/lib/dados/admin.ts` (com a função `dadosInfra`).

**Interfaces:**
- Consome: `admin_infra()` (Task 1), `validarIds`/`confirmacaoOk` (Task 5) e `caminhosComMini`.
- Produz:
  ```ts
  const LIMITE_BANCO = 500 * 1024 * 1024  // plano gratuito Supabase
  const LIMITE_FOTOS = 1024 ** 3          // plano gratuito Supabase
  formatarBytes(n: number): string        // 0→"0 B", 1536→"1,5 KB", 5242880→"5 MB" (vírgula decimal, 1 casa só se não inteiro)
  percentual(usado: number, limite: number): number // 0–100, 1 casa, limitado a 100
  fotosOrfas(objetos: string[], caminhosNoBanco: string[]): string[] // objetos que não são caminho nem mini de nenhuma foto do banco
  ```
- Produz: `dadosInfra(): Promise<{ pendente: true } | { pendente: false; bancoBytes; fotosBytes; fotosArquivos; tabelas: Record<string, number>; orfas: string[] }>`. O valor é `pendente: true` quando a rpc dá erro.
- Produz: `apagarOrfas(caminhos: string[], confirmacao: string): Promise<{ erro?: string; ok?: string }>`. Antes de apagar, recalcula as órfãs no servidor e só apaga a interseção.

- [ ] **Passo 1: testes que falham** para `formatarBytes` (os 3 casos acima), `percentual(600, 500) === 100`, `percentual(1, 3) === 33.3` e `fotosOrfas`. Neste último, com `["a/1.jpg","a/1-mini.jpg","b/2.jpg"]` e banco `["a/1.jpg"]`, o resultado é `["b/2.jpg"]`; o sufixo do mini segue a regra real confirmada no Task 5.
- [ ] **Passo 2:** `npm test` → FALHA.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5:** página.
  - Se `pendente`, mostra um card "Migração pendente: aplique `supabase/migrations/20261105000001_area_admin.sql` para ver estes números."
  - Senão, mostra:
    - Banco e Fotos, com `.barra-uso`, tamanho/limite e %;
    - arquivos e tamanho médio;
    - a tabela de linhas por tabela;
    - as órfãs (`Orfas`), com o botão de apagar e o mesmo diálogo de confirmação.
- [ ] **Passo 6:** `npx tsc --noEmit` sem erros.

### Task 7: Verificação final

- [ ] `npm test`: todos passam.
- [ ] `npm run lint`: sem erros.
- [ ] `npm run build`: build conclui.
- [ ] No `npm run dev` com o `.env.local`, entrar e percorrer as 4 abas a 375 px de largura, sem rolagem horizontal.
- [ ] Relatar ao PO que a migração precisa ser aplicada antes de publicar, e pedir autorização para aplicar via Supabase.
