import { ArteLogin } from "./arte";
import { FormLogin } from "./form";

// Tela Login (PRD v3, 7.2; RNF-01): cartão dividido com a arte do casal e o formulário
export default function Login() {
  return (
    <main className="login">
      <div className="login-moldura">
        <ArteLogin />
        <FormLogin />
      </div>
    </main>
  );
}
