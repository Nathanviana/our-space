import Link from "next/link";
import { Compass } from "lucide-react";

// Endereço que não existe (ou plano/memória apagado)
export default function NaoEncontrado() {
  return (
    <main className="conteudo">
      <div className="tela-aviso">
        <div className="card">
          <span className="tela-aviso-icone" aria-hidden><Compass size={26} /></span>
          <h1>Esse cantinho não existe</h1>
          <p>Talvez tenha sido apagado, ou o link veio errado.</p>
          <div className="acoes">
            <Link href="/" className="botao">Voltar para o início</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
