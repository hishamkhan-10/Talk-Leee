import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

const sidebarViewports = [
    { name: "desktop-1920x1080", width: 1920, height: 1080 },
    { name: "laptop-1366x768", width: 1366, height: 768 },
    { name: "mobile-360x800", width: 360, height: 800 },
] as const;

test("sidebar fits without scrolling at common resolutions", async ({ page }) => {
    await page.context().addCookies([{ name: "talklee_auth_token", value: "e2e-token", url: "http://127.0.0.1:3100" }]);

    await page.route("**/api/v1/connectors/status", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ items: [{ type: "calendar", status: "connected" }, { type: "email", status: "connected" }] }),
        });
    });

    for (const vp of sidebarViewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.evaluate(() => document.fonts?.ready);

        if (vp.width >= 1024) {
            const sidebar = page.locator("aside.talklee-sidebar");
            await expect(sidebar).toBeVisible();

            const metrics = await sidebar.evaluate((el) => {
                const rect = el.getBoundingClientRect();
                const inner = el.firstElementChild as HTMLElement | null;
                return {
                    width: rect.width,
                    scrollHeight: inner?.scrollHeight ?? 0,
                    clientHeight: inner?.clientHeight ?? 0,
                };
            });

            expect(metrics.width).toBeGreaterThan(150);
            expect(metrics.width).toBeLessThan(320);
            expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
        } else {
            await page.getByRole("button", { name: "Open sidebar" }).click();
            const dialog = page.getByRole("dialog", { name: "Sidebar" });
            await expect(dialog).toBeVisible();
            const metrics = await dialog.evaluate((el) => {
                const inner = el.firstElementChild as HTMLElement | null;
                return {
                    scrollHeight: inner?.scrollHeight ?? 0,
                    clientHeight: inner?.clientHeight ?? 0,
                };
            });
            expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
        }
    }
});

test("demo path: dashboard, meetings, reminders, email, connectors", async ({ page }) => {
    await page.context().addCookies([{ name: "talklee_auth_token", value: "e2e-token", url: "http://127.0.0.1:3100" }]);

    await page.route("**/api/v1/connectors/status", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ items: [{ type: "calendar", status: "connected" }, { type: "email", status: "connected" }] }),
        });
    });

    await page.route("**/api/v1/calendar/events", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ items: [] }),
        });
    });

    await page.route("**/api/v1/meetings", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.route("**/api/v1/reminders", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.route("**/api/v1/email/templates", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("link", { name: "Meetings" })).toBeVisible();
    await page.goto("/meetings", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/meetings/);
    await expect(page.getByRole("heading", { name: "Meetings" })).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole("link", { name: "Reminders" })).toBeVisible();
    await page.goto("/reminders", { waitUntil: "networkidle", timeout: 60_000 });
    await expect(page).toHaveURL(/\/reminders/);
    await expect(page.getByRole("heading", { name: "Reminders" })).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole("link", { name: "Email" })).toBeVisible();
    await page.goto("/email", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/email/);
    await expect(page.getByRole("heading", { name: "Email" })).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await page.goto("/settings", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/settings/);
    await page.goto("/settings/connectors", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page).toHaveURL(/\/settings\/connectors/);
    await expect(page.getByRole("heading", { name: "Connectors" })).toBeVisible({ timeout: 20_000 });
});
