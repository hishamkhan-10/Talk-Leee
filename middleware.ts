import { NextResponse, type NextRequest } from "next/server";
import { authTokenCookieName } from "./src/lib/auth-token";

function devBypassAuth() {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.TALKLEE_REQUIRE_AUTH !== "1";
}

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

    const token = req.cookies.get(authTokenCookieName())?.value;
    if (token && token.trim().length > 0) return NextResponse.next();

    if (devBypassAuth()) {
        const res = NextResponse.next();
        res.cookies.set({
            name: authTokenCookieName(),
            value: "dev-token",
            path: "/",
            sameSite: "lax",
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 24 * 7,
        });
        return res;
    }

    if (isPublicPath(pathname)) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ["/((?!.*\\..*).*)"],
};
