import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asOf, searchTopics } from "../rules.js";
const rules = JSON.parse(readFileSync(new URL("../data/rules.json", import.meta.url)));
const t = (id) => rules.topics.find((x) => x.id === id);
test("import advance limit: 5,000 on 19 May 2025, 50,000 on 20 May 2025", () => {
  assert.match(asOf(t("import-advance"), "2025-05-19").text, /5,000/);
  assert.match(asOf(t("import-advance"), "2025-05-20").text, /50,000/);
});
test("4% fee cap starts 26 May 2025", () => {
  assert.match(asOf(t("fx-fee-cap"), "2025-05-25").text, /No 4%/);
  assert.match(asOf(t("fx-fee-cap"), "2025-05-26").text, /capped at 4%/);
});
test("no data before a rule's first known date (travel allowance)", () => assert.equal(asOf(t("travel-fx"), "2025-01-01"), null));
test("medical/education: 20,000 from 12 Feb 2026", () => assert.match(asOf(t("med-edu"), "2026-02-12").text, /20,000/));
test("LC approval changes on 25 May 2026", () => {
  assert.match(asOf(t("lc-approval"), "2026-05-24").text, /Prior NBE approval/);
  assert.match(asOf(t("lc-approval"), "2026-05-25").text, /without prior NBE/);
});
test("search finds topics by keyword", () => assert.ok(searchTopics(rules, "advance").length >= 2));
test("every value has an https source and dates are sorted", () => rules.topics.forEach((x) => {
  x.values.forEach((v) => assert.match(v.source_url, /^https:\/\//));
  assert.deepEqual(x.values.map((v) => v.from), [...x.values.map((v) => v.from)].sort());
}));
