"use client";

export function BotaoExcluir({ id, acao, texto = "Excluir" }: { id: string; acao: (f: FormData) => Promise<void>; texto?: string }) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm("Excluir de vez? A memória e as fotos ligadas também serão apagadas.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="botao secundario perigo largura">{texto}</button>
    </form>
  );
}
