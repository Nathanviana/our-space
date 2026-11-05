import Link from "next/link";
import { itensLote, type TipoLote } from "@/lib/dados/admin";
import { listarTemas } from "@/lib/dados/temas";
import { ListaLote } from "./lista-lote";

export const dynamic = "force-dynamic";

const TIPOS: { valor: TipoLote; rotulo: string }[] = [
  { valor: "planos", rotulo: "Planos" },
  { valor: "memorias", rotulo: "Memórias" },
  { valor: "fotos", rotulo: "Fotos" },
  { valor: "temas", rotulo: "Temas" },
];

type Params = Promise<Record<string, string | string[] | undefined>>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// Spec 5.3: selecionar vários itens e aplicar uma ação de uma vez
export default async function Lote({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const tipo = (TIPOS.find((t) => t.valor === um(sp.tipo))?.valor ?? "planos") as TipoLote;
  const filtros = { tema: um(sp.tema), situacao: um(sp.situacao), q: um(sp.q), mes: um(sp.mes) };
  const [itens, temas] = await Promise.all([itensLote(tipo, filtros), listarTemas()]);

  return (
    <section className="secao">
      <nav className="chips" aria-label="O que listar">
        {TIPOS.map((t) => (
          <Link
            key={t.valor}
            href={`/admin/lote?tipo=${t.valor}`}
            className={`chip ${t.valor === tipo ? "aba ativo" : ""}`}
            aria-current={t.valor === tipo ? "page" : undefined}
            style={{ textDecoration: "none", flex: "none" }}
          >
            {t.rotulo}
          </Link>
        ))}
      </nav>

      {tipo === "planos" && (
        <form className="card formulario" method="get">
          <input type="hidden" name="tipo" value="planos" />
          <label>
            Buscar
            <input name="q" defaultValue={filtros.q} placeholder="Título ou link" />
          </label>
          <label>
            Tema
            <select name="tema" defaultValue={filtros.tema}>
              <option value="">Todos</option>
              {temas.map((t) => (
                <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Situação
            <select name="situacao" defaultValue={filtros.situacao}>
              <option value="">Todas</option>
              <option value="vamos_fazer">Vamos fazer</option>
              <option value="ja_fizemos">Já fizemos</option>
            </select>
          </label>
          <button className="botao secundario">Filtrar</button>
        </form>
      )}

      {tipo === "fotos" && (
        <form className="card formulario" method="get">
          <input type="hidden" name="tipo" value="fotos" />
          <label>
            Mês em que foram enviadas
            <input type="month" name="mes" defaultValue={filtros.mes} />
          </label>
          <button className="botao secundario">Filtrar</button>
        </form>
      )}

      <ListaLote key={`${tipo}|${JSON.stringify(filtros)}`} tipo={tipo} itens={itens} temas={temas} />
    </section>
  );
}
