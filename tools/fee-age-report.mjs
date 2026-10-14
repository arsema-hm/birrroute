// Monthly check: lists fee rules from the one checked longest ago. Re-open each source_url, confirm, then update last_checked.
import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("../core/data/fees.json", import.meta.url)));
const days = (s) => Math.floor((Date.now() - Date.parse(s + "T00:00:00Z")) / 86400000);
[...d.rules].sort((a, b) => a.last_checked.localeCompare(b.last_checked)).forEach((r) => console.log(`${String(days(r.last_checked)).padStart(4)} days  ${r.id.padEnd(20)} ${r.source_url}`));
