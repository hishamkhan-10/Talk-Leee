# Day 01: White-Label Admin Dashboard + Multi-Tenant Concurrency Resale Readiness

**Date:** 2026-03-13  
**Repository:** Talk-Leee (Next.js frontend)  
**Author:** Automated engineering report (documentation-only)  

## Executive Summary
- Implemented a complete **white-label admin dashboard** for partner provisioning and enabled role-aligned access control for white-label admin vs partner admin flows.
- Added **deterministic concurrency limiting** at the API boundary (dummy backend) and ensured **UI-level blocking** and tenant allocation validation when limits/capacity are reached.
- Stabilized cross-browser Playwright E2E execution by correcting **dev CSP behavior** (preventing forced HTTPS upgrades on localhost) and hardening browser-specific runtime behavior.
- Re-ran and validated the end-to-end test suite for the multi-tenant concurrency scenario across **Chromium, Edge, Firefox, and WebKit**, and updated the engineering test report accordingly.

## Key Outcomes
- White-label admin access path available and role-gated at `/white-label/dashboard`.
- Partner creation workflow available in UI (generates partner-admin tokens for dummy auth).
- API now returns **HTTP 429 + Retry-After** on concurrency exhaustion and the UI prevents repeated/invalid actions after limit errors.
- Multi-tenant concurrency E2E scenario validated across all Playwright projects.
- Lint/typecheck run; typecheck issues resolved; lint warnings noted (not fixed).

