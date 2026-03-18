import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import crypto from "node:crypto";
import { getSql, isDatabaseConfigured } from "@/server/db";

export type AuthUserStatus = "active" | "suspended" | "disabled";
export type AuthRole = "user" | "admin" | "partner_admin" | "white_label_admin";

export type AuthMe = {
    id: string;
    email: string;
    name?: string;
    business_name?: string;
    role: AuthRole;
    minutes_remaining?: number;
    partner_id?: string;
};

type DbUserRow = {
    id: string;
    email: string;
    username: string | null;
    password_hash: string;
    status: AuthUserStatus;
    role: AuthRole;
    name: string | null;
    business_name: string | null;
};

type DbSessionRow = {
    session_id: string;
    user_id: string;
    expires_at: Date;
    ip_address: string | null;
    user_agent: string | null;
    revoked_at: Date | null;
};

type DbUserMfaRow = {
    user_id: string;
    secret_encrypted: string;
    is_enabled: boolean;
};

let authSchemaReady: Promise<void> | undefined;

function nowMs() {
    return Date.now();
}

function parsePositiveInt(input: unknown, fallback: number) {
    const n = typeof input === "string" ? Number(input) : typeof input === "number" ? input : NaN;
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
}

function cookieName() {
    return "talklee_auth_token";
}

function readCookie(header: string, name: string) {
    const parts = header.split(";").map((p) => p.trim());
    for (const part of parts) {
        if (!part) continue;
        const eq = part.indexOf("=");
        if (eq <= 0) continue;
        const k = part.slice(0, eq).trim();
        if (k !== name) continue;
        const v = part.slice(eq + 1).trim();
        try {
            return decodeURIComponent(v);
        } catch {
            return v;
        }
    }
    return null;
}

export function authTokenFromRequest(request: Request) {
    const auth = request.headers.get("authorization") ?? "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return (m[1] ?? "").trim();
    const cookie = request.headers.get("cookie") ?? "";
    const token = readCookie(cookie, cookieName());
    return (token ?? "").trim();
}

export function clientIpFromRequest(request: Request) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    const cf = request.headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
    return "";
}

export function userAgentFromRequest(request: Request) {
    return (request.headers.get("user-agent") ?? "").trim();
}

export function normalizeEmail(input: string) {
    return input.trim().toLowerCase();
}

export function normalizeUsername(input: string) {
    const u = input.trim().toLowerCase();
    if (!u) return "";
    return u.replace(/[^a-z0-9._-]/g, "");
}

export function validatePasswordStrength(password: string) {
    const p = password ?? "";
    const failures: string[] = [];
    if (p.length < 12) failures.push("Password must be at least 12 characters");
    if (p.length > 128) failures.push("Password must be at most 128 characters");
    if (!/[a-z]/.test(p)) failures.push("Password must include a lowercase letter");
    if (!/[A-Z]/.test(p)) failures.push("Password must include an uppercase letter");
    if (!/[0-9]/.test(p)) failures.push("Password must include a number");
    if (!/[^A-Za-z0-9]/.test(p)) failures.push("Password must include a symbol");
    if (/\s/.test(p)) failures.push("Password must not include whitespace");
    return { ok: failures.length === 0, failures };
}

export async function hashPassword(password: string) {
    return argon2Hash(password, {
        memoryCost: parsePositiveInt(process.env.AUTH_ARGON2_MEMORY_KIB, 19_456),
        timeCost: parsePositiveInt(process.env.AUTH_ARGON2_TIME_COST, 3),
        parallelism: parsePositiveInt(process.env.AUTH_ARGON2_PARALLELISM, 1),
        outputLen: parsePositiveInt(process.env.AUTH_ARGON2_OUTPUT_LEN, 32),
    });
}

export async function verifyPassword(passwordHash: string, password: string) {
    return argon2Verify(passwordHash, password);
}

let dummyHashPromise: Promise<string> | undefined;

async function dummyHash() {
    if (!dummyHashPromise) {
        dummyHashPromise = hashPassword(`invalid-${crypto.randomUUID()}-${crypto.randomUUID()}`);
    }
    return dummyHashPromise;
}

export function randomSessionId() {
    return crypto.randomBytes(32).toString("base64url");
}

function sessionTtlSeconds() {
    return parsePositiveInt(process.env.AUTH_SESSION_TTL_SECONDS, 60 * 60 * 24 * 7);
}

