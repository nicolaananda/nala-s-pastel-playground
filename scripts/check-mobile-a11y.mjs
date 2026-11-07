import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

for (const rule of [
  ":focus-visible",
  "min-height: 44px",
  "prefers-reduced-motion: reduce",
  "overflow-wrap: anywhere",
  "--primary-foreground: 45 30% 18%",
]) {
  assert(css.includes(rule), `Missing mobile accessibility rule: ${rule}`);
}

console.log("Mobile accessibility CSS checks passed.");
