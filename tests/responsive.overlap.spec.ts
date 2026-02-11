import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

const viewports = [
    { name: "desktop-1440x900", width: 1440, height: 900 },
    { name: "laptop-1366x768", width: 1366, height: 768 },
    { name: "tablet-768x1024", width: 768, height: 1024 },
    { name: "ipad-pro-1024x1366", width: 1024, height: 1366 },
    { name: "iphone-12-390x844", width: 390, height: 844 },
    { name: "iphone-se-320x568", width: 320, height: 568 },
    { name: "android-360x800", width: 360, height: 800 },
    { name: "android-412x915", width: 412, height: 915 },
] as const;

const publicRoutes = ["/"] as const;
const appRoutes = ["/dashboard", "/meetings", "/reminders", "/email", "/settings", "/settings/connectors"] as const;

async function stubAppRoutes(page: Parameters<typeof test>[1]["page"]) {
    await page.context().addCookies([{ name: "talklee_auth_token", value: "e2e-token", url: "http://127.0.0.1:3100" }]);

    await page.route(/\/(?:api\/v1\/)?connectors\/status\/?(\?.*)?$/, async (route) => {
        const req = route.request();
        if (req.resourceType() === "document") return route.continue();
        if (req.method() !== "GET") return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ items: [{ type: "calendar", status: "connected" }, { type: "email", status: "connected" }] }),
        });
    });

    await page.route(/\/(?:api\/v1\/)?calendar\/events\/?(\?.*)?$/, async (route) => {
        const req = route.request();
        if (req.resourceType() === "document") return route.continue();
        if (req.method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.route(/\/(?:api\/v1\/)?meetings\/?(\?.*)?$/, async (route) => {
        const req = route.request();
        if (req.resourceType() === "document") return route.continue();
        if (req.method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.route(/\/(?:api\/v1\/)?reminders\/?(\?.*)?$/, async (route) => {
        const req = route.request();
        if (req.resourceType() === "document") return route.continue();
        if (req.method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.route(/\/(?:api\/v1\/)?email\/templates\/?(\?.*)?$/, async (route) => {
        const req = route.request();
        if (req.resourceType() === "document") return route.continue();
        if (req.method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });
}

async function auditNoOccludedClicks(page: Parameters<typeof test>[1]["page"]) {
    const result = await page.evaluate(() => {
        const MAX_FINDINGS = 60;

        const isVisible = (el: Element) => {
            const style = window.getComputedStyle(el);
            if (style.visibility === "hidden" || style.display === "none") return false;
            const rect = (el as HTMLElement).getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) return false;
            if (rect.bottom <= 0 || rect.right <= 0) return false;
            if (rect.top >= window.innerHeight || rect.left >= window.innerWidth) return false;
            return true;
        };

        const getRect = (el: Element) => (el as HTMLElement).getBoundingClientRect();

        const candidates = Array.from(
            document.querySelectorAll<HTMLElement>(
                'a[href]:not([tabindex="-1"]), button:not([disabled]), [role="button"]:not([aria-disabled="true"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
            ),
        )
            .filter((el) => isVisible(el))
            .slice(0, 600);

        const occluded: Array<{
            tag: string;
            role: string | null;
            name: string;
            center: { x: number; y: number };
            rect: { left: number; top: number; width: number; height: number };
            topTag: string;
            topName: string;
        }> = [];

        const horizontalOverflow =
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 ||
            document.body.scrollWidth > document.body.clientWidth + 1;

        for (const el of candidates) {
            if (occluded.length >= MAX_FINDINGS) break;

            const rect = getRect(el);
            const x = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
            const y = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));

            const topEl = document.elementFromPoint(x, y);
            if (!topEl) continue;
            if (el === topEl) continue;
            if (el.contains(topEl)) continue;

            const topStyle = window.getComputedStyle(topEl);
            if (topStyle.pointerEvents === "none") continue;

            const name =
                (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim().slice(0, 80) || "(unnamed)";
            const topName =
                (topEl.getAttribute("aria-label") || topEl.getAttribute("title") || topEl.textContent || "").trim().slice(0, 80) ||
                "(unnamed)";

            occluded.push({
                tag: el.tagName.toLowerCase(),
                role: el.getAttribute("role"),
                name,
                center: { x: Math.round(x), y: Math.round(y) },
                rect: { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
                topTag: topEl.tagName.toLowerCase(),
                topName,
            });
        }

        return { occluded, horizontalOverflow, candidateCount: candidates.length };
    });

    expect(result.horizontalOverflow, "Horizontal overflow detected").toBe(false);
    expect(
        result.occluded,
        `Found ${result.occluded.length} occluded interactive elements (scanned ${result.candidateCount})`,
    ).toEqual([]);
}

for (const vp of viewports) {
    test(`responsive: no overlap/misclick (${vp.name})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        for (const route of publicRoutes) {
            await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
            await page.evaluate(() => document.fonts?.ready);
            await auditNoOccludedClicks(page);

            if (vp.width < 768) {
                const menuToggle = page.getByLabel("Open navigation menu");
                await menuToggle.click();

                const panel = page.getByRole("menu", { name: "Mobile" });
                await expect(panel).toBeVisible();

                const box = await panel.boundingBox();
                expect(box, "Mobile menu panel should have a bounding box").not.toBeNull();
                if (box) {
                    expect(box.x, "Mobile menu panel should not overflow left").toBeGreaterThanOrEqual(0);
                    expect(box.x + box.width, "Mobile menu panel should not overflow right").toBeLessThanOrEqual(vp.width + 0.5);
                }

                await menuToggle.click();
                await expect(panel).toBeHidden();
            }
        }

        await stubAppRoutes(page);
        for (const route of appRoutes) {
            await page.goto(route, { waitUntil: "domcontentloaded", timeout: 90_000 });
            await page.evaluate(() => document.fonts?.ready);
            await auditNoOccludedClicks(page);
        }
    });
}

