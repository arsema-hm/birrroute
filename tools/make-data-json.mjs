// Combines the three data files into one data.json you can host (set REMOTE_URL in App.js to its URL).
import { readFileSync, writeFileSync } from "node:fs";
const read = (n) => JSON.parse(readFileSync(new URL(`../core/data/${n}.json`, import.meta.url)));
const out = { fees: read("fees"), fx: read("fx"), rules: read("rules") };
writeFileSync(new URL("../data.json", import.meta.url), JSON.stringify(out));
console.log(`data.json written: fees version ${out.fees.version}, ${out.fees.rules.length} fee rules`);
