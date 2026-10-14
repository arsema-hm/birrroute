import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KEYS } from "../i18n.js";
const src = ["../../App.js", "../../src/ui.js"].map((p) => readFileSync(new URL(p, import.meta.url), "utf8")).join("\n");
test("every t(\"key\") used in the app exists in the dictionary", () => {
  const used = [...src.matchAll(/\bt\("([a-z_]+)"/g)].map((m) => m[1]).filter((k) => !k.endsWith("_"));
  assert.ok(used.length > 40);
  used.forEach((k) => assert.ok(KEYS.includes(k), "missing key: " + k));
  [...src.matchAll(/key: "([a-z_]+)"/g)].forEach((m) => assert.ok(KEYS.includes(m[1]), "missing dest key: " + m[1]));
  ["home", "usd", "fees", "rules", "help"].forEach((id) => assert.ok(KEYS.includes("tab_" + id)));
});
