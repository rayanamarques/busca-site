import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name, value }) => name.startsWith("sb-") && name.includes("auth-token") && value);
}

export function middleware(request: NextRequest) {
  const hasAuthCookie = hasSupabaseAuthCookie(request);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!hasAuthCookie && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasAuthCookie && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, exceto:
     * - _next (assets internos), favicon, imagens
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
