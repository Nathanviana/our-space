import { dadosMetricas } from "@/lib/dados/admin";

export const dynamic = "force-dynamic";

const NOME_MES = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
function rotuloMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return NOME_MES.format(new Date(a, m - 1, 1));
}

function Numero({ valor, rotulo }: { valor: number | string; rotulo: string }) {
  return (
    <div className="card numero">
      <strong>{valor}</strong>
      <span>{rotulo}</span>
    </div>
  );
}

// Spec 5.1: totais, indicadores do PRD por mês, por pessoa e por tema
export default async function Metricas() {
  const m = await dadosMetricas();
  const r = m.resumo;
  return (
    <>
      <section className="secao" aria-label="Totais">
        <div className="numeros">
          <Numero valor={r.vamosFazer} rotulo="vamos fazer" />
          <Numero valor={r.jaFizemos} rotulo="já fizemos" />
          <Numero valor={r.memorias} rotulo="memórias" />
          <Numero valor={r.fotos} rotulo="fotos" />
          <Numero valor={r.lugares} rotulo="lugares" />
          <Numero valor={m.temas} rotulo="temas" />
          <Numero valor={m.sorteios} rotulo="sorteios" />
          <Numero valor={m.geralComMemoria === null ? "—" : `${m.geralComMemoria}%`} rotulo="feitos com memória" />
        </div>
      </section>

      <section className="secao">
        <h2>Mês a mês</h2>
        <div className="card tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Feitos</th>
                <th>Sorteados</th>
                <th>Sorteio virou programa</th>
                <th>Com memória</th>
              </tr>
            </thead>
            <tbody>
              {m.meses.map((l) => (
                <tr key={l.mes}>
                  <td>{rotuloMes(l.mes)}</td>
                  <td>{l.feitos}</td>
                  <td>{l.sorteados}</td>
                  <td>{l.sorteadosFeitos}</td>
                  <td>{l.feitos ? `${Math.round((l.comMemoria / l.feitos) * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="secao">
        <h2>Por pessoa</h2>
        <div className="card tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Quem</th><th>Planos</th><th>Memórias</th><th>Fotos</th></tr>
            </thead>
            <tbody>
              {m.porPessoa.map((p) => (
                <tr key={p.nome}><td>{p.nome}</td><td>{p.planos}</td><td>{p.memorias}</td><td>{p.fotos}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="secao">
        <h2>Por tema</h2>
        <div className="card tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Tema</th><th>Vamos fazer</th><th>Já fizemos</th></tr>
            </thead>
            <tbody>
              {m.porTema.map((t) => (
                <tr key={t.nome}><td>{t.icone} {t.nome}</td><td>{t.vamosFazer}</td><td>{t.jaFizemos}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
