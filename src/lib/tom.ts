// Tom pastel do tema (identidade visual): ciclo verde, amarelo, azul, lilás
export function tom(indice: number) {
  return `tom-${((indice % 4) + 4) % 4}`;
}
