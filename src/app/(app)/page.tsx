import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { resumoDoEspaco } from "@/lib/dados/resumo";
import { sair } from "../login/actions";
import { Contador } from "./contador";
import { ResumoEspaco } from "./resumo";

// Tela Início (PRD v3 7.2): contador animado do tempo juntos (REQ-13) e resumo do espaço (REQ-14)
export default async function Inicio() {
  const [sessao, resumo] = await Promise.all([exigirSessao(), resumoDoEspaco()]);
  return (
    <>
      <Link href="/admin" className="admin-link">⚙ Admin</Link>
      <Contador dataAmizade={resumo.dataAmizade} dataNamoro={resumo.dataNamoro} nome={sessao.nome.split(" ")[0]} />
      <ResumoEspaco resumo={resumo} />
      <form action={sair} className="sair-form">
        <button className="sair">Sair</button>
      </form>
    </>
  );
}