export async function ensureAuthSchema() {
    if (authSchemaReady) return authSchemaReady;
    authSchemaReady = (async () => {
        const sql = getSql();
        await sql.unsafe(`
            create table if not exists users (
                id uuid primary key,
                email text not null,
                username text,
                password_hash text not null,
                status text not null check (status in ('active','suspended','disabled')),
                role text not null default 'user',
                name text,
                business_name text,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            )
        `);
        await sql.unsafe(`create unique index if not exists users_email_unique on users (email)`);
        await sql.unsafe(`create unique index if not exists users_username_unique on users (username) where username is not null`);
        await sql.unsafe(`create index if not exists users_status_idx on users (status)`);

        await sql.unsafe(`
            create table if not exists sessions (
                session_id text primary key,
                user_id uuid not null references users(id) on delete cascade,
                created_at timestamptz not null default now(),
                expires_at timestamptz not null,
                ip_address text,
                user_agent text,
                revoked_at timestamptz,
                rotated_from text,
                replaced_by text
            )
        `);
        await sql.unsafe(`create index if not exists sessions_user_id_idx on sessions (user_id)`);
        await sql.unsafe(`create index if not exists sessions_expires_at_idx on sessions (expires_at)`);
        await sql.unsafe(`create index if not exists sessions_revoked_at_idx on sessions (revoked_at)`);

        await sql.unsafe(`
            create table if not exists auth_user_security (
                user_id uuid primary key references users(id) on delete cascade,
                failed_attempt_count int not null default 0,
                last_failed_attempt timestamptz,
                locked_until timestamptz,
                updated_at timestamptz not null default now()
            )
        `);

        await sql.unsafe(`
            create table if not exists auth_rate_limits (
                bucket text not null,
                window_start timestamptz not null,
                count int not null default 0,
                updated_at timestamptz not null default now(),
                primary key (bucket, window_start)
            )
        `);
        await sql.unsafe(`create index if not exists auth_rate_limits_window_idx on auth_rate_limits (window_start)`);

        await sql.unsafe(`
            create table if not exists user_mfa (
                user_id uuid primary key references users(id) on delete cascade,
                secret_encrypted text not null,
                is_enabled boolean not null default false,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            )
        `);
        await sql.unsafe(`create index if not exists user_mfa_enabled_idx on user_mfa (is_enabled)`);

        await sql.unsafe(`
            create table if not exists recovery_codes (
                id uuid primary key,
                user_id uuid not null references users(id) on delete cascade,
                code_hash text not null,
                used boolean not null default false,
                created_at timestamptz not null default now()
            )
        `);
        await sql.unsafe(`create index if not exists recovery_codes_user_id_idx on recovery_codes (user_id)`);
        await sql.unsafe(`create index if not exists recovery_codes_used_idx on recovery_codes (used)`);

        await sql.unsafe(`
            create table if not exists user_passkeys (
                id uuid primary key,
                user_id uuid not null references users(id) on delete cascade,
                credential_id text not null,
                public_key bytea not null,
                sign_count bigint not null default 0,
                device_name text,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            )
        `);
        await sql.unsafe(`create unique index if not exists user_passkeys_credential_id_unique on user_passkeys (credential_id)`);
        await sql.unsafe(`create index if not exists user_passkeys_user_id_idx on user_passkeys (user_id)`);

        await sql.unsafe(`
            create table if not exists auth_webauthn_challenges (
                challenge text primary key,
                kind text not null check (kind in ('registration','authentication')),
                user_id uuid references users(id) on delete cascade,
                identifier text,
                ip_address text,
                user_agent text,
                expires_at timestamptz not null,
                created_at timestamptz not null default now()
            )
        `);
        await sql.unsafe(`create index if not exists auth_webauthn_challenges_expires_at_idx on auth_webauthn_challenges (expires_at)`);
    })();
    return authSchemaReady;
}

export async function consumeAuthRateLimit(input: { bucket: string; limit: number; windowSeconds: number }) {
    const sql = getSql();
    const now = new Date();
    const windowMs = input.windowSeconds * 1000;
    const start = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

    const rows = await sql<{ count: number }[]>`
        insert into auth_rate_limits (bucket, window_start, count, updated_at)
        values (${input.bucket}, ${start}, 1, now())
        on conflict (bucket, window_start)
        do update set count = auth_rate_limits.count + 1, updated_at = now()
        returning count
    `;
    const count = rows[0]?.count ?? 1;
    const remainingMs = windowMs - (now.getTime() - start.getTime());
    const retryAfterSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    return { allowed: count <= input.limit, count, retryAfterSeconds };
}

