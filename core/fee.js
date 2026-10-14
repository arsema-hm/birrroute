// BirrRoute fee engine: pure functions, no dependencies.
const round = (n) => Math.round(n * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

export function activeOn(rule, date = today()) {
  return rule.effective_from <= date && (!rule.effective_to || date <= rule.effective_to);
}

// Fee in birr for sending `amount` through one rule, or null if the rule
// doesn't apply (wrong date, outside limits, or no tier covers the amount).
export function feeFor(rule, amount, date = today()) {
  if (!activeOn(rule, date)) return null;
  if (amount < rule.min_amount || amount > rule.max_amount) return null;
  const tier = rule.tiers.find((t) => amount <= t.up_to);
  if (!tier) return null;
  let fee = (tier.flat ?? 0) + (amount * (tier.pct ?? 0)) / 100;
  if (rule.includes_vat === false) fee *= 1 + (rule.vat_rate ?? 0.15);
  return round(fee);
}

// All routes from any bank to `target`, cheapest first.
export function findRoutes(data, target, amount, date = today(), maxHops = 3, from = null) {
  const targets = [].concat(target);
  const out = [];
  const walk = (node, path, total) => {
    if (targets.includes(node)) return out.push({ path, total: round(total) });
    if (path.length >= maxHops) return;
    for (const rule of data.rules.filter((r) => r.from === node && r.verified !== false)) {
      if (path.some((p) => p.rule.to === rule.to)) continue;
      const fee = feeFor(rule, amount, date);
      if (fee !== null) walk(rule.to, [...path, { rule, fee }], total + fee);
    }
  };
  (from ? [{ id: from }] : data.nodes.filter((n) => n.type === "bank")).forEach((n) => walk(n.id, [], 0));
  return out.sort((a, b) => a.total - b.total);
}

// Why is there no route? "combo" = this provider/option pair has no published fee; "amount" = the amount is outside the allowed range.
export function explainNoRoute(data, target, amount, from = null, date = today()) {
  if (findRoutes(data, target, amount, date, 3, from).length) return null;
  return findRoutes(data, target, 100, date, 3, from).length ? "amount" : "combo";
}

// Days since a YYYY-MM-DD date (used to warn when a fee has not been re-checked for a while).
export const daysSince = (dateStr, nowMs = Date.now()) => Math.max(0, Math.floor((nowMs - Date.parse(dateStr + "T00:00:00Z")) / 86400000));
