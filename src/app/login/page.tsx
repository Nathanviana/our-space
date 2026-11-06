import { arteDoLogin } from "@/lib/dados/login-arte";
import { ArteLogin } from "./arte";
import { FormLogin } from "./form";

// A arte (coração ou polaroids) é escolhida no admin
export const dynamic = "force-dynamic";

// Tela Login (PRD v3, 7.2; RNF-01): cartão dividido com a arte do casal e o formulário
export default async function Login() {
  const arte = await arteDoLogin();
  return (
    <main className="login">
      <div className="login-moldura">
        <ArteLogin modo={arte.modo} fotos={arte.fotos} />
        <FormLogin />
      </div>
    </main>
  );
}
