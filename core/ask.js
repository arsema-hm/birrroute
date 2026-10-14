const BANKS = { cbe: ["cbe", "commercial"], boa: ["boa", "abyssinia"], siinqee: ["siinqee", "sinqee"], dashen: ["dashen"], awash: ["awash"], abay: ["abay"], lion: ["lion"], omo: ["omo"], rammis: ["rammis"], shabelle: ["shabelle"], sidama: ["sidama"], siket: ["siket"], tsehay: ["tsehay"], dbe: ["development"], addis: ["addis"], berhan: ["berhan"], bunna: ["bunna"], enat: ["enat"], nib: ["nib"], hibret: ["hibret"], wegagen: ["wegagen"], zemen: ["zemen"], tsedey: ["tsedey"], zamzam: ["zamzam"], goh: ["goh"], amhara: ["amhara"], ahadu: ["ahadu"], hijra: ["hijra"], gadaa: ["gadaa"], oromia: ["oromia"], global: ["global"], coop: ["cooperative"] };
// Rule-based question parser. Returns {intent, amount, target, bank, rate}.
export function parse(text) {
  const q = text.toLowerCase();
  const rm = q.match(/(?:rate|at|@)\s*(\d+(?:\.\d+)?)/), rate = rm ? Number(rm[1]) : null;
  const amount = [...q.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, ""))).find((v) => v !== rate) ?? null;
  const bank = Object.keys(BANKS).find((b) => BANKS[b].some((a) => new RegExp(`\\b${a}\\b`).test(q))) ?? null;
  let intent = "unknown", target = null;
  if (/fail|deduct|refund|wrong|stuck|scam/.test(q)) intent = "help";
  else if (/\b(usd|dollars?|fx|import)\b|\$/.test(q)) intent = "fx";
  else if (/\batm\b/.test(q)) { intent = "route"; target = "atm_cash"; }
  else if (/branch/.test(q)) { intent = "route"; target = "branch_cash"; }
  else if (/agent/.test(q)) { intent = "route"; target = "agent_cash"; }
  else if (/cash|withdraw/.test(q)) { intent = "route"; target = "cash"; }
  else if (/cbe ?birr/.test(q)) { intent = "route"; target = "cbebirr"; }
  else if (/other bank|another bank|bank account/.test(q)) { intent = "route"; target = "other_bank"; }
  else if (/telebirr|wallet/.test(q)) { intent = "route"; target = "telebirr"; }
  return { intent, amount, target, bank, rate };
}
