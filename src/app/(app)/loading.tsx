// Esqueleto genérico enquanto a tela carrega (o menu continua visível)
export default function Carregando() {
  return (
    <div className="esqueleto-pagina" aria-busy="true" aria-label="Carregando">
      <span className="esqueleto esqueleto-titulo" />
      <span className="esqueleto esqueleto-sub" />
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="esqueleto esqueleto-item" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}
