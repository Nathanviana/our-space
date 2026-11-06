import { exigirSessao } from "@/lib/auth";
import { configArteAdmin } from "@/lib/dados/login-arte";
import { listarPasskeys } from "@/lib/passkey";
import { FormArteLogin } from "./form-arte";
import { Passkeys } from "./passkeys";

export const dynamic = "force-dynamic";

// Tela de login: a arte (coração ou polaroids) e as passkeys (Face ID / digital)
export default async function AdminLogin() {
  const sessao = await exigirSessao();
  const [arte, passkeys] = await Promise.all([configArteAdmin(), listarPasskeys(sessao.sub)]);
  return (
    <>
      <FormArteLogin {...arte} />
      <Passkeys lista={passkeys.lista} pendente={passkeys.pendente} />
    </>
  );
}
