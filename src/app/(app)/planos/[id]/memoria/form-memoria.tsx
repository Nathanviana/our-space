"use client";

import { MapPin } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EscolherLugar } from "@/components/escolher-lugar";
import { prepararFoto, type FotoPreparada } from "@/lib/imagem";
import type { Lugar } from "@/lib/types";
import { enviarFoto, excluirFoto, excluirMemoria, salvarMemoria } from "../../../memorias/actions";

interface FotoExistente {
  id: string;
  urlMini: string;
}

interface Inicial {
  memoriaId: string | null;
  frase: string;
  musica: string;
  data: string;
  lugar: Lugar;
  fotos: FotoExistente[];
}

// Registro da memória (REQ-05 a REQ-09): tudo opcional, rápido de preencher
export function FormMemoria({ planoId, temaId, inicial }: { planoId: string; temaId: string; inicial: Inicial }) {
  const router = useRouter();
  const [frase, setFrase] = useState(inicial.frase);
  const [musica, setMusica] = useState(inicial.musica);
  const [data, setData] = useState(inicial.data);
  const [lugar, setLugar] = useState<Lugar>(inicial.lugar);
  const [existentes, setExistentes] = useState(inicial.fotos);
  const [novas, setNovas] = useState<FotoPreparada[]>([]);
  const [preparando, setPreparando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Primeira foto com localização vira sugestão de lugar (DC3)
  const fotoComLugar = novas.find((f) => f.latitude !== null && f.longitude !== null);
  const sugestao = fotoComLugar ? { latitude: fotoComLugar.latitude!, longitude: fotoComLugar.longitude! } : null;

  async function escolherFotos(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    setPreparando(true);
    setErro(null);
    const prontas: FotoPreparada[] = [];
    for (const a of Array.from(arquivos)) {
      try {
        prontas.push(await prepararFoto(a));
      } catch (e) {
        setErro((e as Error).message);
      }
    }
    setNovas((n) => [...n, ...prontas]);
    setPreparando(false);
  }

  async function removerExistente(id: string) {
    if (!confirm("Excluir esta foto de vez?")) return;
    const r = await excluirFoto(id);
    if (r.erro) return setErro(r.erro);
    setExistentes((f) => f.filter((x) => x.id !== id));
  }

  async function guardar() {
    setErro(null);
    setProgresso("Guardando a memória...");
    const r = await salvarMemoria({
      planoId,
      frase,
      musica,
      data,
      lugarNome: lugar.nome ?? "",
      latitude: lugar.latitude,
      longitude: lugar.longitude,
    });
    if (r.erro || !r.id) {
      setProgresso(null);
      return setErro(r.erro ?? "Erro ao guardar.");
    }
    for (let i = 0; i < novas.length; i++) {
      setProgresso(`Enviando foto ${i + 1} de ${novas.length}...`);
      const f = novas[i];
      const form = new FormData();
      form.set("memoriaId", r.id);
      form.set("foto", f.foto, "foto.jpg");
      form.set("mini", f.mini, "mini.jpg");
      if (f.latitude !== null && f.longitude !== null) {
        form.set("latitude", String(f.latitude));
        form.set("longitude", String(f.longitude));
      }
      if (f.tiradaEm) form.set("tiradaEm", f.tiradaEm);
      const envio = await enviarFoto(form);
      if (envio.erro) {
        setProgresso(null);
        setNovas(novas.slice(i));
        return setErro(`${envio.erro} As fotos anteriores foram guardadas; tente de novo.`);
      }
    }
    router.push(`/memorias/${r.id}`);
    router.refresh();
  }

  async function apagarMemoria() {
    if (!inicial.memoriaId || !confirm("Excluir esta memória e as fotos de vez? O plano continua em “já fizemos”.")) return;
    await excluirMemoria(inicial.memoriaId);
    router.push(`/temas/${temaId}`);
    router.refresh();
  }

  const ocupado = preparando || progresso !== null;

  return (
    <div className="formulario-memoria">
      <section className="card formulario">
        <span className="rotulo-secao">Fotos</span>
        <div className="grade-fotos">
          {existentes.map((f) => (
            <div key={f.id} className="miniatura">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.urlMini} alt="" />
              <button type="button" aria-label="Excluir foto" onClick={() => removerExistente(f.id)} disabled={ocupado}>×</button>
            </div>
          ))}
          {novas.map((f, i) => (
            <div key={f.previa} className="miniatura nova">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.previa} alt="" />
              {f.latitude !== null && <span className="selo" title="Foto com localização"><MapPin size={14} /></span>}
              <button type="button" aria-label="Tirar foto" onClick={() => setNovas((n) => n.filter((_, j) => j !== i))} disabled={ocupado}>×</button>
            </div>
          ))}
          <label className="miniatura adicionar-foto">
            <input type="file" accept="image/*" multiple onChange={(e) => escolherFotos(e.target.files)} disabled={ocupado} />
            <span>{preparando ? "..." : "+"}</span>
          </label>
        </div>
      </section>

      <section className="card formulario">
        <label>
          Uma frase
          <textarea value={frase} onChange={(e) => setFrase(e.target.value)} rows={3} maxLength={280} placeholder="O que vocês querem lembrar" />
        </label>
        <label>
          Música (link)
          <input value={musica} onChange={(e) => setMusica(e.target.value)} type="url" inputMode="url" placeholder="Spotify, YouTube..." />
        </label>
        <label>
          Quando
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      </section>

      <section className="card formulario">
        <span className="rotulo-secao">Lugar</span>
        <EscolherLugar valor={lugar} aoMudar={setLugar} sugestao={sugestao} />
      </section>

      {erro && <p role="alert" className="erro">{erro}</p>}
      <button type="button" className="botao" onClick={guardar} disabled={ocupado}>
        {progresso ?? "Guardar memória"}
      </button>
      {inicial.memoriaId ? (
        <button type="button" className="botao secundario perigo" onClick={apagarMemoria} disabled={ocupado}>Excluir memória</button>
      ) : (
        <Link href={`/temas/${temaId}`} className="botao fantasma">Pular por agora</Link>
      )}
    </div>
  );
}
