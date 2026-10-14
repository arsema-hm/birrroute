import { useState, useEffect } from "react";
import { View, ScrollView, Text, Pressable, Share, Linking, Modal, Platform, RefreshControl, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import fees0 from "./core/data/fees.json";
import fx0 from "./core/data/fx.json";
import rules0 from "./core/data/rules.json";
import { findRoutes, explainNoRoute, daysSince } from "./core/fee.js";
import { RANKING_URL, NBE_URL, parseRanking, parseNbe, rank, checkQuote, watchHit, rankOf, ageHours, median } from "./core/rates.js";
import { parse } from "./core/ask.js";
import { addBusinessDays, complaintDraft } from "./core/help.js";
import { asOf, searchTopics } from "./core/rules.js";
import { tr, KEYS, LANGS, COMING } from "./core/i18n.js";
import { Ctx, useApp, Logo, Card, Title, Mut, Wrap, Chip, Field, Btn, Picker, COLORS } from "./src/ui.js";


const FEEDBACK_EMAIL = "arsemabella96@gmail.com"; // where "Report a wrong fee" emails go
const REMOTE_URL = "https://raw.githubusercontent.com/arsema-hm/birrroute-data/refs/heads/main/data.json";                          // optional https URL of {fees, fx, rules} JSON to update fees without a new release

const D = { fees: fees0, fx: fx0, rules: rules0 };
const today = () => new Date().toISOString().slice(0, 10);
const birr = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const fmtTime = (iso) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const hasData = (id) => D.fees.rules.some((r) => r.from === id && r.verified !== false);
const load = async (k, d) => { try { const v = await AsyncStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => AsyncStorage.setItem(k, JSON.stringify(v)).catch(() => {});
const fetchJson = async (url) => { const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 10000); try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); } finally { clearTimeout(to); } };
const bankName = (id, fb) => D.fx.banks.find((b) => b.id === id)?.name ?? fb ?? id;
const bankList = () => D.fees.nodes.filter((n) => n.type === "bank").sort((a, b) => hasData(b.id) - hasData(a.id) || a.name.localeCompare(b.name));
const DESTS = [
  { id: "any", icon: "💵", color: "#F5B800", key: "d_any", targets: ["atm_cash", "branch_cash", "agent_cash"] },
  { id: "atm", icon: "🏧", color: "#0B7A4B", key: "n_atm_cash", targets: ["atm_cash"] },
  { id: "branch", icon: "🏦", color: "#3B6FD8", key: "n_branch_cash", targets: ["branch_cash"] },
  { id: "agent", icon: "🧑‍💼", color: "#E67E22", key: "n_agent_cash", targets: ["agent_cash"] },
  { id: "telebirr", icon: "📱", color: "#16A09A", key: "d_telebirr", targets: ["telebirr"] },
  { id: "cbebirr", icon: "👛", color: "#8E44AD", key: "d_cbebirr", targets: ["cbebirr"] },
  { id: "bank", icon: "🏛️", color: "#D6342C", key: "d_bank", targets: ["other_bank"] },
];
const targetsFor = (d, from) => (d.id === "telebirr" && from === "telebirr" ? ["telebirr_other"] : d.targets);

function Launch() {
  return <View style={{ flex: 1, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" }}>
    <Logo size={132} /><Text style={{ color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 18 }}>BirrRoute</Text>
    <View style={{ flexDirection: "row", marginTop: 14 }}>{["#078930", "#FCDD09", "#DA121A"].map((c) => <View key={c} style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: c, marginHorizontal: 3 }} />)}</View>
  </View>;
}

