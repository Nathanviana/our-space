import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormDatas } from "./form-datas";
import { FormPessoa } from "./form-pessoa";

export const dynamic = "force-dynamic";

// Spec 5.2: as duas contas e as datas do contador
export default async function Pessoas() {
  const sessao = await exigirSessao();
  const [usuarios, espaco] = await Promise.all([
    db().from("usuarios").select("id, nome, email").order("criado_em"),
    db().from("espaco").select("data_amizade, data_namoro").eq("id", 1).maybeSingle(),
  ]);
  if (usuarios.error) throw usuarios.error;
  return (
    <section className="secao">
      {(usuarios.data ?? []).map((u) => (
        <FormPessoa key={u.id} id={u.id} nome={u.nome} email={u.email} souEu={u.id === sessao.sub} />
      ))}
      <FormDatas amizade={espaco.data?.data_amizade ?? ""} namoro={espaco.data?.data_namoro ?? ""} />
    </section>
  );
}