async function findUserByIdentifier(identifier: string): Promise<DbUserRow | null> {
    const sql = getSql();
    const trimmed = identifier.trim();
    if (!trimmed) return null;
    if (trimmed.includes("@")) {
        const email = normalizeEmail(trimmed);
        const rows = await sql<DbUserRow[]>`
            select id, email, username, password_hash, status, role, name, business_name
            from users
            where email = ${email}
            limit 1
        `;
        return rows[0] ?? null;
    }
    const username = normalizeUsername(trimmed);
    if (!username) return null;
    const rows = await sql<DbUserRow[]>`
        select id, email, username, password_hash, status, role, name, business_name
        from users
        where username = ${username}
        limit 1
    `;
    return rows[0] ?? null;
}

async function getUserSecurity(userId: string) {
    const sql = getSql();
    const rows = await sql<{ failed_attempt_count: number; locked_until: Date | null }[]>`
        select failed_attempt_count, locked_until
        from auth_user_security
        where user_id = ${userId}::uuid
        limit 1
    `;
    return rows[0] ?? { failed_attempt_count: 0, locked_until: null };
}

async function recordFailedLoginAttempt(userId: string) {
    const sql = getSql();
    const lockThreshold = parsePositiveInt(process.env.AUTH_LOCK_THRESHOLD, 10);
    const lockSeconds = parsePositiveInt(process.env.AUTH_LOCK_SECONDS, 15 * 60);

    const rows = await sql<{ failed_attempt_count: number; locked_until: Date | null }[]>`
        insert into auth_user_security (user_id, failed_attempt_count, last_failed_attempt, locked_until, updated_at)
        values (${userId}::uuid, 1, now(), null, now())
        on conflict (user_id)
        do update set
            failed_attempt_count = auth_user_security.failed_attempt_count + 1,
            last_failed_attempt = now(),
            updated_at = now()
        returning failed_attempt_count, locked_until
    `;

    const count = rows[0]?.failed_attempt_count ?? 1;
    if (count < lockThreshold) return;

    await sql`
        update auth_user_security
        set locked_until = now() + make_interval(secs => ${lockSeconds}), updated_at = now()
        where user_id = ${userId}::uuid
    `;
}

async function clearFailedLoginState(userId: string) {
    const sql = getSql();
    await sql`
        insert into auth_user_security (user_id, failed_attempt_count, last_failed_attempt, locked_until, updated_at)
        values (${userId}::uuid, 0, null, null, now())
        on conflict (user_id)
        do update set failed_attempt_count = 0, last_failed_attempt = null, locked_until = null, updated_at = now()
    `;
}

function devMeForToken(token: string): AuthMe | null {
    const t = token.trim();
    if (!t) return null;
    if (t === "wl-admin-token") return { id: "usr_wl_admin", email: "wl-admin@example.com", role: "white_label_admin" };
    const partner = t.match(/^partner-([a-z0-9-]+)-token$/i);
    if (partner) {
        const partnerId = (partner[1] ?? "").trim().toLowerCase();
        if (partnerId) return { id: `usr_partner_${partnerId}`, email: `partner-${partnerId}@example.com`, role: "partner_admin", partner_id: partnerId };
    }
    if (t === "e2e-token") return { id: "usr_e2e", email: "e2e@example.com", role: "user" };
    if (t === "dev-token") return { id: "usr_dev", email: "dev@example.com", role: "user" };
    return null;
}

export async function authMeFromRequest(request: Request): Promise<AuthMe | null> {
    const token = authTokenFromRequest(request);
    if (!token) return null;

    const devEnabled = process.env.NODE_ENV !== "production" && process.env.TALKLEE_DEV_AUTH_TOKENS !== "0";
    if (devEnabled) {
        const dev = devMeForToken(token);
        if (dev) return dev;
    }

    if (!isDatabaseConfigured()) return null;
    await ensureAuthSchema();

    const sql = getSql();
    const rows = await sql<
        Array<DbUserRow & DbSessionRow>
    >`
        select
            s.session_id,
            s.user_id,
            s.expires_at,
            s.ip_address,
            s.user_agent,
            s.revoked_at,
            u.id,
            u.email,
            u.username,
            u.password_hash,
            u.status,
            u.role,
            u.name,
            u.business_name
        from sessions s
        join users u on u.id = s.user_id
        where s.session_id = ${token}
        limit 1
    `;

    const row = rows[0];
    if (!row) return null;
    if (row.revoked_at) return null;
    if (row.expires_at.getTime() <= nowMs()) return null;
    if (row.status !== "active") return null;

    const ip = clientIpFromRequest(request);
    const ua = userAgentFromRequest(request);
    const storedIp = (row.ip_address ?? "").trim();
    const storedUa = (row.user_agent ?? "").trim();
    if (storedIp && storedUa && ip && ua) {
        if (storedIp !== ip && storedUa !== ua) return null;
    }

    return {
        id: row.id,
        email: row.email,
        name: row.name ?? undefined,
        business_name: row.business_name ?? undefined,
        role: row.role ?? "user",
        minutes_remaining: 0,
    };
}

