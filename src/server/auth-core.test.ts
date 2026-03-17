import { test } from "node:test";
import assert from "node:assert/strict";
import { authTokenFromRequest, buildSessionCookie, clearSessionCookie, hashPassword, validatePasswordStrength, verifyPassword } from "@/server/auth-core";

test("password strength validator rejects weak passwords", () => {
    const r = validatePasswordStrength("password");
    assert.equal(r.ok, false);
    assert.ok(r.failures.length > 0);
});

test("argon2 hashes and verifies passwords", async () => {
    const hash = await hashPassword("Str0ng!Password-For-Tests");
    assert.ok(typeof hash === "string" && hash.length > 20);
    assert.equal(await verifyPassword(hash, "Str0ng!Password-For-Tests"), true);
    assert.equal(await verifyPassword(hash, "wrong-password"), false);
});

test("auth token is extracted from Authorization header", () => {
    const req = new Request("http://example.test/auth/me", { headers: { authorization: "Bearer token-123" } });
    assert.equal(authTokenFromRequest(req), "token-123");
});

test("auth token is extracted from cookie header", () => {
    const req = new Request("http://example.test/auth/me", { headers: { cookie: "a=b; talklee_auth_token=abc123; c=d" } });
    assert.equal(authTokenFromRequest(req), "abc123");
});

test("session cookies are httpOnly and sameSite", () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const set = buildSessionCookie({ sessionId: "sid", expiresAt, secure: true });
    assert.ok(/talklee_auth_token=/.test(set));
    assert.ok(/HttpOnly/i.test(set));
    assert.ok(/SameSite=Lax/i.test(set));
    assert.ok(/Secure/i.test(set));

    const cleared = clearSessionCookie({ secure: true });
    assert.ok(/Max-Age=0/.test(cleared));
    assert.ok(/HttpOnly/i.test(cleared));
});

