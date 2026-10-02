import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { CATEGORY_ICONS, formatBRL, type FinanceEntry } from "@/lib/finance-store";

export const palette = {
  bg: "#0D1112", surface: "#151B1D", surfaceAlt: "#1C2426", border: "#2B3536", text: "#F3F7F0", muted: "#93A09B", lime: "#C7F36B", limeSoft: "#263322", amber: "#F7C66A", amberSoft: "#352B1A", coral: "#FF8C7A", coralSoft: "#382321", blue: "#8AD8F2", white: "#FFFFFF",
};

type IconName = keyof typeof Ionicons.glyphMap;
export function Icon({ name, size = 20, color = palette.muted }: { name: IconName | string; size?: number; color?: string }) {
  return <Ionicons name={name as IconName} size={size} color={color} />;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
    <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: palette.lime, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: palette.bg, fontSize: 21, fontWeight: "900", transform: [{ rotate: "-15deg" }] }}>↗</Text>
    </View>
    {!compact && <Text style={{ color: palette.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }}>Gasto<Text style={{ color: palette.lime }}>Certo</Text></Text>}
  </View>;
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 13 }}>
    <View>
      {eyebrow && <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>{eyebrow}</Text>}
      <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}>{title}</Text>
    </View>
    {action && <Pressable onPress={onAction} hitSlop={8}><Text style={{ color: palette.lime, fontWeight: "700", fontSize: 13 }}>{action}</Text></Pressable>}
  </View>;
}

export function Pill({ children, tone = "muted" }: { children: string; tone?: "muted" | "lime" | "amber" | "coral" }) {
  const colors = { muted: [palette.surfaceAlt, palette.muted], lime: [palette.limeSoft, palette.lime], amber: [palette.amberSoft, palette.amber], coral: [palette.coralSoft, palette.coral] }[tone];
  return <View style={{ backgroundColor: colors[0], borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: colors[1], fontSize: 11, fontWeight: "700" }}>{children}</Text></View>;
}

export function PrimaryButton({ label, icon, onPress, disabled = false }: { label: string; icon?: string; onPress?: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ({ backgroundColor: disabled ? palette.surfaceAlt : palette.lime, borderRadius: 15, minHeight: 50, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, opacity: pressed ? 0.78 : disabled ? 0.5 : 1 })}>
    {icon && <Icon name={icon} size={18} color={palette.bg} />}
    <Text style={{ color: palette.bg, fontSize: 14, fontWeight: "800" }}>{label}</Text>
  </Pressable>;
}

export function SecondaryButton({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: palette.surfaceAlt, borderColor: palette.border, borderWidth: 1, borderRadius: 15, minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: pressed ? 0.7 : 1 })}>
    {icon && <Icon name={icon} size={17} color={palette.lime} />}
    <Text style={{ color: palette.text, fontSize: 13, fontWeight: "700" }}>{label}</Text>
  </Pressable>;
}

export function ProgressBar({ value, color = palette.lime, height = 7 }: { value: number; color?: string; height?: number }) {
  return <View style={{ height, borderRadius: height, overflow: "hidden", backgroundColor: palette.surfaceAlt }}><View style={{ height, borderRadius: height, width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }} /></View>;
}

export function EntryRow({ entry, onPress, onDelete }: { entry: FinanceEntry; onPress?: () => void; onDelete?: () => void }) {
  const positive = entry.type === "income";
  return <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", paddingVertical: 12, opacity: pressed ? 0.72 : 1 })}>
    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: positive ? palette.limeSoft : palette.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: 11 }}><Icon name={positive ? "arrow-down-outline" : CATEGORY_ICONS[entry.category] || "receipt-outline"} color={positive ? palette.lime : palette.text} size={20} /></View>
    <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: palette.text, fontWeight: "700", fontSize: 14 }}>{entry.description}</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>{entry.category} · {entry.paymentMethod === "credit" ? "C6 Crédito" : entry.paymentMethod === "pix" ? "Pix" : entry.paymentMethod === "debit" ? "Débito" : "Dinheiro"}</Text></View>
    <View style={{ alignItems: "flex-end", marginLeft: 8 }}><Text style={{ color: positive ? palette.lime : palette.text, fontSize: 14, fontWeight: "800" }}>{positive ? "+" : "−"}{formatBRL(entry.amount)}</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>{entry.date.slice(8, 10)}/{entry.date.slice(5, 7)}</Text></View>
  </Pressable>;
}

export function Surface({ children, style }: { children: React.ReactNode; style?: ViewStyle }) { return <View style={[{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.border, padding: 16 }, style]}>{children}</View>; }

export function EmptyState({ title, body, icon = "sparkles-outline" }: { title: string; body: string; icon?: string }) { return <View style={{ alignItems: "center", padding: 30, gap: 10 }}><Icon name={icon} size={28} color={palette.lime} /><Text style={{ color: palette.text, fontWeight: "800", fontSize: 16 }}>{title}</Text><Text style={{ color: palette.muted, textAlign: "center", lineHeight: 20 }}>{body}</Text></View>; }