## Table of Contents
- [Work Scope / Investigation Scope](#work-scope--investigation-scope)
- [In-scope](#in-scope)
- [Out-of-scope](#out-of-scope)
- [Components / Areas Analyzed](#components--areas-analyzed)
- [Issues Identified & Fixes Applied](#issues-identified--fixes-applied)
- [Configuration / Environment Changes](#configuration--environment-changes)
- [File Structure Overview](#file-structure-overview)
- [Architecture / Flow Diagram](#architecture--flow-diagram)
- [Code / Logic Analysis](#code--logic-analysis)
- [Setup / Usage / Operational Guide](#setup--usage--operational-guide)
- [Verification & Testing](#verification--testing)
- [Troubleshooting Notes](#troubleshooting-notes)
- [Performance / Reliability Considerations](#performance--reliability-considerations)
- [Security Notes](#security-notes)
- [Files Changed / Artifacts](#files-changed--artifacts)
- [Next Steps](#next-steps)
- [Summary](#summary)

## Work Scope / Investigation Scope
- Goal: Make the white-label frontend **resale-deployable with dummy data**, with working admin provisioning, partner/sub-tenant flows, deterministic concurrency signaling, and verified UI blocking behavior.
- Test target: `tests/multi-tenant-concurrency.e2e.spec.ts` using Playwright running against a local Next.js dev server.

## In-scope
- White-label admin page and role gating.
- Partner provisioning UX and dummy auth token generation.
- Sub-tenant management UX, capacity validation, and UI blocking behavior.
- API-boundary concurrency limiting behavior (dummy backend endpoints).
- Cross-browser E2E stability fixes (Next.js dev CSP + browser compatibility).
- E2E report update reflecting new verified behavior.

## Out-of-scope
- Real backend integration (database, real auth provider, real tenancy persistence).
- Production-grade admin onboarding UX (e.g., dedicated admin login entry point, SSO).
- Eliminating all Next.js dev Watchpack warnings/errors related to filesystem scanning.
- Resolving unrelated existing lint warnings in marketing pages (documented but not changed).

## Components / Areas Analyzed

| Area | Location | Status |
|---|---|---|
| White-label admin dashboard page | `src/app/white-label/dashboard/*` | Complete |
| Partner tenants management | `src/app/white-label/[partner]/tenants/*` | Complete |
| Agent settings concurrency UI | `src/app/white-label/[partner]/tenants/[tenant]/agent-settings/*` | Complete |
| Dev auth role mapping (dummy) | `src/app/api/v1/[...path]/route.ts` | Complete |
| Route guarding (client + server) | `src/components/guards/route-guard.tsx`, `src/lib/server-auth.ts` | Complete |
| Middleware auth redirects + CSP | `src/middleware.ts` | Complete |
| Modal + motion behavior | `src/components/ui/modal.tsx` | Complete |
| Playwright config | `playwright.config.ts` | Complete |
| E2E test + report | `tests/multi-tenant-concurrency.e2e.spec.ts`, `test-report.multi-tenant-concurrency.md` | Complete |

## Issues Identified & Fixes Applied

| Issue | Root cause | Resolution | Result |
|---|---|---|---|
| White-label admin dashboard not accessible / role mismatch | Dev auth/me endpoint was returning a non-matching role; route guard required `white_label_admin` | Updated dev auth mapping so `wl-admin-token` resolves to `white_label_admin` and partner tokens resolve to `partner_admin` | White-label admin route can be reached and is role-gated correctly |
| Partner creation UI missing | No UI surface to create partners and produce tokens for the dummy environment | Added partner management UI in `/white-label/dashboard` to create partner records and emit partner-admin tokens | White-label admin can provision partners from the UI |
| Concurrency limit not enforced / no limit signal | API boundary did not return a deterministic limit response | Implemented dummy concurrency tracking with **HTTP 429 + Retry-After** on limit | E2E observes limit conditions and verifies enforcement |
| UI not disabling primary actions after limit errors | UI expectation depended on a metrics element that wasn’t reliably present; some buttons remained actionable after failure conditions | Updated E2E assertions to verify button disablement and visible blocked states; ensured UI disables actions for limit conditions and for over-allocation | UI behavior matches required “block further actions” constraints |
| Cross-browser (WebKit) failure: page stuck “Loading…” and `/403` | Dev CSP used `upgrade-insecure-requests`, forcing `http://127.0.0.1` asset requests to `https://127.0.0.1`, which WebKit refused (SSL connect error) | Modified CSP to only include upgrade/mixed-content directives when the request is already HTTPS | WebKit loads the white-label dashboard successfully in dev |
| Browser runtime differences for `matchMedia` listeners | Some engines use legacy `addListener/removeListener` rather than `addEventListener/removeEventListener` | Added a compatibility fallback in relevant layout components | Reduced cross-browser runtime errors and improved stability |
| Flaky / blocked clicks in modal footer area during E2E | Motion/overlay and focus behavior sometimes interfered with clickability in tests | Reduced motion in Playwright and ensured modal behavior respects reduced-motion preference | E2E became more stable across projects |
| Typecheck failure in white-label dashboard | `Switch` component required `ariaLabel` prop | Added required `ariaLabel` where missing | `npm run typecheck` passes |

## Configuration / Environment Changes

### Playwright
- Updated `playwright.config.ts`:
  - Enabled `reducedMotion: "reduce"` to reduce animation flakiness across engines.
  - Increased `webServer.timeout` from `120_000` to `240_000` after an observed server readiness timeout.

### Next.js Dev CSP + Middleware
- Updated `src/middleware.ts` CSP generation:
  - `upgrade-insecure-requests` and `block-all-mixed-content` are now conditionally applied **only when the request is HTTPS**.
  - This addressed WebKit SSL-connect failures caused by forced upgrades on local HTTP.

### Next.js Config
- Updated `next.config.ts`:
  - Enabled `allowedDevOrigins` to support dev-origin restrictions introduced by Next.js.
  - Attempted to harden file watching ignore rules to reduce noisy Watchpack errors; final configuration retains compatibility (no invalid Webpack schema).
  - Note: Watchpack still emits some `EINVAL lstat` warnings for protected system files; these are noise and do not block E2E completion.

### Token and Host Behavior (Observed)
- Auth relies on:
  - `localStorage` key: `talklee.auth.token`
  - cookie: `talklee_auth_token`
- A practical observed pitfall: `localhost` vs `127.0.0.1` affects cookie scope; using the same host consistently avoids unexpected `/403` redirects.

## File Structure Overview

```
Talk-Leee/
├─ src/
│  ├─ app/
│  │  ├─ api/v1/[...path]/route.ts
│  │  ├─ white-label/
│  │  │  ├─ dashboard/
│  │  │  │  ├─ layout.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ [partner]/
│  │  │     └─ tenants/
│  │  │        ├─ page.tsx
│  │  │        └─ [tenant]/agent-settings/page.tsx
│  ├─ components/
│  │  ├─ guards/route-guard.tsx
│  │  ├─ layout/
│  │  │  ├─ dashboard-layout.tsx
│  │  │  ├─ global-sidebar-toggle.tsx
│  │  │  └─ sidebar.tsx
│  │  └─ ui/modal.tsx
│  ├─ lib/
│  │  ├─ auth-context.tsx
│  │  ├─ auth-token.ts
│  │  ├─ env.ts
│  │  └─ server-auth.ts
│  └─ middleware.ts
├─ tests/
│  └─ multi-tenant-concurrency.e2e.spec.ts
├─ playwright.config.ts
├─ next.config.ts
└─ test-report.multi-tenant-concurrency.md
```

**Notes**
- White-label admin entry point: `src/app/white-label/dashboard/page.tsx`
- Dummy API boundary (auth + concurrency): `src/app/api/v1/[...path]/route.ts`
- Core E2E verification: `tests/multi-tenant-concurrency.e2e.spec.ts`

## Architecture / Flow Diagram

```
Browser (User/Admin)
  |
  | 1) Navigate to /white-label/dashboard
  v
Next.js App Router (Server)
  |
  | 2) middleware.ts:
  |    - sets CSP
  |    - checks talklee_auth_token cookie (if present)
  |    - fetches /api/v1/auth/me or /api/v1/me (internal bypass header)
  |    - redirects:
  |        white_label_admin -> allowed to /white-label/*
  |        non-admin -> /403 for admin-only routes
  v
White-label Admin Page
  |
  | 3) Client guard (RouteGuard):
  |    - verifies role from client auth context
  |    - redirects to /403 if role mismatch
  v
Partner Management UI
  |
  | 4) Creates partner and returns partner-admin token (dummy)
  v
Partner Tenants UI (/white-label/{partner}/tenants)
  |
  | 5) Sub-tenant creation enforces remaining capacity in UI
  v
Concurrency Exercise
  |
  | 6) POST /api/v1/assistant/execute (dummy API boundary)
  |    - enforces per-partner concurrency limit
  |    - returns 429 + Retry-After on exhaustion
  v
UI blocks further actions during cooldown and on allocation overages
```

## Code / Logic Analysis

### Role semantics (dev/dummy)
- The API stub resolves identity based on bearer token:
  - `wl-admin-token` → `role: white_label_admin`
  - `partner-<partnerId>-token` → `role: partner_admin`, `partner_id: <partnerId>`
- White-label admin dashboard is guarded in two layers:
  - **Server**: `src/app/white-label/dashboard/layout.tsx` uses `getServerMe()` and redirects to `/auth/login` or `/403` based on role.
  - **Client**: `RouteGuard` checks `useAuth().user.role` and redirects to `/403` when role mismatch is detected.

### Concurrency enforcement contract (dummy)
- The dummy boundary implements:
  - per-partner inflight tracking
  - a numeric concurrency cap
  - **HTTP 429** response when cap is exceeded
  - `Retry-After` header to express cooldown/availability signaling
- UI verification focused on:
  - visible blocked state (user feedback)
  - disabled primary action preventing repeated submits
  - no “silent” success path when at/over capacity

### CSP behavior adjustment
- Previously, dev CSP included `upgrade-insecure-requests`, which can:
  - rewrite `http://127.0.0.1/...` → `https://127.0.0.1/...`
  - cause **WebKit SSL connect errors** locally (no HTTPS server)
- Updated approach: apply upgrade/mixed-content directives only when the request is already HTTPS, preserving secure behavior without breaking localhost dev.

## Setup / Usage / Operational Guide

### Accessing the white-label admin dashboard (production-intent behavior)
- Endpoint/path: `/white-label/dashboard`
- Required backend contract:
  - Auth API returns `role: "white_label_admin"` for admin accounts at `/api/v1/auth/me` (or `/api/v1/me`).
  - App uses cookie `talklee_auth_token` to authorize server-side role checks.

### Accessing the white-label admin dashboard (local dev/dummy auth)
- Use the white-label admin token once (persists until cleared):
  - localStorage key: `talklee.auth.token`
  - cookie: `talklee_auth_token`
- Ensure consistent host usage (`localhost` vs `127.0.0.1`) to avoid cookie mismatch.

**Screenshot placeholder 1:** White-label admin dashboard view after successful auth  
_Should show Partner Management section and “Create Partner” controls._

**Screenshot placeholder 2:** Partner tenants page showing created sub-tenant rows  
_Should show partner-scoped URL and tenant list._

**Screenshot placeholder 3:** Concurrency UI blocking state  
_Should show blocked/disabled action with cooldown and/or limit messaging._

**Screenshot placeholder 4:** Allocation blocking state for sub-tenant creation modal  
_Should show error message “Sub-concurrency exceeds remaining capacity” and disabled Create Tenant button._

## Verification & Testing

### Tests run
- Playwright (full scenario across projects):
  - `npm run test:visual -- tests/multi-tenant-concurrency.e2e.spec.ts`
- Targeted WebKit debugging run (when WebKit was failing):
  - `npm run test:visual -- --project=webkit tests/multi-tenant-concurrency.e2e.spec.ts`
- Lint:
  - `npm run lint`
- Typecheck:
  - `npm run typecheck`

### Validations
- E2E scenario validated:
  - White-label admin can load admin dashboard and create partner
  - Partner can create sub-tenant within remaining capacity
  - Concurrency ramp generates traffic and reaches 429 limit behavior
  - UI blocks further actions at limit and blocks allocations beyond capacity
- Cross-browser: Chromium, Edge, Firefox, WebKit all passed the scenario after CSP fix.

### Expected vs actual results
- Expected: All required steps pass across browsers with deterministic limit behavior.
- Actual: Achieved after incremental fixes; final full-run reported **4 passed**.

### Notable observations during testing
- Next.js dev server emitted Watchpack `EINVAL lstat` warnings for protected system paths. These did not block successful E2E completion.
- A sandbox restriction message appeared during one run indicating attempts to touch restricted OS files (non-code issue); testing still completed successfully afterward.
- WebKit failures were traced to forced HTTPS upgrades from CSP and resolved by conditional CSP directives.

## Troubleshooting Notes
- Symptom: `/white-label/dashboard` redirects to `/403`
  - Likely cause: not authenticated as `white_label_admin` or cookie set for a different host (`localhost` vs `127.0.0.1`).
  - Confirm cookie name: `talklee_auth_token`; confirm localStorage key: `talklee.auth.token`.
- Symptom: WebKit stuck at “Loading…” and console shows SSL connect errors
  - Root cause: CSP `upgrade-insecure-requests` forcing HTTPS to a non-HTTPS localhost server.
  - Resolution applied: only set upgrade/mixed-content directives when request is HTTPS.
- Symptom: Dev server readiness timeout in Playwright
  - Resolution applied: increased webServer timeout in Playwright config.

## Performance / Reliability Considerations
- Concurrency enforcement at the API boundary provides deterministic behavior for UI and tests; real production integration should maintain the same contract for predictable UX.
- Reduced-motion configuration in tests reduces flakiness but should not be relied upon as a product behavior; it is a test stabilization choice.
- Watchpack scan warnings remain a dev-only annoyance; they do not represent functional failures but can add log noise.

## Security Notes
- Role enforcement is implemented at multiple layers (middleware + server layout + client guard), reducing accidental access exposure.
- CSP remains strict in general; the change preserves secure behavior while avoiding insecure-request upgrades on local HTTP.
- Tokens used in the dummy environment are non-sensitive placeholders (e.g., `wl-admin-token`, `partner-<id>-token`); avoid logging real tokens in production.

## Files Changed / Artifacts

| File | Purpose |
|---|---|
| `src/app/white-label/dashboard/page.tsx` | White-label admin dashboard UI and partner management integration |
| `src/app/white-label/dashboard/layout.tsx` | Server-side role gating for the white-label admin area |
| `src/app/api/v1/[...path]/route.ts` | Dummy backend: role resolution and API concurrency limiting (429 + Retry-After) |
| `src/app/white-label/[partner]/tenants/tenants-client.tsx` | Sub-tenant creation + capacity validation + UI blocking |
| `src/app/white-label/[partner]/tenants/[tenant]/agent-settings/page.tsx` | Concurrency test UI and blocking behavior |
| `src/components/guards/route-guard.tsx` | Client-side role enforcement behavior used by the admin page |
| `src/components/ui/modal.tsx` | Reduced-motion-aware modal behavior to improve cross-browser stability |
| `src/components/layout/dashboard-layout.tsx` | `matchMedia` listener compatibility fix |
| `src/components/layout/sidebar.tsx` | `matchMedia` listener compatibility fix |
| `src/components/layout/global-sidebar-toggle.tsx` | `matchMedia` listener compatibility fix |
| `src/middleware.ts` | CSP adjustment to prevent dev HTTP→HTTPS upgrade failures |
| `next.config.ts` | Dev-origin configuration (`allowedDevOrigins`) and watcher ignore hardening attempt |
| `playwright.config.ts` | Reduced motion + increased dev server timeout |
| `tests/multi-tenant-concurrency.e2e.spec.ts` | E2E stabilization and verification updates (including user-intent edits) |
| `test-report.multi-tenant-concurrency.md` | Updated report to reflect passing status and evidence |
| `test-artifacts/multi-tenant-concurrency/*` | Screenshots and JSON evidence produced by E2E runs |

### Artifact placeholders (generated during testing)
- `test-artifacts/multi-tenant-concurrency/chromium/*.png` (UI evidence)
- `test-artifacts/multi-tenant-concurrency/chromium/04-concurrency-ramp-results.json` (ramp/limit results)
- `test-results/**` (Playwright failure contexts when debugging)

## Next Steps

### Immediate follow-ups
- Add a first-class login pathway for white-label admins (instead of requiring manual dev token injection in local testing).
- Normalize or document a single dev host (`localhost` or `127.0.0.1`) to avoid cookie-scope confusion.
- Reduce Watchpack noise further (if feasible) by tightening watch roots and/or aligning ignore patterns with Next.js/webpack supported formats.

### Future improvements
- Replace dummy role mapping and partner/token generation with real auth + persistence:
  - `/api/v1/auth/me` should return authoritative roles and partner scope
  - `/api/v1/assistant/execute` should enforce real concurrency using a shared store (e.g., Redis)
- Expand E2E to include negative auth cases (partner attempting admin dashboard, mismatched partnerId, etc.).
- Add observability around rate limiting (structured logs/metrics) without emitting sensitive tokens.

## Summary
- Delivered white-label admin provisioning UI, role-aligned auth behavior, deterministic concurrency limiting, and UI blocking behavior necessary for resale deployment with dummy data.
- Resolved key E2E blockers (role mismatch, missing UI, missing 429, UI disablement, WebKit SSL/CSP issues) and validated the full scenario across all Playwright projects.
- Documented remaining non-blocking dev warnings (Watchpack) and existing lint warnings outside the scope of the resale readiness task.

