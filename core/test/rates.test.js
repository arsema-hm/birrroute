import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRanking, parseNbe, rank, checkQuote, watchHit, rankOf, isSuspect, CODE_TO_ID, ageHours } from "../rates.js";
const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const api = parseRanking(load("./fixtures/ranking.json")), nbe = parseNbe(load("./fixtures/nbe.json"));
const fx = load("../data/fx.json").banks.map((b) => b.id);
const R = (o) => rank(api.banks, { nbeRef: nbe.reference, usd: 1000, ...o });
test("parse: CBE cash you-pay 163.4365 and you-get 160.2319", () => { const c = api.banks.find((b) => b.id === "cbe"); assert.equal(c.cash.pay, 163.4365); assert.equal(c.cash.get, 160.2319); });
test("NBE parse: USD buy 160.9897, sell 162.5996", () => { assert.equal(nbe.buy, 160.9897); assert.equal(nbe.sell, 162.5996); assert.equal(nbe.date, "2026-10-09"); });
test("I have $1,000 (cash): Abay pays most; stale Oromia is listed apart even though its number is higher", () => {
  const r = R({ type: "cash", mode: "sell" });
  assert.equal(r.ranked[0].id, "abay"); assert.equal(r.ranked[0].birr, 164326.8);
  assert.deepEqual(r.stale.map((x) => x.id).sort(), ["omo", "oromia"]);
});
test("I need $1,000 (cash): CBE is cheapest, 163.4365 x 1000 x 1.04", () => { const r = R({ type: "cash", mode: "buy" }); assert.equal(r.ranked[0].id, "cbe"); assert.equal(r.ranked[0].birr, 169973.96); });
test("transfer (transactional) rates are ranked separately from cash", () => { assert.equal(R({ type: "transactional", mode: "sell" }).ranked[0].id, "hibret"); assert.notEqual(R({ type: "cash", mode: "sell" }).ranked[0].id, "hibret"); });
test("a rate far from NBE (a 132.99 / 135.65 error) is flagged and left out", () => {
  assert.equal(isSuspect({ get: 132.99, pay: 135.65 }, nbe.reference), true);
  const bad = { id: "xx", name: "Bad Bank", cash: { get: 132.99, pay: 135.65, date: "2026-10-10", stale: false } };
  const r = rank([...api.banks, bad], { nbeRef: nbe.reference, usd: 1000, type: "cash", mode: "sell" });
  assert.deepEqual(r.suspect.map((x) => x.id), ["xx"]); assert.ok(!r.ranked.some((x) => x.id === "xx"));
});
test("quote check and rate watch", () => {
  const r = R({ type: "cash", mode: "sell" }).ranked;
  assert.equal(checkQuote(r, "sell", 160, 1000).gap, 4326.8); assert.equal(rankOf(r, "cbe"), r.length);
  assert.equal(watchHit(r, "sell", 164)?.id, "abay"); assert.equal(watchHit(R({ type: "cash", mode: "buy" }).ranked, "buy", 160), null);
});
test("every API bank code maps to a bank we know", () => Object.values(CODE_TO_ID).forEach((id) => assert.ok(fx.includes(id), id)));
test("age in hours", () => assert.equal(Math.round(ageHours("2026-10-10T11:00:00Z", Date.parse("2026-10-10T17:00:00Z"))), 6));