export async function registerUser(input: { email: string; password: string; username?: string; name?: string; businessName?: string }) {
    await ensureAuthSchema();
    const sql = getSql();

    const email = normalizeEmail(input.email);
    const username = input.username ? normalizeUsername(input.username) : "";
    const passCheck = validatePasswordStrength(input.password);
    if (!passCheck.ok) {
        return { ok: false as const, code: "weak_password" as const, failures: passCheck.failures };
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);
    try {
        const rows = await sql<DbUserRow[]>`
            insert into users (id, email, username, password_hash, status, role, name, business_name, created_at, updated_at)
            values (
                ${id}::uuid,
                ${email},
                ${username.length ? username : null},
                ${passwordHash},
                'active',
                'user',
                ${input.name?.trim() ? input.name.trim() : null},
                ${input.businessName?.trim() ? input.businessName.trim() : null},
                now(),
                now()
            )
            returning id, email, username, password_hash, status, role, name, business_name
        `;
        const u = rows[0]!;
        return { ok: true as const, user: { id: u.id, email: u.email, username: u.username, status: u.status, role: u.role } };
    } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (/users_email_unique/i.test(message) || /unique/i.test(message)) {
            return { ok: false as const, code: "conflict" as const };
        }
        throw err;
    }
}

export async function loginWithPassword(input: { identifier: string; password: string; ipAddress: string; userAgent: string }) {
    if (!isDatabaseConfigured()) {
        return { ok: false as const, code: "db_unavailable" as const };
    }
    await ensureAuthSchema();

    const ipBucketLimit = parsePositiveInt(process.env.AUTH_LOGIN_LIMIT_PER_IP_PER_MINUTE, 10);
    const userBucketLimit = parsePositiveInt(process.env.AUTH_LOGIN_LIMIT_PER_IDENTIFIER_PER_MINUTE, 10);

    const ipBucket = `login:ip:${input.ipAddress || "unknown"}`;
    const idBucket = `login:id:${input.identifier.trim().toLowerCase() || "unknown"}`;

    const [ipLimit, idLimit] = await Promise.all([
        consumeAuthRateLimit({ bucket: ipBucket, limit: ipBucketLimit, windowSeconds: 60 }),
        consumeAuthRateLimit({ bucket: idBucket, limit: userBucketLimit, windowSeconds: 60 }),
    ]);

    if (!ipLimit.allowed || !idLimit.allowed) {
        const retryAfterSeconds = Math.max(ipLimit.retryAfterSeconds, idLimit.retryAfterSeconds);
        return { ok: false as const, code: "rate_limited" as const, retryAfterSeconds };
    }

    const user = await findUserByIdentifier(input.identifier);
    const lockedUntil = user ? (await getUserSecurity(user.id)).locked_until : null;
    if (lockedUntil && lockedUntil.getTime() > nowMs()) {
        await verifyPassword(await dummyHash(), input.password).catch(() => false);
        return { ok: false as const, code: "invalid_credentials" as const };
    }

    const passwordHash = user?.password_hash ?? (await dummyHash());
    const valid = await verifyPassword(passwordHash, input.password).catch(() => false);

    if (!user || !valid || user.status !== "active") {
        if (user) await recordFailedLoginAttempt(user.id);
        return { ok: false as const, code: "invalid_credentials" as const };
    }

    await clearFailedLoginState(user.id);

    const session = await createSessionForUser({
        userId: user.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        mfaVerified: false,
    });
    if (!session.ok) return session;
    return { ok: true as const, session: session.session, user: { id: user.id, email: user.email, role: user.role } };
}

