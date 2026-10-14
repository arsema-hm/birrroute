import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../ask.js";
import { fxCost } from "../fx.js";
import { addBusinessDays, complaintDraft } from "../help.js";

const cases = [
  ["send 5000 from cbe to telebirr", { intent: "route", target: "telebirr", amount: 5000, bank: "cbe" }],
  ["cheapest way to get cash 2000 birr", { intent: "route", target: "cash", amount: 2000 }],
  ["i need 3,000 birr cash from agent", { intent: "route", target: "agent_cash", amount: 3000 }],
  ["usd 5000 at 160 dashen", { intent: "fx", amount: 5000, rate: 160, bank: "dashen" }],
  ["how much for 2000 dollars rate 158.5 awash", { intent: "fx", amount: 2000, rate: 158.5, bank: "awash" }],
  ["my transfer failed and money was deducted", { intent: "help" }],
  ["wrong recipient refund", { intent: "help" }],
  ["move 12000 birr to wallet", { intent: "route", target: "telebirr", amount: 12000 }],
  ["boa to telebirr 800", { intent: "route", target: "telebirr", amount: 800, bank: "boa" }],
  ["abyssinia 10000 telebirr", { intent: "route", amount: 10000, bank: "boa" }],
  ["hello", { intent: "unknown" }],
];
test("question parser: every evaluation case is understood", () => {
  let ok = 0;
  for (const [q, want] of cases) {
    const got = parse(q);
    const pass = Object.entries(want).every(([k, v]) => got[k] === v);
    if (pass) ok++; else console.log("FAILED:", q, got);
  }
  console.log(`parser accuracy: ${ok}/${cases.length}`);
  assert.equal(ok, cases.length);
});
test("fx: 5,000 USD at 160 with 4% fee = 832,000 birr", () =>
  assert.deepEqual(fxCost(5000, 160, { fee_pct: 4 }), { base: 800000, fee: 32000, total: 832000, fee_pct: 4 }));
test("10 business days after Fri 9 Oct 2026 is Fri 23 Oct 2026", () =>
  assert.equal(addBusinessDays("2026-10-09", 10), "2026-10-23"));
test("complaint draft includes reference and amount", () => {
  const t = complaintDraft({ provider: "CBE", date: "2026-10-09", amount: 2000, reference: "FT123", description: "money deducted" });
  assert.match(t, /FT123/); assert.match(t, /2000 birr/);
});

test("parser: other bank, CBE Birr, more banks", () => {
  assert.equal(parse("send 5000 from siinqee to another bank").target, "other_bank");
  assert.equal(parse("send 500 to cbe birr").target, "cbebirr");
  assert.equal(parse("cash 1000 from nib").bank, "nib"); assert.equal(parse("atm 2000 cbe").target, "atm_cash"); assert.equal(parse("branch 3000 boa").target, "branch_cash");
});
