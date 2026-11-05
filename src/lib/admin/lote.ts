// Regras das ações em lote da área de admin (spec 5.3). Sem imports: testado com node --test.

export const LIMITE_LOTE = 200;
const UUID = /^[0-9a-f-]{36}$/i;

export function validarIds(ids: string[]): string | null {
  if (!ids.length) return "Selecione ao menos um item.";
  if (ids.length > LIMITE_LOTE) return `No máximo ${LIMITE_LOTE} itens por vez.`;
  if (!ids.every((id) => UUID.test(id))) return "Seleção inválida.";
  return null;
}

export function confirmacaoOk(texto: string): boolean {
  return texto.trim().toLowerCase() === "apagar";
}

// Mesma regra de caminhoMini em src/lib/dados/memorias.ts (que importa server-only e não roda aqui).
export const miniDe = (caminho: string) => caminho.replace(/\.jpg$/, "_mini.jpg");

export function caminhosComMini(caminhos: string[]): string[] {
  return caminhos.flatMap((c) => [c, miniDe(c)]);
}

// Blocos para remover do armazenamento: a foto e a miniatura sempre no mesmo bloco, até `tamanho` arquivos.
// Cada bloco é removido do bucket e logo em seguida do banco, para os dois nunca ficarem incoerentes.
export function blocosFotoMini(caminhos: string[], tamanho = 100): { fotos: string[]; arquivos: string[] }[] {
  const porBloco = Math.max(1, Math.floor(tamanho / 2));
  const out: { fotos: string[]; arquivos: string[] }[] = [];
  for (let i = 0; i < caminhos.length; i += porBloco) {
    const fotos = caminhos.slice(i, i + porBloco);
    out.push({ fotos, arquivos: caminhosComMini(fotos) });
  }
  return out;
}

// Texto de busca seguro para o filtro .or() do PostgREST (vírgula, parênteses, aspas e curingas quebram a sintaxe).
export function limparBusca(texto: string): string {
  return texto.replace(/[%_,()"'\\*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function separarFeitos(planos: { id: string; situacao: string }[]): { aplicar: string[]; pulados: number } {
  const aplicar = planos.filter((p) => p.situacao !== "ja_fizemos").map((p) => p.id);
  return { aplicar, pulados: planos.length - aplicar.length };
}
