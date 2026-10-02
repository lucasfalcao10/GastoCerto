import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiCall, getMe } from "@/lib/_core/api";

export type EntryType = "expense" | "income";
export type PaymentMethod = "credit" | "debit" | "pix" | "cash";
export type ConnectionStatus = "demo" | "pending" | "connected";
export type FinanceEntry = { id: string; type: EntryType; amount: number; date: string; description: string; category: string; paymentMethod: PaymentMethod; source: "manual" | "c6" | "import"; installment?: { current: number; total: number } };
export type FinancePlan = { income: number; budgets: Record<string, number> };
export type FinanceUser = { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; lastSignedIn: string };

type FinanceState = { entries: FinanceEntry[]; plan: FinancePlan; connection: ConnectionStatus; lastSyncAt: string | null; newPurchases: number };
type FinanceSnapshot = { entries: FinanceEntry[]; plan: FinancePlan | null; connection: { status: "pending" | "connected" | "error"; lastSyncAt: string | null } | null };
const STORAGE_KEY = "gastocerto.finance.v1";
export const MONTH_KEY = new Date().toISOString().slice(0, 7);
export const TODAY_KEY = new Date().toISOString().slice(0, 10);
export const CATEGORIES = ["Alimentação", "Transporte", "Casa", "Lazer", "Saúde", "Compras"];
export const ALL_CATEGORIES = [...CATEGORIES, "Renda"];
export const CATEGORY_ICONS: Record<string, string> = { Alimentação: "restaurant-outline", Transporte: "car-outline", Casa: "home-outline", Lazer: "game-controller-outline", Saúde: "heart-outline", Compras: "bag-handle-outline" };

const demoEntries: FinanceEntry[] = [
  { id: "c6-1", type: "expense", amount: 168.4, date: "2026-10-02", description: "Pão de Açúcar", category: "Alimentação", paymentMethod: "credit", source: "c6" },
  { id: "c6-2", type: "expense", amount: 89.9, date: "2026-10-01", description: "Uber", category: "Transporte", paymentMethod: "credit", source: "c6" },
  { id: "c6-3", type: "expense", amount: 249.9, date: "2026-09-29", description: "Streaming + jogos", category: "Lazer", paymentMethod: "credit", source: "c6" },
  { id: "manual-1", type: "expense", amount: 1350, date: "2026-10-01", description: "Aluguel", category: "Casa", paymentMethod: "pix", source: "manual" },
  { id: "manual-2", type: "expense", amount: 520, date: "2026-09-30", description: "Plano de saúde", category: "Saúde", paymentMethod: "debit", source: "manual" },
  { id: "income-1", type: "income", amount: 9800, date: "2026-10-01", description: "Salário", category: "Renda", paymentMethod: "debit", source: "manual" },
  { id: "c6-4", type: "expense", amount: 320.5, date: "2026-09-28", description: "Mercado do mês", category: "Alimentação", paymentMethod: "credit", source: "c6" },
];
const initialState: FinanceState = { entries: demoEntries, plan: { income: 9800, budgets: { Alimentação: 900, Transporte: 500, Casa: 2200, Lazer: 600, Saúde: 700, Compras: 700 } }, connection: "demo", lastSyncAt: null, newPurchases: 0 };

