import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { feeFor, findRoutes } from "../fee.js";
const data = JSON.parse(readFileSync(new URL("../data/fees.json", import.meta.url)));
const rule = (id) => data.rules.find((r) => r.id === id);
const f = (id, a, d) => feeFor(rule(id), a, d);
test("CBE to wallet: 2,000 = 10 + VAT = 11.50; 15,000 = 17.25", () => { assert.equal(f("cbe-telebirr", 2000), 11.5); assert.equal(f("cbe-telebirr", 15000), 17.25); });
test("BOA to wallet carries 15% VAT (BOA page): 2,000 = 11.50", () => assert.equal(f("boa-telebirr", 2000), 11.5));
test("Siinqee to wallet 0.2%: 2,000 = 4; 20,000 = 30", () => { assert.equal(f("siinqee-telebirr", 2000), 4); assert.equal(f("siinqee-telebirr", 20000), 30); });
test("Siinqee to another bank: 2,000 = 10; 10,000 = 30", () => { assert.equal(f("siinqee-otherbank", 2000), 10); assert.equal(f("siinqee-otherbank", 10000), 30); });
test("telebirr cash-out: 4,000 = 12; 25,000 = 22; above 75,000 = no route", () => { assert.equal(f("telebirr-cashout", 4000), 12); assert.equal(f("telebirr-cashout", 25000), 22); assert.equal(f("telebirr-cashout", 80000), null); });
test("telebirr P2P (official page): 3,000 = 6; to bank 3,000 = 9", () => { assert.equal(f("telebirr-p2p", 3000), 6); assert.equal(f("telebirr-bank", 3000), 9); });
test("CBE ATM 0.35% + VAT: 2,000 = 8.05; branch free to 1,000, then 5 + VAT", () => { assert.equal(f("cbe-atm", 2000), 8.05); assert.equal(f("cbe-branch", 1000), 0); assert.equal(f("cbe-branch", 3000), 5.75); });
test("BOA branch: free to 2,000; 3,000 = 5 + VAT = 5.75", () => { assert.equal(f("boa-branch", 2000), 0); assert.equal(f("boa-branch", 3000), 5.75); });
test("Amhara to telebirr: 5 + VAT = 5.75, limit 5,000", () => { assert.equal(f("amhara-telebirr", 2000), 5.75); assert.equal(f("amhara-telebirr", 6000), null); });
test("CBE Birr to branch is free", () => assert.equal(f("cbebirr-branch", 5000), 0));
test("a rule is inactive before its effective date", () => assert.equal(f("cbe-telebirr", 2000, "2023-01-01"), null));
test("cheapest way into telebirr for 2,000 is Siinqee", () => assert.equal(findRoutes(data, "telebirr", 2000)[0].path[0].rule.from, "siinqee"));
test("cheapest bank-to-agent-cash for 2,000 costs 14", () => assert.equal(findRoutes(data, "agent_cash", 2000)[0].total, 14));
test("route search can start at a chosen node and use several targets", () => {
  assert.equal(findRoutes(data, "telebirr_other", 3000, undefined, 3, "telebirr")[0].total, 6);
  assert.equal(findRoutes(data, ["agent_cash", "branch_cash", "atm_cash"], 3000, undefined, 3, "boa")[0].total, 5.75);
});
test("unverified rules are never used", () => {
  const d2 = { ...data, rules: data.rules.map((r) => (r.id === "siinqee-telebirr" ? { ...r, verified: false } : r)) };
  assert.notEqual(findRoutes(d2, "telebirr", 2000)[0].path[0].rule.from, "siinqee");
});
test("every rule is verified, dated and sourced", () => data.rules.forEach((r) => { assert.equal(r.verified, true); assert.match(r.last_checked, /^\d{4}-\d{2}-\d{2}$/); assert.match(r.source_url, /^https:/); }));
import { explainNoRoute, daysSince } from "../fee.js";
test("CBE branch cash uses the official tariff PDF: 11.50 for 20,000", () => assert.equal(f("cbe-branch", 20000), 11.5));
test("Dashen: to telebirr 2,000 = 5; to another bank 2,000 = 8; ATM 2,000 = 7; branch free", () => { assert.equal(f("dashen-telebirr", 2000), 5); assert.equal(f("dashen-otherbank", 2000), 8); assert.equal(f("dashen-atm", 2000), 7); assert.equal(f("dashen-branch", 2000), 0); });
test("explainNoRoute: unsupported pair vs amount out of range vs ok", () => {
  assert.equal(explainNoRoute(data, "cbebirr", 2000, "boa"), "combo");
  assert.equal(explainNoRoute(data, "agent_cash", 80000, "telebirr"), "amount");
  assert.equal(explainNoRoute(data, "telebirr", 2000, "dashen"), null);
});
test("daysSince counts whole days", () => { assert.equal(daysSince("2026-10-11", Date.parse("2026-11-10T12:00:00Z")), 30); assert.equal(daysSince("2026-10-11", Date.parse("2026-10-11T08:00:00Z")), 0); });
