// Live dollar rates. Source for banks: ET-Forex public API (published bank boards). Official NBE rate: AllRatesToday open API.
// API wording: side "buy" = YOU buy dollars (bank's selling rate, lower is better); side "sell" = YOU sell dollars (bank's buying rate, higher is better).
export const RANKING_URL = "https://api.et-forex.com/api/v1/rates/ranking?currency=USD";
export const NBE_URL = "https://allratestoday.com/api/open/central-bank/nbe?source=USD&target=ETB";
export const FX_FEE_PCT = 4; // NBE caps total FX fees at 4%
export const CODE_TO_ID = { CBE: "cbe", DSH: "dashen", CBO: "coop", NIB: "nib", AWS: "awash", AHB: "ahadu", BOA: "boa", RMB: "rammis", ENT: "enat", SIK: "siket", HJR: "hijra", AIB: "addis", TSD: "tsedey", AMH: "amhara", GBB: "goh", BRN: "berhan", ZZB: "zamzam", SID: "sidama", ZEM: "zemen", HIB: "hibret", BUN: "bunna", ABB: "abay", OMO: "omo", SIN: "siinqee", DGB: "global", TSH: "tsehay", DBE: "dbe", GAD: "gadaa", WEG: "wegagen", ORO: "oromia" };
const r2 = (n) => Math.round(n * 100) / 100;

export function parseRanking(json) {
  const d = json?.data;
  if (!d || !Array.isArray(d.rankings)) throw new Error("Unexpected rates response");
  const banks = {};
  for (const col of d.rankings) for (const r of col.ranks) {
    const id = CODE_TO_ID[r.bankCode] ?? String(r.bankCode).toLowerCase();
    const b = (banks[id] ??= { id, name: r.bankName });
    const t = (b[col.type] ??= {});
    t.date = r.effectiveDate; t.stale = !!r.isStale;
    if (col.side === "sell") t.get = Number(r.rate); else t.pay = Number(r.rate);
  }
  return { asOf: d.asOf, effectiveDate: d.effectiveDate, banks: Object.values(banks) };
}
export function parseNbe(json) {
  const rows = (json?.rates ?? []).filter((r) => r.base === "USD"), g = (t) => rows.find((r) => r.type === t)?.value;
  if (g("buy") == null) throw new Error("Unexpected NBE response");
  return { date: json.rate_date, buy: g("buy"), sell: g("sell"), reference: g("reference") ?? g("buy") };
}
// A rate is suspect if it is far from NBE's official rate, or if you would "get" more than you "pay".
export function isSuspect(t, nbeRef, tol = 0.05) {
  if (!t || t.get == null || t.pay == null) return true;
  return Math.abs(t.get - nbeRef) / nbeRef > tol || Math.abs(t.pay - nbeRef) / nbeRef > tol || t.get > t.pay;
}
// mode "sell" = I have dollars; mode "buy" = I need dollars. type = "cash" | "transactional".
export function rank(banks, { type, mode, usd, nbeRef }) {
  const good = [], stale = [], suspect = [], missing = [];
  for (const b of banks) {
    const t = b[type];
    if (!t || t.get == null || t.pay == null) { missing.push(b); continue; }
    if (isSuspect(t, nbeRef)) { suspect.push({ ...b, ...t }); continue; }
    const rate = mode === "sell" ? t.get : t.pay;
    const row = { id: b.id, name: b.name, rate, date: t.date, birr: r2(mode === "sell" ? rate * usd : rate * usd * (1 + FX_FEE_PCT / 100)), spreadPct: r2(((t.pay - t.get) / t.get) * 100) };
    (t.stale ? stale : good).push(row);
  }
  const cmp = mode === "sell" ? (a, b) => b.rate - a.rate : (a, b) => a.rate - b.rate;
  good.sort(cmp); stale.sort(cmp);
  return { ranked: good, stale, suspect, missing };
}
export function checkQuote(ranked, mode, quote, usd) {
  const best = ranked[0].rate;
  const worse = ranked.filter((r) => (mode === "sell" ? r.rate < quote : r.rate > quote)).length;
  const gap = mode === "sell" ? (best - quote) * usd : (quote - best) * usd;
  return { percentBetter: Math.round((100 * worse) / ranked.length), gap: r2(Math.max(0, gap)) };
}
export const watchHit = (ranked, mode, target) => ranked.find((r) => (mode === "sell" ? r.rate >= target : r.rate <= target)) ?? null;
export const rankOf = (ranked, id) => { const i = ranked.findIndex((r) => r.id === id); return i < 0 ? null : i + 1; };
export const ageHours = (iso, nowMs = Date.now()) => (nowMs - new Date(iso).getTime()) / 3600000;
export const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
