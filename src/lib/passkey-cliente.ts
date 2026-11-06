// Passkeys no navegador: cadastrar este aparelho e entrar com Face ID / digital.
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { concluirCadastroPasskey, opcoesCadastroPasskey } from "@/app/(app)/admin/login/actions";
import { entrarComPasskey, opcoesEntradaPasskey } from "@/app/login/actions";

// Lembra neste aparelho se a passkey já foi criada ou se o convite foi dispensado
export const CHAVE_LOCAL = "ne_passkey";
export type Marca = "cadastrada" | "dispensada";

export function lerMarca(): Marca | null {
  try {
    const v = localStorage.getItem(CHAVE_LOCAL);
    return v === "cadastrada" || v === "dispensada" ? v : null;
  } catch {
    return null;
  }
}

export function marcar(v: Marca) {
  try {
    localStorage.setItem(CHAVE_LOCAL, v);
  } catch {
    /* navegação privada: sem memória, tudo bem */
  }
}

// Usuário cancelou ou outra cerimônia tomou o lugar: não é erro para mostrar
function cancelado(e: unknown) {
  const err = e as { name?: string; code?: string };
  return err?.name === "NotAllowedError" || err?.name === "AbortError" || err?.code === "ERROR_CEREMONY_ABORTED";
}

export interface Resultado {
  ok?: true;
  aparelho?: string;
  erro?: string;
  cancelado?: true;
}

export async function cadastrarEsteAparelho(): Promise<Resultado> {
  const inicio = await opcoesCadastroPasskey();
  if (!inicio.opcoes) return { erro: inicio.erro };
  let resposta;
  try {
    resposta = await startRegistration({ optionsJSON: inicio.opcoes });
  } catch (e) {
    if ((e as { code?: string }).code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
      marcar("cadastrada");
      return { erro: "Este aparelho já está cadastrado." };
    }
    return cancelado(e) ? { cancelado: true } : { erro: "Este aparelho não conseguiu criar a passkey." };
  }
  const fim = await concluirCadastroPasskey(resposta);
  if (fim.ok) marcar("cadastrada");
  return fim;
}

// autofill: a passkey aparece como sugestão ao tocar no campo de e-mail
// continuar: no autofill, desiste se o botão já começou outra entrada enquanto as opções chegavam
export async function entrarComFaceId(autofill = false, continuar: () => boolean = () => true): Promise<Resultado> {
  const inicio = await opcoesEntradaPasskey();
  if (!inicio.opcoes) return { erro: inicio.erro };
  if (!continuar()) return { cancelado: true };
  let resposta;
  try {
    resposta = await startAuthentication({ optionsJSON: inicio.opcoes, useBrowserAutofill: autofill });
  } catch (e) {
    return cancelado(e) ? { cancelado: true } : { erro: "Não foi possível usar o Face ID ou a digital." };
  }
  const fim = await entrarComPasskey(resposta);
  if (fim.ok) marcar("cadastrada");
  return fim;
}
