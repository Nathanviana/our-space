import { dadosInfra } from "@/lib/dados/admin";
import { LIMITE_BANCO, LIMITE_FOTOS, formatarBytes, percentual } from "@/lib/admin/infra";
import { Orfas } from "./orfas";

export const dynamic = "force-dynamic";

function Uso({ titulo, usado, limite, extra }: { titulo: string; usado: number; limite: number; extra?: string }) {
  const p = percentual(usado, limite);
  return (
    <div className="card formulario">
      <h2 style={{ margin: 0, fontSize: 20 }}>{titulo}</h2>
      <div className={`barra-uso ${p >= 80 ? "alerta" : ""}`} role="meter" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={`${titulo}: ${p}% usado`}>
        <span style={{ width: `${p}%` }} />
      </div>
      <p style={{ margin: 0 }}>
        <strong>{formatarBytes(usado)}</strong> de {formatarBytes(limite)} · {p.toLocaleString("pt-BR")}%
      </p>
      {extra && <p className="item-meta" style={{ margin: 0 }}>{extra}</p>}
    </div>
  );
}

// Spec 5.4: uso do banco e do armazenamento contra os limites do plano gratuito
export default async function Infra() {
  const d = await dadosInfra();
  if (d.pendente) {
    return (
      <div className="card formulario">
        <h2 style={{ margin: 0, fontSize: 20 }}>Migração pendente</h2>
        <p style={{ margin: 0 }}>
          Aplique <code>supabase/migrations/20261105000001_area_admin.sql</code> no Supabase para ver estes números.
        </p>
      </div>
    );
  }
  const medio = d.fotosArquivos ? d.fotosBytes / d.fotosArquivos : 0;
  return (
    <section className="secao">
      <Uso titulo="Banco de dados" usado={d.bancoBytes} limite={LIMITE_BANCO} />
      <Uso
        titulo="Fotos"
        usado={d.fotosBytes}
        limite={LIMITE_FOTOS}
        extra={`${d.fotosArquivos} arquivo(s), contando as miniaturas · média de ${formatarBytes(medio)}`}
      />

      <h2>Linhas por tabela</h2>
      <div className="card tabela-rolagem">
        <table className="tabela">
          <tbody>
            {Object.entries(d.tabelas).map(([nome, n]) => (
              <tr key={nome}><td>{nome}</td><td>{n}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Arquivos órfãos</h2>
      <Orfas orfas={d.orfas} />
    </section>
  );
}
