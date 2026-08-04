#!/usr/bin/env node
// Fails CI if the entry chunk grows past a budget without anyone noticing.
// Run after `npm run build`. Budget has headroom above the measured baseline
// (~211 KB gzip as of 2026-08-04) — this should catch a real regression
// (an unintentionally-eager import, a heavy new dependency) without flagging
// routine growth from one extra label or icon.

import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST_ASSETS = path.resolve(import.meta.dirname, "..", "dist", "assets");
const BUDGET_BYTES = 260 * 1024; // 260 KB gzip

const entryFile = readdirSync(DIST_ASSETS).find((f) => /^index-.*\.js$/.test(f));
if (!entryFile) {
    console.error(`check-bundle-size: no entry chunk (index-*.js) found in ${DIST_ASSETS}. Run "npm run build" first.`);
    process.exit(1);
}

const raw = readFileSync(path.join(DIST_ASSETS, entryFile));
const gzipBytes = gzipSync(raw).length;
const gzipKB = (gzipBytes / 1024).toFixed(1);
const budgetKB = (BUDGET_BYTES / 1024).toFixed(0);

if (gzipBytes > BUDGET_BYTES) {
    console.error(`check-bundle-size: ${entryFile} is ${gzipKB} KB gzip, over the ${budgetKB} KB budget.`);
    console.error(`Run "ANALYZE=true npm run build" and open dist/stats.html to see what grew.`);
    process.exit(1);
}

console.log(`check-bundle-size: ${entryFile} is ${gzipKB} KB gzip (budget ${budgetKB} KB) — OK.`);