export async function verifyPasswordLoginAttempt(input: { identifier: string; password: string; ipAddress: string; userAgent: string }) {
    if (!isDatabaseConfigured()) {
        return { ok: false as const, code: "db_unavailable" as const };
    }
    await ensureAuthSchema();

    const ipBucketLimit = parsePositiveInt(process.env.AUTH_LOGIN_LIMIT_PER_IP_PER_MINUTE, 10);
    const userBucketLimit = parsePositiveInt(process.env.AUTH_LOGIN_LIMIT_PER_IDENTIFIER_PER_MINUTE, 10);

    const ipBucket = `login:ip:${input.ipAddress || "unknown"}`;
    const idBucket = `login:id:${input.identifier.trim().toLowerCase() || "unknown"}`;

    const [ipLimit, idLimit] = await Promise.all([
        consumeAuthRateLimit({ bucket: ipBucket, limit: ipBucketLimit, windowSeconds: 60 }),
        consumeAuthRateLimit({ bucket: idBucket, limit: userBucketLimit, windowSeconds: 60 }),
    ]);

    if (!ipLimit.allowed || !idLimit.allowed) {
        const retryAfterSeconds = Math.max(ipLimit.retryAfterSeconds, idLimit.retryAfterSeconds);
        return { ok: false as const, code: "rate_limited" as const, retryAfterSeconds };
    }

    const user = await findUserByIdentifier(input.identifier);
    const lockedUntil = user ? (await getUserSecurity(user.id)).locked_until : null;
    if (lockedUntil && lockedUntil.getTime() > nowMs()) {
        await verifyPassword(await dummyHash(), input.password).catch(() => false);
        return { ok: false as const, code: "invalid_credentials" as const };
    }

    const passwordHash = user?.password_hash ?? (await dummyHash());
    const valid = await verifyPassword(passwordHash, input.password).catch(() => false);

    if (!user || !valid || user.status !== "active") {
        if (user) await recordFailedLoginAttempt(user.id);
        return { ok: false as const, code: "invalid_credentials" as const };
    }

    await clearFailedLoginState(user.id);
    return { ok: true as const, user: { id: user.id, email: user.email, role: user.role } };
}

export async function getUserPasswordHashById(userId: string) {
    if (!isDatabaseConfigured()) return null;
    await ensureAuthSchema();
    const sql = getSql();
    const rows = await sql<{ password_hash: string }[]>`
        select password_hash
        from users
        where id = ${userId}::uuid
        limit 1
    `;
    return rows[0]?.password_hash ?? null;
}

export async function createSessionForUser(input: { userId: string; ipAddress: string; userAgent: string; mfaVerified: boolean }) {
    if (!isDatabaseConfigured()) {
        return { ok: false as const, code: "db_unavailable" as const };
    }
    await ensureAuthSchema();

    const sql = getSql();
    const mfaRows = await sql<DbUserMfaRow[]>`
        select user_id, secret_encrypted, is_enabled
        from user_mfa
        where user_id = ${input.userId}::uuid
        limit 1
    `;
    const mfa = mfaRows[0] ?? null;
    if (mfa?.is_enabled && !input.mfaVerified) {
        return { ok: false as const, code: "mfa_required" as const };
    }

    const sessionId = randomSessionId();
    const expiresAt = new Date(nowMs() + sessionTtlSeconds() * 1000);
    await sql`
        insert into sessions (session_id, user_id, expires_at, ip_address, user_agent, revoked_at)
        values (${sessionId}, ${input.userId}::uuid, ${expiresAt}, ${input.ipAddress || null}, ${input.userAgent || null}, null)
    `;
    return { ok: true as const, session: { sessionId, expiresAt } };
}

export async function logoutSession(sessionId: string) {
    if (!sessionId.trim()) return;
    if (!isDatabaseConfigured()) return;
    await ensureAuthSchema();
    const sql = getSql();
    await sql`
        update sessions
        set revoked_at = now()
        where session_id = ${sessionId} and revoked_at is null
    `;
}

export function buildSessionCookie(input: { sessionId: string; expiresAt: Date; secure: boolean }) {
    const maxAge = Math.max(0, Math.floor((input.expiresAt.getTime() - nowMs()) / 1000));
    const parts = [
        `${cookieName()}=${encodeURIComponent(input.sessionId)}`,
        "Path=/",
        `Max-Age=${maxAge}`,
        "HttpOnly",
        "SameSite=Lax",
    ];
    if (input.secure) parts.push("Secure");
    return parts.join("; ");
}

export function clearSessionCookie(input: { secure: boolean }) {
    const parts = [`${cookieName()}=`, "Path=/", "Max-Age=0", "HttpOnly", "SameSite=Lax"];
    if (input.secure) parts.push("Secure");
    return parts.join("; ");
}

