import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

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
