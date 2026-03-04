import { test, expect } from "@playwright/test";

function rgb(value: string) {
    const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

test.describe("White-label branding isolation", () => {
    test("Switches fully between partners without mixed branding", async ({ page }) => {
        test.setTimeout(120_000);
        await page.goto("/white-label/acme/preview", { waitUntil: "domcontentloaded" });

        await expect(page.locator('[data-white-label-partner="acme"]')).toBeVisible();
        await expect(page.locator('img[alt="Acme"]').first()).toBeVisible();

        const acmePrimary = page.getByRole("button", { name: "Primary Button" }).first();
        await expect(acmePrimary).toBeVisible();

        const acmeBg = await acmePrimary.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(rgb(acmeBg)).toEqual({ r: 37, g: 99, b: 235 });

        const acmeFaviconHref = await page
            .locator('head link[rel="icon"][data-wl-favicon="1"]')
            .evaluate((el) => (el as HTMLLinkElement).href);
        expect(acmeFaviconHref).toContain("/white-label/acme/favicon.svg");
        expect(acmeFaviconHref).toContain("wl=acme");

        await page.goto("/white-label/zen/preview", { waitUntil: "domcontentloaded" });

        await expect(page.locator('[data-white-label-partner="zen"]')).toBeVisible();
        await expect(page.locator('img[alt="Zen"]').first()).toBeVisible();
        await expect(page.locator('img[alt="Acme"]')).toHaveCount(0);

        const zenPrimary = page.getByRole("button", { name: "Primary Button" }).first();
        await expect(zenPrimary).toBeVisible();

        const zenBg = await zenPrimary.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(rgb(zenBg)).toEqual({ r: 22, g: 163, b: 74 });

        const zenFaviconHref = await page
            .locator('head link[rel="icon"][data-wl-favicon="1"]')
            .evaluate((el) => (el as HTMLLinkElement).href);
        expect(zenFaviconHref).toContain("/white-label/zen/favicon.svg");
        expect(zenFaviconHref).toContain("wl=zen");
        expect(zenFaviconHref).not.toContain("/white-label/acme/favicon.svg");
    });
});
