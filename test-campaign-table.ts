
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("CampaignPerformanceTable includes mobile metrics grouping and test ID", () => {
    const filePath = path.join(process.cwd(), "src/components/campaigns/campaign-performance-table.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.match(content, /data-testid="campaigns-performance-table"/);
    assert.match(content, /sm:hidden/);
    assert.match(content, /sm:block/);
    assert.match(content, /Sort by Metrics/);
    assert.match(content, /SR\s*\{/);
    assert.match(content, /\bL\s*\{/);
    assert.match(content, /\bC\s*\{/);
    assert.match(content, /\bF\s*\{/);

    assert.equal(content.includes("text-gray-200"), false);
    assert.equal(content.includes("border-white/10"), false);
});
