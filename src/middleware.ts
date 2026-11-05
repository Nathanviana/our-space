// Protege todas as rotas: sem JWT válido, vai para o login (RNF-01).
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, verificarSessao } from "@/lib/sessao";

export async function middleware(req: NextRequest) {
  const sessao = await verificarSessao(req.cookies.get(COOKIE_SESSAO)?.value);
  const naLogin = req.nextUrl.pathname === "/login";

  if (!sessao && !naLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const res = NextResponse.redirect(url);
    if (req.cookies.get(COOKIE_SESSAO)) res.cookies.delete(COOKIE_SESSAO);
    return res;
  }
  if (sessao && naLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
