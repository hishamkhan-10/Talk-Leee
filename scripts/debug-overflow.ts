import { chromium } from "@playwright/test";

type Offender = {
  tag: string;
  id: string | null;
  className: string | null;
  left: number;
  right: number;
  width: number;
  position: string;
  display: string;
  overflowX: string;
};

async function findOverflowOffenders(url: string, viewport: { width: number; height: number }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(() => document.fonts?.ready);

  const result = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: Offender[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const style = getComputedStyle(el);
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: (el.className && el.className.toString().slice(0, 160)) || null,
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          position: style.position,
          display: style.display,
          overflowX: style.overflowX,
        });
      }
    }

    offenders.sort((a, b) => Math.abs(b.right - vw) - Math.abs(a.right - vw));
    return {
      vw,
      docSW: document.documentElement.scrollWidth,
      docCW: document.documentElement.clientWidth,
      bodySW: document.body.scrollWidth,
      bodyCW: document.body.clientWidth,
      offenders: offenders.slice(0, 30),
    };
  });

  await browser.close();
  return result;
}

async function main() {
  const baseURL = "http://127.0.0.1:3100";
  const url = `${baseURL}/`;
  const vp = { width: 320, height: 568 };
  const out = await findOverflowOffenders(url, vp);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ viewport: vp, url, ...out }, null, 2));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
