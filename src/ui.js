import { createContext, useContext, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, FlatList, Platform, Image } from "react-native";

export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export const shadow = Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 3 }, default: {} });
export const COLORS = { green: "#0B7A4B", gold: "#F5B800", red: "#D6342C" };

export function Logo({ size = 44 }) {
  return <Image source={require("../assets/logo.png")} style={{ width: size, height: size, borderRadius: size * 0.27 }} />;
}
export function Card({ children, style, hero }) { const { c } = useApp(); return <View style={[{ backgroundColor: hero ? c.ac : c.card, borderRadius: 20, padding: 16, marginBottom: 12 }, shadow, style]}>{children}</View>; }
export function Title({ children }) { const { c } = useApp(); return <Text style={{ color: c.fg, fontSize: 19, fontWeight: "800", marginBottom: 10 }}>{children}</Text>; }
export function Mut({ children, style }) { const { c } = useApp(); return <Text style={[{ color: c.mut, lineHeight: 21 }, style]}>{children}</Text>; }
export function Wrap({ children }) { return <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{children}</View>; }
export function Chip({ on, label, onPress }) {
  const { c } = useApp();
  return <Pressable onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: on ? c.ac : c.ln, backgroundColor: on ? c.ac : "transparent", marginRight: 8, marginBottom: 8 }}><Text style={{ color: on ? c.on : c.fg, fontWeight: "700" }}>{label}</Text></Pressable>;
}
export function Field(p) { const { c } = useApp(); return <TextInput placeholderTextColor={c.mut} {...p} style={[{ borderWidth: 1.5, borderColor: c.ln, borderRadius: 14, padding: 13, color: c.fg, fontSize: 17, marginBottom: 8, backgroundColor: c.card }, p.style]} />; }
export function Btn({ label, onPress, ghost, color }) {
  const { c } = useApp(); const col = color || c.ac;
  return <Pressable onPress={onPress} style={{ backgroundColor: ghost ? "transparent" : col, borderWidth: ghost ? 1.5 : 0, borderColor: col, paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 8 }}><Text style={{ color: ghost ? col : c.on, fontWeight: "800", fontSize: 16 }}>{label}</Text></Pressable>;
}
export function Picker({ value, options, onChange, placeholder, title }) {
  const { c, t } = useApp(); const [open, setOpen] = useState(false), [q, setQ] = useState("");
  const cur = options.find((o) => o.id === value);
  const list = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  return <>
    <Pressable onPress={() => setOpen(true)} style={{ borderWidth: 2, borderColor: c.ac, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center", backgroundColor: c.card }}>
      <Text style={{ color: cur ? c.fg : c.mut, fontSize: 17, fontWeight: "700", flex: 1 }}>{cur ? cur.label : placeholder}</Text><Text style={{ color: c.ac, fontSize: 20 }}>▾</Text></Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: Platform.OS === "web" ? 12 : 48 }}>
        <View style={{ padding: 16 }}><Text style={{ color: c.fg, fontSize: 21, fontWeight: "800", marginBottom: 10 }}>{title}</Text><Field value={q} onChangeText={setQ} placeholder={t("search")} /></View>
        <FlatList data={list} keyExtractor={(o) => String(o.id)} keyboardShouldPersistTaps="handled" renderItem={({ item }) => (
          <Pressable onPress={() => { onChange(item.id); setOpen(false); setQ(""); }} style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: c.ln, backgroundColor: item.id === value ? c.ac + "22" : "transparent", opacity: item.dim ? 0.6 : 1 }}>
            <Text style={{ color: c.fg, fontSize: 16, fontWeight: "700" }}>{item.label}</Text>{item.sub ? <Text style={{ color: item.dim ? c.mut : c.ac, fontSize: 12, marginTop: 2 }}>{item.sub}</Text> : null}</Pressable>)} />
        <View style={{ padding: 16 }}><Btn ghost label={t("back")} onPress={() => { setOpen(false); setQ(""); }} /></View>
      </View>
    </Modal></>;
}
