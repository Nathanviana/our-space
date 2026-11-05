// Leitura completa de uma consulta paginada. O PostgREST da Supabase corta cada resposta em 1000 linhas;
// sem isto, contagens e listas de fotos ficariam incompletas sem aviso. Sem imports: testado com node --test.

export async function lerPaginado<T>(buscarPagina: (de: number, ate: number) => Promise<T[]>, pagina = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let de = 0; ; de += pagina) {
    const linhas = await buscarPagina(de, de + pagina - 1);
    out.push(...linhas);
    if (linhas.length < pagina) return out;
  }
}
