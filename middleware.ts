import { NextResponse, type NextRequest } from "next/server";
import { authTokenCookieName } from "./src/lib/auth-token";

function isPublicPath(pathname: string) {
    if (pathname === "/") return true;
    if (pathname.startsWith("/auth/")) return true;
    if (pathname === "/auth") return true;
    if (pathname.startsWith("/connectors/callback")) return true;
    if (pathname.startsWith("/_next/")) return true;
    return false;
}

export function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    if (isPublicPath(pathname)) return NextResponse.next();

    const token = req.cookies.get(authTokenCookieName())?.value;
    if (token && token.trim().length > 0) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ["/((?!.*\\..*).*)"],
};

