const r = (n) => Math.round(n * 100) / 100;
// Total birr needed to buy `usd` at the bank's selling `rate`, plus the bank's FX fee (% of the birr amount).
export function fxCost(usd, rate, bank) {
  const base = usd * rate, fee = (base * bank.fee_pct) / 100;
  return { base: r(base), fee: r(fee), total: r(base + fee), fee_pct: bank.fee_pct };
}