type FinanceContextValue = FinanceState & { hydrated: boolean; backendConnected: boolean; user: FinanceUser | null; addEntry: (entry: Omit<FinanceEntry, "id" | "source"> & { source?: FinanceEntry["source"] }) => void; updateEntry: (id: string, entry: Partial<FinanceEntry>) => void; deleteEntry: (id: string) => void; updatePlan: (plan: FinancePlan) => void; syncDemo: () => void; importCsv: (csv: string) => number; setConnection: (status: ConnectionStatus) => void };
const FinanceContext = createContext<FinanceContextValue | null>(null);
function makeId(prefix = "entry") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function entryPayload(entry: Partial<FinanceEntry>) { return { type: entry.type, amountCents: entry.amount === undefined ? undefined : Math.round(entry.amount * 100), entryDate: entry.date, description: entry.description, category: entry.category, paymentMethod: entry.paymentMethod, source: entry.source, installmentCurrent: entry.installment?.current ?? null, installmentTotal: entry.installment?.total ?? null }; }
function mergeEntries(local: FinanceEntry[], remote: FinanceEntry[]) { return Array.from(new Map([...local, ...remote].map((entry) => [entry.id, entry])).values()); }

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [user, setUser] = useState<FinanceUser | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try { const raw = await AsyncStorage.getItem(STORAGE_KEY); if (raw && active) setState({ ...initialState, ...JSON.parse(raw) }); } catch { /* local cache is optional */ }
      try {
        const currentUser = await getMe();
        if (!active || !currentUser) return;
        setUser(currentUser as FinanceUser);
        const remote = await apiCall<FinanceSnapshot>(`/api/finance/bootstrap?monthKey=${MONTH_KEY}`);
        if (!active) return;
        setState((current) => ({ ...current, entries: mergeEntries(current.entries, remote.entries || []), plan: remote.plan || current.plan, connection: remote.connection?.status === "connected" ? "connected" : remote.connection?.status === "pending" ? "pending" : current.connection, lastSyncAt: remote.connection?.lastSyncAt || current.lastSyncAt }));
        setBackendConnected(true);
      } catch { setBackendConnected(false); }
      finally { if (active) setHydrated(true); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined); }, [hydrated, state]);

  const value = useMemo<FinanceContextValue>(() => ({
    ...state, hydrated, backendConnected, user,
    addEntry: (entry) => {
      const temp = { ...entry, id: makeId(), source: entry.source ?? "manual" } as FinanceEntry;
      setState((current) => ({ ...current, entries: [temp, ...current.entries] }));
      if (backendConnected) void apiCall<FinanceEntry>("/api/finance/entries", { method: "POST", body: JSON.stringify(entryPayload(temp)) }).then((saved) => setState((current) => ({ ...current, entries: current.entries.map((item) => item.id === temp.id ? saved : item) }))).catch(() => undefined);
    },
    updateEntry: (id, entry) => {
      setState((current) => ({ ...current, entries: current.entries.map((item) => item.id === id ? { ...item, ...entry } : item) }));
      if (backendConnected && id.startsWith("server-")) void apiCall<FinanceEntry>(`/api/finance/entries/${id}`, { method: "PATCH", body: JSON.stringify(entryPayload(entry)) }).catch(() => undefined);
    },
    deleteEntry: (id) => {
      setState((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== id) }));
      if (backendConnected && id.startsWith("server-")) void apiCall(`/api/finance/entries/${id}`, { method: "DELETE" }).catch(() => undefined);
    },
    updatePlan: (plan) => {
      setState((current) => ({ ...current, plan }));
      if (backendConnected) void apiCall("/api/finance/plan", { method: "PUT", body: JSON.stringify({ monthKey: MONTH_KEY, income: plan.income, budgets: plan.budgets }) }).catch(() => undefined);
    },
    syncDemo: () => setState((current) => { const fresh: FinanceEntry = { id: makeId("c6"), type: "expense", amount: 74.9, date: TODAY_KEY, description: "Café Cultura", category: "Alimentação", paymentMethod: "credit", source: "c6" }; return { ...current, entries: [fresh, ...current.entries], connection: "pending", lastSyncAt: new Date().toISOString(), newPurchases: 1 }; }),
    importCsv: (csv) => {
      const parseAmount = (value: string) => { const clean = value.trim().replace(/R\$\s?/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."); return Number(clean) || 0; };
      const parseDate = (value: string) => { const trimmed = value.trim(); if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) { const [day, month, year] = trimmed.split("/"); return `${year}-${month}-${day}`; } if (/^\d{8}/.test(trimmed)) return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`; return trimmed.slice(0, 10) || TODAY_KEY; };
      const parseCsvLine = (line: string) => { const parts: string[] = []; let current = ""; let quoted = false; for (const char of line) { if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { parts.push(current.trim()); current = ""; } else current += char; } parts.push(current.trim()); return parts; };
      const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<\\r\\n]+)`, "i"))?.[1]?.trim() || "";
      const ofxBlocks = csv.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>)/gi) || [];
      const rawRows = ofxBlocks.length ? ofxBlocks.map((block) => [tag(block, "DTPOSTED"), tag(block, "NAME") || tag(block, "MEMO"), tag(block, "TRNAMT"), ""]) : csv.trim().split(/\r?\n/).filter(Boolean).map(parseCsvLine);
      const first = rawRows[0]?.join(" ").toLowerCase() || ""; const rows = first.includes("data") || first.includes("date") || first.includes("descri") ? rawRows.slice(1) : rawRows;
      const imported = rows.filter((parts) => parts.length >= 3).map((parts) => { const amountValue = parseAmount(parts[2]); return { id: makeId("import"), type: (amountValue < 0 ? "expense" : "income") as EntryType, amount: Math.abs(amountValue), date: parseDate(parts[0]), description: parts[1] || "Importado do C6", category: ALL_CATEGORIES.includes(parts[3]) ? parts[3] : "Compras", paymentMethod: "credit" as PaymentMethod, source: "import" as const }; });
      if (imported.length) { setState((current) => ({ ...current, entries: [...imported, ...current.entries], connection: "pending", lastSyncAt: new Date().toISOString() })); if (backendConnected) imported.forEach((entry) => void apiCall("/api/finance/entries", { method: "POST", body: JSON.stringify(entryPayload(entry)) }).catch(() => undefined)); }
      return imported.length;
    },
    setConnection: (connection) => { setState((current) => ({ ...current, connection })); if (backendConnected && connection !== "demo") void apiCall("/api/finance/connection", { method: "PUT", body: JSON.stringify({ status: connection }) }).catch(() => undefined); },
  }), [backendConnected, hydrated, state, user]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
export function useFinance() { const value = useContext(FinanceContext); if (!value) throw new Error("useFinance must be used inside FinanceProvider"); return value; }
export function isCurrentMonth(date: string) { return date.startsWith(MONTH_KEY); }
export function formatBRL(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
export function formatCompactBRL(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
export function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""); }
export function paymentLabel(method: PaymentMethod) { return { credit: "Crédito", debit: "Débito", pix: "Pix", cash: "Dinheiro" }[method]; }
