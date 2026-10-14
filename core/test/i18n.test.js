import test from "node:test";
import assert from "node:assert/strict";
import { KEYS, raw, tr, LANGS } from "../i18n.js";
const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
test("every key has all 5 languages, and placeholders match English", () => KEYS.forEach((k) => {
  const row = raw(k); assert.equal(row.length, LANGS.length, k);
  row.forEach((s, i) => { assert.ok(s && s.length, `${k}[${i}] empty`); assert.equal(ph(s), ph(row[0]), `${k}[${i}] placeholders`); });
}));
test("tr fills variables and falls back to English for unknown language", () => {
  assert.equal(tr("en", "fee_is", { n: 4 }), "4 birr fee");
  assert.equal(tr("zz", "free"), "Free");
  assert.match(tr("am", "step", { n: 2 }), /2/);
});
test("node name keys exist for every non-bank node", () => {
  const nodes = JSON.parse(readFileSync(new URL("../data/fees.json", import.meta.url))).nodes;
  nodes.filter((n) => n.type !== "bank").forEach((n) => assert.ok(KEYS.includes("n_" + n.id), n.id));
});
import { readFileSync } from "node:fs";
