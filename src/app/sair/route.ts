// Sessão revogada (troca de senha na área de admin): apaga o cookie e manda para o login.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO } from "@/lib/sessao";

export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(COOKIE_SESSAO);
  return res;
}