function Result({ targets, amount, fromId, alts, onAlt }) {
  const { c, t } = useApp();
  const nm = (id) => (KEYS.includes("n_" + id) ? t("n_" + id) : D.fees.nodes.find((n) => n.id === id)?.name ?? id);
  if (!(amount > 0)) return null;
  const tryInstead = alts && alts.length > 0 && <><Mut style={{ marginTop: 8, fontWeight: "700" }}>{t("try_instead")}</Mut><Wrap>{alts.map((a) => <Chip key={a.id} label={a.label} onPress={() => onAlt(a)} />)}</Wrap></>;
  if (fromId && !hasData(fromId)) return <Card><Text style={{ color: c.fg, fontSize: 16, fontWeight: "700" }}>🔎 {t("no_bank", { b: nm(fromId) })}</Text>{tryInstead}</Card>;
  const list = findRoutes(D.fees, targets, amount, undefined, 3, fromId);
  if (!list.length) { const why = explainNoRoute(D.fees, targets, amount, fromId);
    return <Card><Text style={{ color: c.fg, fontSize: 16, fontWeight: "700" }}>🔎 {why === "amount" ? t("no_route_amt") : t("no_route_combo", { a: fromId ? nm(fromId) : "—" })}</Text>{tryInstead}</Card>; }
  const b = list[0];
  const oldest = Math.max(...b.path.map((p) => daysSince(p.rule.last_checked)));
  const path = [nm(b.path[0].rule.from), ...b.path.map((p) => nm(p.rule.to))].join(" → ");
  const summary = `BirrRoute: ${birr(amount)} birr · ${path} · ${b.total ? birr(b.total) + " birr fee" : "free"}`;
  const report = () => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("BirrRoute: wrong fee")}&body=${encodeURIComponent(summary + "\n\nWhat is wrong:\n")}`);
  return <>
    <Card hero>
      <Text style={{ color: c.on, opacity: 0.85, fontWeight: "800", letterSpacing: 1 }}>✅ {t("best")}</Text>
      <Text style={{ color: c.on, fontSize: 36, fontWeight: "900", marginVertical: 4 }}>{b.total === 0 ? t("free") : t("fee_is", { n: birr(b.total) })}</Text>
      <Text style={{ color: c.on, opacity: 0.92 }}>{t("to_move", { a: birr(amount) })}{b.total ? ` (${((b.total / amount) * 100).toFixed(2)}%)` : ""}</Text>
      <View style={{ height: 1, backgroundColor: c.on, opacity: 0.3, marginVertical: 12 }} />
      {b.path.map((p, i) => <View key={i} style={{ flexDirection: "row", marginBottom: 6 }}><Text style={{ color: c.on, flex: 1, fontWeight: "600" }}>{i + 1}. {nm(p.rule.from)} → {nm(p.rule.to)}</Text><Text style={{ color: c.on, fontWeight: "800" }}>{p.fee === 0 ? t("free") : birr(p.fee)}</Text></View>)}
    </Card>
    {oldest > 45 && <Card style={{ borderWidth: 2, borderColor: c.warn }}><Text style={{ color: c.warn, fontWeight: "800" }}>⚠ {t("fee_old", { n: oldest })}</Text></Card>}
    <Card>
      <Title>{t("sure")}</Title>
      {b.path.map((p, i) => <View key={i} style={{ marginBottom: 6 }}><Text style={{ color: c.fg }}>✔ {t("checked", { d: p.rule.last_checked })} · {p.rule.includes_vat === false ? t("incl_vat") : t("as_pub")}</Text>
        <Text onPress={() => Linking.openURL(p.rule.source_url)} style={{ color: c.ac, fontWeight: "700" }}>{t("source")}: {p.rule.source_url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</Text></View>)}
      <Btn ghost label={t("share")} onPress={() => Share.share({ message: summary })} />
      <Btn ghost color={c.warn} label={t("report")} onPress={report} />
    </Card>
    {list.length > 1 && <Card><Title>{t("other_ways")}</Title>{list.slice(1, 6).map((r, i) => <Text key={i} style={{ color: c.fg, marginBottom: 6 }}>{birr(r.total)} · <Text style={{ color: c.mut }}>{[nm(r.path[0].rule.from), ...r.path.map((p) => nm(p.rule.to))].join(" → ")}</Text></Text>)}</Card>}
  </>;
}

export default function App() {
  const system = useColorScheme();
  const [themePref, setThemePref] = useState("auto");
  const dark = themePref === "auto" ? system === "dark" : themePref === "dark";
  const c = dark ? { bg: "#0f1512", card: "#1a211d", fg: "#f1f5f2", mut: "#9db0a6", ln: "#2c3832", ac: "#3dbe82", on: "#04210f", warn: "#f0a84a" }
                 : { bg: "#eef5f0", card: "#ffffff", fg: "#12241a", mut: "#566a5e", ln: "#d9e5dd", ac: COLORS.green, on: "#ffffff", warn: "#b45f06" };
  const [booting, setBooting] = useState(true);
  const [lang, setLang] = useState("en"), [langOpen, setLangOpen] = useState(false), [trustOpen, setTrustOpen] = useState(false), [, tick] = useState(0);
  const t = (k, v) => tr(lang, k, v);
  const nm = (id) => (KEYS.includes("n_" + id) ? t("n_" + id) : D.fees.nodes.find((n) => n.id === id)?.name ?? id);
  const [tab, setTab] = useState("usd"), [welcome, setWelcome] = useState(true);
  const [rates, setRates] = useState({ status: "loading" }), [refreshing, setRefreshing] = useState(false);
  const [usd, setUsd] = useState("1000"), [usdMode, setUsdMode] = useState("sell"), [rateType, setRateType] = useState("cash"), [quote, setQuote] = useState(""), [showAll, setShowAll] = useState(false);
  const [myBank, setMyBank] = useState(null), [watch, setWatch] = useState(null), [watchIn, setWatchIn] = useState("");
  const [step, setStep] = useState(1), [done, setDone] = useState(false), [amt, setAmt] = useState("2000"), [from, setFrom] = useState(null), [dest, setDest] = useState(DESTS[0]);
  const [askMode, setAskMode] = useState(false), [q, setQ] = useState(""), [ask, setAsk] = useState(null);
  const [items, setItems] = useState([]), [aAmt, setAAmt] = useState("5000"), [aTimes, setATimes] = useState("4"), [aFrom, setAFrom] = useState("cbe"), [aDest, setADest] = useState("telebirr");
  const [asDate, setAsDate] = useState(today()), [rq, setRq] = useState("");
  const [form, setForm] = useState(false), [h, setH] = useState({ provider: "", date: today(), amount: "", reference: "", description: "" }), [cases, setCases] = useState([]);

  const loadRates = async () => {
    try {
      const [a, n] = await Promise.all([fetchJson(RANKING_URL), fetchJson(NBE_URL).catch(() => null)]);
      const snap = { ...parseRanking(a), nbe: n ? (() => { try { return parseNbe(n); } catch { return null; } })() : null, fetchedAt: new Date().toISOString() };
      setRates({ status: "live", ...snap }); save("ratesCache", snap);
    } catch {
      const cached = await load("ratesCache", null);
      setRates(cached ? { status: "saved", ...cached } : { status: "error" });
    }
  };
  useEffect(() => { const to = setTimeout(() => setBooting(false), 1500); return () => clearTimeout(to); }, []);
  useEffect(() => { (async () => {
    setLang(await load("lang", "en")); setThemePref(await load("theme", "auto")); setItems(await load("audit", [])); setCases(await load("cases", []));
    setMyBank(await load("myBank", null)); setWatch(await load("watch", null));
    loadRates();
    const apply = (j) => { if (j?.fees?.version >= fees0.version) { D.fees = j.fees; if (j.fx?.banks) D.fx = j.fx; if (j.rules?.topics) D.rules = j.rules; tick((n) => n + 1); } };
    const cached = await load("remote", null); if (cached) apply(cached);
    if (REMOTE_URL) { try { const j = await fetchJson(REMOTE_URL); if (j?.fees?.rules && j?.fx?.banks) { apply(j); save("remote", j); } } catch {} }
  })(); }, []);
  const putItems = (n) => { setItems(n); save("audit", n); }, putCases = (n) => { setCases(n); save("cases", n); };
  const pickLang = (code) => { setLang(code); save("lang", code); setLangOpen(false); }, pickTheme = (p) => { setThemePref(p); save("theme", p); };
  const onRefresh = async () => { setRefreshing(true); await loadRates(); setRefreshing(false); };

  const fromOptions = [{ id: "all", label: t("compare_all") }, { id: "telebirr", label: t("my_telebirr"), sub: "✓ " + t("has_fees") }, { id: "cbebirr", label: t("my_cbebirr"), sub: "✓ " + t("has_fees") },
    ...bankList().map((b) => ({ id: b.id, label: b.name, sub: hasData(b.id) ? "✓ " + t("has_fees") : t("not_added"), dim: !hasData(b.id) }))];
  const fromLabel = fromOptions.find((o) => o.id === (from ?? "all"))?.label;
  const destLabel = (d) => t(d.key);
  const askTargets = ask?.target === "cash" ? DESTS[0].targets : [ask?.target];
  const sendOptions = [{ id: "telebirr", label: t("my_telebirr") }, { id: "cbebirr", label: t("my_cbebirr") }, ...bankList().filter((b) => hasData(b.id)).map((b) => ({ id: b.id, label: b.name }))];
  const destOptions = DESTS.map((d) => ({ id: d.id, label: destLabel(d) }));
  const reset = () => { setStep(1); setDone(false); setAsk(null); setAskMode(false); };
  const amtN = Number(amt) > 0 ? Number(amt) : 0;
  const availability = DESTS.map((d) => { const ok = findRoutes(D.fees, targetsFor(d, from), amtN, undefined, 3, from).length > 0; return { d, ok, why: ok ? null : explainNoRoute(D.fees, targetsFor(d, from), amtN, from) }; });
  const alts = availability.filter((a) => a.ok && a.d.id !== dest.id).map((a) => ({ id: a.d.id, label: destLabel(a.d), d: a.d }));
  const row = (it) => { const d = DESTS.find((x) => x.id === it.dest), tg = targetsFor(d, it.from);
    const mine = findRoutes(D.fees, tg, it.amount, undefined, 3, it.from)[0], best = findRoutes(D.fees, tg, it.amount, undefined, 3, null)[0];
    return { mine, best, yearly: mine && best ? Math.max(0, (mine.total - best.total) * it.times * 12) : null }; };
  const rows = items.map((it) => ({ it, ...row(it) })), totalSave = rows.reduce((s, r) => s + (r.yearly ?? 0), 0);
  const dueOf = (d) => addBusinessDays(isDate(d) ? d : today(), 10);

  const usdN = Number(usd) > 0 ? Number(usd) : 0;
  const haveRates = !!rates.banks;
  const nbeRef = rates.nbe?.reference ?? median((rates.banks ?? []).map((b) => b.transactional?.get ?? b.cash?.get).filter(Boolean));
  const res = rank(rates.banks ?? [], { type: rateType, mode: usdMode, usd: usdN || 1, nbeRef });
  const best = res.ranked[0], worst = res.ranked[res.ranked.length - 1];
  const shown = showAll ? res.ranked : res.ranked.slice(0, 5);
  const noRate = haveRates ? D.fx.banks.filter((b) => !rates.banks.some((x) => x.id === b.id)).map((b) => b.name).concat(res.missing.map((b) => bankName(b.id, b.name))) : [];
  const qc = res.ranked.length && Number(quote) > 0 ? checkQuote(res.ranked, usdMode, Number(quote), usdN || 1) : null;
  const wres = haveRates && watch ? rank(rates.banks, { type: watch.type, mode: watch.mode, usd: 1, nbeRef }) : null;
  const hit = wres ? watchHit(wres.ranked, watch.mode, watch.target) : null;
  const myPos = myBank ? rankOf(res.ranked, myBank) : null;
  const ageH = rates.status === "saved" ? ageHours(rates.fetchedAt) : 0;
  const TabBtn = ({ id, icon }) => <Pressable onPress={() => setTab(id)} style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}><Text style={{ fontSize: 22 }}>{icon}</Text><Text numberOfLines={1} style={{ fontSize: 10.5, color: tab === id ? c.ac : c.mut, fontWeight: tab === id ? "800" : "500" }}>{t("tab_" + id)}</Text></Pressable>;
  const hdrBtn = { borderWidth: 1.5, borderColor: c.ac, borderRadius: 18, paddingVertical: 5, paddingHorizontal: 9, marginLeft: 6 };

  if (booting) return <Launch />;
  return (
    <Ctx.Provider value={{ c, t, lang }}>
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: Platform.OS === "web" ? 0 : 34 }}>
      <View style={{ flexDirection: "row", height: 5 }}><View style={{ flex: 1, backgroundColor: "#078930" }} /><View style={{ flex: 1, backgroundColor: "#FCDD09" }} /><View style={{ flex: 1, backgroundColor: "#DA121A" }} /></View>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
        <Logo size={46} /><View style={{ flex: 1, marginLeft: 12 }}><Text style={{ color: c.fg, fontSize: 24, fontWeight: "900" }}>BirrRoute</Text><Text numberOfLines={2} style={{ color: c.mut, fontSize: 12 }}>{t("tag")}</Text></View>
        <Pressable onPress={() => setTrustOpen(true)} style={hdrBtn}><Text style={{ fontSize: 17 }}>ℹ️</Text></Pressable>
        <Pressable onPress={() => pickTheme(dark ? "light" : "dark")} style={hdrBtn}><Text style={{ fontSize: 17 }}>{dark ? "☀️" : "🌙"}</Text></Pressable>
        <Pressable onPress={() => setLangOpen(true)} style={[hdrBtn, { paddingVertical: 6 }]}><Text style={{ color: c.ac, fontWeight: "800" }}>🌐 {lang.toUpperCase()}</Text></Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled" refreshControl={tab === "usd" ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.ac} /> : undefined}>

        {tab === "usd" && <>
          {hit && <Card style={{ backgroundColor: COLORS.gold }}><Text style={{ color: "#3b2d00", fontWeight: "800" }}>{t("watch_hit", { b: bankName(hit.id, hit.name), r: hit.rate })}</Text></Card>}
          <Card><Title>💵 {t("dollar_title")}</Title>
            <Wrap><Chip label={t("usd_have")} on={usdMode === "sell"} onPress={() => setUsdMode("sell")} /><Chip label={t("usd_needm")} on={usdMode === "buy"} onPress={() => setUsdMode("buy")} /></Wrap>
            <Wrap><Chip label={t("rt_cash")} on={rateType === "cash"} onPress={() => setRateType("cash")} /><Chip label={t("rt_trans")} on={rateType === "transactional"} onPress={() => setRateType("transactional")} /></Wrap>
            <Field keyboardType="numeric" value={usd} onChangeText={setUsd} style={{ fontSize: 34, fontWeight: "900", textAlign: "center" }} />
            <Wrap>{[100, 500, 1000, 5000, 10000].map((v) => <Chip key={v} label={"$" + birr(v)} on={usdN === v} onPress={() => setUsd(String(v))} />)}</Wrap></Card>
          {rates.status === "loading" && <Card><Text style={{ color: c.fg, fontWeight: "700" }}>⏳ {t("loading")}</Text></Card>}
          {rates.status === "error" && <Card><Text style={{ color: c.fg, fontWeight: "700" }}>📡 {t("no_rates")}</Text><Btn label={t("retry")} onPress={onRefresh} /></Card>}
          {haveRates && best && usdN > 0 && <Card hero>
            <Text style={{ color: c.on, opacity: 0.9, fontWeight: "800", letterSpacing: 1 }}>✅ {t("best_tag")} · {bankName(best.id, best.name)}</Text>
            <Text style={{ color: c.on, fontSize: 36, fontWeight: "900", marginVertical: 4 }}>{usdMode === "sell" ? t("you_get", { n: birr(best.birr) }) : t("you_pay", { n: birr(best.birr) })}</Text>
            <Text style={{ color: c.on, opacity: 0.92 }}>1 $ = {best.rate}</Text>
            {res.ranked.length > 1 && <Text style={{ color: c.on, fontWeight: "700", marginTop: 6 }}>{usdMode === "sell" ? t("gain_vs_low", { n: birr(best.birr - worst.birr) }) : t("save_vs_high", { n: birr(worst.birr - best.birr) })}</Text>}
          </Card>}
          {haveRates && res.ranked.length > 0 && <Card><Title>{usdMode === "sell" ? t("rank_sell") : t("rank_buy")}</Title>
            {shown.map((r, i) => <View key={r.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.ln }}>
              <Text style={{ color: i === 0 ? c.ac : c.mut, fontWeight: "900", width: 26 }}>{i + 1}</Text>
              <View style={{ flex: 1 }}><Text style={{ color: c.fg, fontWeight: "700" }}>{bankName(r.id, r.name)}</Text><Text style={{ color: c.mut, fontSize: 12 }}>1 $ = {r.rate} · spread {r.spreadPct}%</Text></View>
              <Text style={{ color: i === 0 ? c.ac : c.fg, fontWeight: "800" }}>{birr(r.birr)}</Text></View>)}
            {res.ranked.length > 5 && <Chip label={showAll ? "▲" : t("show_all") + " (" + res.ranked.length + ")"} onPress={() => setShowAll(!showAll)} />}
            {usdMode === "buy" && <Mut style={{ fontSize: 12, marginTop: 6 }}>{t("usd_fee")}</Mut>}</Card>}
          {haveRates && <Card><Title>{t("my_bank")}</Title>
            <Picker value={myBank} options={D.fx.banks.map((b) => ({ id: b.id, label: b.name }))} onChange={(id) => { setMyBank(id); save("myBank", id); }} title={t("my_bank")} placeholder={t("my_bank")} />
            {myPos && <Text style={{ color: c.fg, fontWeight: "800", marginTop: 8 }}>{t("my_rank", { n: myPos, m: res.ranked.length })}</Text>}</Card>}
          {haveRates && <Card><Title>{t("quote_title")}</Title><Field keyboardType="numeric" value={quote} onChangeText={setQuote} placeholder={t("quote_ph")} />
            {qc && <><Text style={{ color: c.fg, fontWeight: "800" }}>{t("quote_better", { p: qc.percentBetter })}</Text><Mut>{qc.gap === 0 ? t("quote_ok") : usdMode === "sell" ? t("quote_less", { n: birr(qc.gap) }) : t("quote_more", { n: birr(qc.gap) })}</Mut></>}</Card>}
          {haveRates && <Card><Title>🎯 {t("watch_title")}</Title>
            <Field keyboardType="numeric" value={watchIn} onChangeText={setWatchIn} placeholder={t("watch_ph") + " (" + (usdMode === "sell" ? "≥" : "≤") + ")"} />
            <Mut style={{ fontSize: 12 }}>{t("watch_note")}{watch ? `  ${watch.mode === "sell" ? "≥" : "≤"} ${watch.target}` : ""}</Mut>
            <Btn label={t("fees_add")} onPress={() => { const target = Number(watchIn); if (target > 0) { const w = { target, mode: usdMode, type: rateType }; setWatch(w); save("watch", w); setWatchIn(""); } }} />
            {watch && <Btn ghost label={t("remove")} onPress={() => { setWatch(null); save("watch", null); }} />}</Card>}
          {haveRates && <Card>
            <Text style={{ color: rates.status === "live" ? c.ac : c.warn, fontWeight: "800" }}>{rates.status === "live" ? "● " + t("live_now", { t: fmtTime(rates.asOf) }) : "○ " + t("saved_at", { t: fmtTime(rates.fetchedAt) })}</Text>
            {ageH > 24 && <Text style={{ color: c.warn, marginTop: 4, fontWeight: "700" }}>⚠ {t("stale")}</Text>}
            {res.stale.length > 0 && <Mut style={{ marginTop: 4, fontSize: 12 }}>{t("stale_banks", { l: res.stale.map((b) => bankName(b.id, b.name) + " (" + b.date.slice(5) + ")").join(", ") })}</Mut>}
            {res.suspect.map((r) => <Text key={r.id} style={{ color: c.warn, marginTop: 4 }}>⚠ {t("outlier", { b: bankName(r.id, r.name), r: r.get + " / " + r.pay })}</Text>)}
            {noRate.length > 0 && <Mut style={{ marginTop: 4, fontSize: 12 }}>{t("no_rate", { l: noRate.join(", ") })}</Mut>}
            {rates.nbe && <Mut style={{ marginTop: 4, fontSize: 12 }}>NBE {rates.nbe.date}: {rates.nbe.buy} / {rates.nbe.sell}</Mut>}
            <Text onPress={() => Linking.openURL("https://et-forex.com")} style={{ color: c.ac, fontWeight: "700", marginTop: 6 }}>{t("source")}: ET-Forex</Text>
            <Text onPress={() => Linking.openURL("https://allratestoday.com/central-bank-rates-api/nbe/")} style={{ color: c.ac, fontWeight: "700" }}>{t("source")}: NBE via AllRatesToday</Text></Card>}
        </>}

        {tab === "home" && !done && !askMode && <>
          <View style={{ flexDirection: "row", marginBottom: 6 }}>{[COLORS.green, COLORS.gold, COLORS.red].map((col, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, marginRight: 6, backgroundColor: i + 1 <= step ? col : c.ln }} />)}</View>
          <Mut style={{ marginBottom: 10, fontWeight: "700" }}>{t("step", { n: step })}</Mut>
          {step === 1 && <>
            {welcome && <Card style={{ borderWidth: 2, borderColor: c.ac }}><Text style={{ color: c.fg, fontWeight: "800", fontSize: 17 }}>👋 {t("welcome_t")}</Text><Mut style={{ marginVertical: 6 }}>{t("welcome_b")}</Mut><Pressable onPress={() => setWelcome(false)}><Text style={{ color: c.ac, fontWeight: "800" }}>{t("got_it")}</Text></Pressable></Card>}
            <Card><Title>{t("q_amount")}</Title><Field keyboardType="numeric" value={amt} onChangeText={setAmt} style={{ fontSize: 32, fontWeight: "900", textAlign: "center" }} />
              <Wrap>{[500, 1000, 5000, 10000, 20000].map((v) => <Chip key={v} label={birr(v)} on={Number(amt) === v} onPress={() => setAmt(String(v))} />)}</Wrap></Card>
            <Btn label={t("next") + " →"} onPress={() => Number(amt) > 0 && setStep(2)} />
            <Btn ghost label={"💬 " + t("ask_link")} onPress={() => setAskMode(true)} />
          </>}
          {step === 2 && <>
            <Card><Title>{t("q_from")}</Title><Picker value={from ?? "all"} options={fromOptions} onChange={(id) => setFrom(id === "all" ? null : id)} title={t("choose_bank")} placeholder={t("choose_bank")} /></Card>
            <Btn label={t("next") + " →"} onPress={() => setStep(3)} /><Btn ghost label={"← " + t("back")} onPress={() => setStep(1)} />
          </>}
          {step === 3 && <>
            <Title>{t("q_to")}</Title>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {availability.map(({ d, ok, why }) => <Pressable key={d.id} disabled={!ok && why === "combo"} onPress={() => { setDest(d); setDone(true); }} style={{ width: "48%", backgroundColor: c.card, borderRadius: 20, padding: 14, marginBottom: 12, borderTopWidth: 5, borderTopColor: d.color, minHeight: 112, opacity: ok ? 1 : why === "combo" ? 0.45 : 0.8 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: d.color + "33", alignItems: "center", justifyContent: "center", marginBottom: 8 }}><Text style={{ fontSize: 24 }}>{d.icon}</Text></View>
                <Text style={{ color: c.fg, fontWeight: "800", fontSize: 15 }}>{destLabel(d)}</Text>{!ok && why === "combo" && <Text style={{ color: c.mut, fontSize: 11, marginTop: 2 }}>{t("not_avail")}</Text>}</Pressable>)}
            </View>
            <Btn ghost label={"← " + t("back")} onPress={() => setStep(2)} />
          </>}
        </>}
        {tab === "home" && askMode && !done && <>
          <Card><Title>💬 {t("ask_link")}</Title><Field value={q} onChangeText={setQ} placeholder='e.g. "cash 3000 from boa"' returnKeyType="search" onSubmitEditing={() => setAsk(parse(q))} /><Mut style={{ fontSize: 12 }}>{t("ask_note")}</Mut><Btn label={t("search")} onPress={() => setAsk(parse(q))} /></Card>
          {ask?.intent === "route" && (ask.amount ? <Result targets={askTargets} amount={ask.amount} fromId={ask.bank} /> : <Mut>2000?</Mut>)}
          {ask?.intent === "fx" && <Btn label={t("tab_usd") + " →"} onPress={() => { setTab("usd"); reset(); }} />}
          {ask?.intent === "help" && <Btn label={t("tab_help") + " →"} onPress={() => { setTab("help"); reset(); }} />}
          {ask?.intent === "unknown" && <Mut>?</Mut>}
          <Btn ghost label={"← " + t("back")} onPress={reset} />
        </>}
        {tab === "home" && done && <>
          <Card><Text style={{ color: c.fg, fontSize: 18, fontWeight: "800" }}>{birr(amt)} birr</Text><Mut>{fromLabel} → {destLabel(dest)}</Mut><Wrap><Chip label={"✎ " + t("change")} onPress={() => { setDone(false); setStep(1); }} /></Wrap></Card>
          <Result targets={targetsFor(dest, from)} amount={amtN} fromId={from} alts={alts} onAlt={(a) => setDest(a.d)} />
          <Btn ghost label={t("start_over")} onPress={reset} />
        </>}

        {tab === "fees" && <>
          <Card><Title>{t("fees_title")}</Title><Mut style={{ marginBottom: 10 }}>{t("fees_intro")}</Mut>
            <Field keyboardType="numeric" value={aAmt} onChangeText={setAAmt} placeholder={t("q_amount")} /><Field keyboardType="numeric" value={aTimes} onChangeText={setATimes} placeholder={t("fees_times")} />
            <Mut style={{ fontWeight: "700", marginBottom: 4 }}>{t("from_l")}</Mut><Picker value={aFrom} options={sendOptions} onChange={setAFrom} title={t("from_l")} placeholder={t("from_l")} />
            <Mut style={{ fontWeight: "700", marginVertical: 4 }}>{t("to_l")}</Mut><Picker value={aDest} options={destOptions} onChange={setADest} title={t("to_l")} placeholder={t("to_l")} />
            <Btn label={t("fees_add")} onPress={() => { const amount = Number(aAmt), times = Number(aTimes); if (amount > 0 && times > 0) putItems([...items, { id: Date.now(), amount, times, from: aFrom, dest: aDest }]); }} /></Card>
          {rows.length > 0 && <Card hero><Text style={{ color: c.on, fontWeight: "800", letterSpacing: 1 }}>{t("fees_save")}</Text><Text style={{ color: c.on, fontSize: 34, fontWeight: "900" }}>{birr(totalSave)}</Text><Text style={{ color: c.on }}>{t("per_year")}</Text></Card>}
          {rows.map(({ it, mine, best: bst, yearly }) => <Card key={it.id}><Text style={{ color: c.fg, fontWeight: "800" }}>{birr(it.amount)} × {it.times} · {nm(it.from)} → {destLabel(DESTS.find((x) => x.id === it.dest))}</Text>
            {mine ? <Mut>{t("now_cheapest", { a: birr(mine.total), b: birr(bst.total) })}{"\n"}{yearly > 0 ? `${birr(yearly)} ${t("per_year")}` : t("already_best")}</Mut> : <Mut>{t("no_route")}</Mut>}
            <Pressable onPress={() => putItems(items.filter((x) => x.id !== it.id))}><Text style={{ color: c.warn, fontWeight: "800", marginTop: 6 }}>{t("remove")}</Text></Pressable></Card>)}
        </>}

        {tab === "rules" && <>
          <Card><Title>{t("rules_title")}</Title><Mut style={{ marginBottom: 8 }}>{t("rules_pick")}</Mut><Field value={asDate} onChangeText={setAsDate} placeholder="YYYY-MM-DD" />
            <Wrap>{[[t("today"), today()], ["2025-01-01", "2025-01-01"], ["2025-06-01", "2025-06-01"], ["2026-03-01", "2026-03-01"]].map(([l, d]) => <Chip key={d} label={l} on={asDate === d} onPress={() => setAsDate(d)} />)}</Wrap>
            <Field value={rq} onChangeText={setRq} placeholder={t("search")} />{!isDate(asDate) && <Text style={{ color: c.warn }}>{t("date_fmt")}</Text>}</Card>
          {isDate(asDate) && searchTopics(D.rules, rq).map((tp) => { const then = asOf(tp, asDate), now = asOf(tp, today()), src = now ?? then ?? tp.values[0]; return <Card key={tp.id}>
            <Text style={{ color: c.fg, fontWeight: "800", marginBottom: 4 }}>{tp.title}</Text>
            {then ? <Mut>{t("on_date", { d: asDate })} {then.text}</Mut> : <Mut>{t("no_data_before", { d: tp.values[0].from })}</Mut>}
            {now && now !== then && <Text style={{ color: c.warn, marginTop: 6, lineHeight: 21 }}>{t("changed_on", { d: now.from })} {now.text}</Text>}
            <Text onPress={() => Linking.openURL(src.source_url)} style={{ color: c.ac, fontWeight: "700", marginTop: 6 }}>{t("source")}: {src.source_name}</Text></Card>; })}
          <Mut style={{ fontSize: 12 }}>{t("rules_note")}</Mut>
        </>}

        {tab === "help" && <>
          <Card><Title>{t("help_title")}</Title><Mut>{t("help_steps")}</Mut></Card>
          {!form && <Btn label={"✍️ " + t("complaint_btn")} onPress={() => setForm(true)} />}
          {form && <Card>{[["provider", "f_provider"], ["date", "f_date"], ["amount", "f_amount"], ["reference", "f_ref"], ["description", "f_what"]].map(([k, l]) => <Field key={k} value={h[k]} onChangeText={(v) => setH({ ...h, [k]: v })} placeholder={t(l)} multiline={k === "description"} />)}
            {h.provider !== "" && <><Text style={{ color: c.fg, lineHeight: 22, marginVertical: 8 }}>{complaintDraft(h)}</Text><Text style={{ color: c.warn }}>{t("nbe_after", { d: dueOf(h.date) })}</Text>
              <Btn label={t("share_btn")} onPress={() => Share.share({ message: complaintDraft(h) })} /><Btn ghost label={t("save_case")} onPress={() => putCases([...cases, { ...h, id: Date.now(), due: dueOf(h.date), done: false }])} /></>}</Card>}
          {cases.length > 0 && <Title>{t("my_cases")}</Title>}
          {cases.map((k) => <Card key={k.id}><Text style={{ color: c.fg, fontWeight: "800" }}>{k.provider} · {k.amount} · {k.reference}</Text><Mut>{k.done ? "✔ " + t("resolved") : t("open_from", { d: k.due })}</Mut>
            <Wrap><Chip label={k.done ? t("mark_open") : t("mark_resolved")} onPress={() => putCases(cases.map((x) => (x.id === k.id ? { ...x, done: !x.done } : x)))} /><Chip label={t("delete")} onPress={() => putCases(cases.filter((x) => x.id !== k.id))} /></Wrap></Card>)}
        </>}
        <Mut style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>{t("data_updated", { d: D.fees.updated })}{"\n"}{t("disclaimer")}</Mut>
      </ScrollView>
      <View style={{ flexDirection: "row", backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.ln, paddingBottom: Platform.OS === "ios" ? 18 : 6 }}>
        <TabBtn id="usd" icon="💲" /><TabBtn id="home" icon="🔀" /><TabBtn id="fees" icon="🧾" /><TabBtn id="rules" icon="📜" /><TabBtn id="help" icon="🆘" />
      </View>
      <Modal visible={langOpen} animationType="slide" onRequestClose={() => setLangOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg, padding: 16, paddingTop: Platform.OS === "web" ? 16 : 52 }}>
          <Title>🌐 {t("lang")}</Title>
          {LANGS.map((l) => <Pressable key={l.code} onPress={() => pickLang(l.code)} style={{ padding: 16, borderRadius: 14, marginBottom: 8, borderWidth: 2, borderColor: lang === l.code ? c.ac : c.ln, backgroundColor: c.card }}><Text style={{ color: c.fg, fontSize: 18, fontWeight: "800" }}>{l.label}</Text></Pressable>)}
          <Mut style={{ marginTop: 8 }}>{t("lang_note")}</Mut><Mut style={{ marginTop: 8 }}>{t("more_langs")}: {COMING.join(", ")}</Mut>
          <Btn ghost label={t("close")} onPress={() => setLangOpen(false)} />
        </View>
      </Modal>
      <Modal visible={trustOpen} animationType="slide" onRequestClose={() => setTrustOpen(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingTop: Platform.OS === "web" ? 16 : 52 }}>
          <Title>ℹ️ {t("trust_title")}</Title>
          <Card><Mut>{t("trust_body")}</Mut></Card>
          <Card>
            <Mut>{t("rates_as_of", { d: haveRates ? (rates.asOf ? fmtTime(rates.asOf) : "—") : "—", s: "ET-Forex" })}</Mut>
            <Mut>NBE: {rates.nbe ? `${rates.nbe.date} · ${rates.nbe.buy} / ${rates.nbe.sell}` : "—"}</Mut>
            <Mut>Fees: {D.fees.rules.length} rules · {new Set(D.fees.rules.map((r) => r.from)).size} providers · {t("data_updated", { d: D.fees.updated })}</Mut>
            <Text onPress={() => Linking.openURL("https://et-forex.com")} style={{ color: c.ac, fontWeight: "700", marginTop: 6 }}>ET-Forex</Text>
            <Text onPress={() => Linking.openURL("https://allratestoday.com/central-bank-rates-api/nbe/")} style={{ color: c.ac, fontWeight: "700" }}>AllRatesToday (NBE)</Text></Card>
          <Btn ghost label={t("close")} onPress={() => setTrustOpen(false)} />
        </ScrollView>
      </Modal>
    </View></Ctx.Provider>);
}
