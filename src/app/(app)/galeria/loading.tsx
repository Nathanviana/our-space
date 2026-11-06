// Esqueleto da Galeria: grade de fotos
export default function CarregandoGaleria() {
  return (
    <div className="esqueleto-pagina" aria-busy="true" aria-label="Carregando fotos">
      <span className="esqueleto esqueleto-titulo" />
      <span className="esqueleto esqueleto-sub" />
      <div className="esqueleto-grade">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="esqueleto" style={{ animationDelay: `${(i % 3) * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}
