import { Building2, Globe2, Map as MapaIcone, Trophy } from "lucide-react";
import { Cabecalho, Vazio } from "@/components/ui";
import { bandeira, proximaMeta } from "@/lib/conquistas";
import { conquistasDoCasal } from "@/lib/dados/conquistas";
import { Descobrindo } from "./descobrindo";

export const dynamic = "force-dynamic";

const plural = (n: number, um: string, varios: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;

// Mapa de conquistas: cidades, estados e países que o casal já viveu junto
export default async function Conquistas() {
  const c = await conquistasDoCasal();
  const qtd = c.cidades.length;
  const meta = proximaMeta(qtd);
  const anterior = [0, 1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200].filter((m) => m <= qtd).pop() ?? 0;
  const progresso = meta > anterior ? (qtd - anterior) / (meta - anterior) : 1;

  return (
    <>
      <Cabecalho titulo="Conquistas" subtitulo="Os lugares que vocês já viveram juntos" voltar="/mapa" />
      {c.migracaoPendente && <p className="erro" role="alert">Falta aplicar a migração do mapa de conquistas no banco.</p>}
      <Descobrindo restam={c.migracaoPendente ? 0 : c.semEndereco} />

      <div className="conquistas-numeros">
        <div className="card conquista tom-2">
          <Building2 size={20} aria-hidden />
          <strong>{qtd}</strong>
          <span>{qtd === 1 ? "cidade" : "cidades"}</span>
        </div>
        <div className="card conquista tom-0">
          <MapaIcone size={20} aria-hidden />
          <strong>{c.estados.length}</strong>
          <span>{c.estados.length === 1 ? "estado" : "estados"}</span>
        </div>
        <div className="card conquista tom-3">
          <Globe2 size={20} aria-hidden />
          <strong>{c.paises.length}</strong>
          <span>{c.paises.length === 1 ? "país" : "países"}</span>
        </div>
      </div>

      {qtd === 0 ? (
        <Vazio texto="Marquem o lugar nas memórias (ou usem fotos com localização) para começar a colecionar cidades." />
      ) : (
        <>
          <div className="card meta-conquista">
            <span className="meta-icone" aria-hidden><Trophy size={20} /></span>
            <div className="meta-texto">
              <strong>
                {qtd} {qtd === 1 ? "cidade juntos" : "cidades juntos"}
              </strong>
              <span>Faltam {plural(meta - qtd, "cidade", "cidades")} para a meta de {meta}</span>
              <div className="marco-barra"><span style={{ width: `${Math.max(4, progresso * 100)}%` }} /></div>
            </div>
          </div>

          {c.paises.length > 0 && (
            <section className="secao">
              <h2>Países</h2>
              <div className="chips">
                {c.paises.map((p) => (
                  <span key={p.nome} className="chip selo-lugar">
                    <span aria-hidden>{bandeira(p.codigoPais)}</span> {p.nome} <span className="contagem">{p.cidades}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {c.estados.length > 0 && (
            <section className="secao">
              <h2>Estados</h2>
              <div className="chips">
                {c.estados.map((e) => (
                  <span key={`${e.nome}-${e.codigoPais}`} className="chip selo-lugar">
                    {e.uf && <b>{e.uf}</b>} {e.nome} <span className="contagem">{plural(e.cidades, "cidade", "cidades")}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="secao">
            <h2>Cidades <span className="contagem">{qtd}</span></h2>
            <ol className="lista lista-cidades">
              {c.cidades.map((cid, i) => (
                <li key={`${cid.nome}-${cid.uf}-${cid.codigoPais}`} className="card item">
                  <span className="cidade-posicao" aria-hidden>{i + 1}</span>
                  <span className="item-texto">
                    <span className="item-titulo">
                      {cid.nome}
                      {cid.uf ? `, ${cid.uf}` : ""}
                    </span>
                    <span className="item-meta">{plural(cid.vezes, "momento", "momentos")} aqui</span>
                  </span>
                  <span className="cidade-bandeira" aria-hidden>{bandeira(cid.codigoPais)}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </>
  );
}
