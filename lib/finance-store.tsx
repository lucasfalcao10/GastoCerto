import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type EntryType = "expense" | "income";
export type PaymentMethod = "credit" | "debit" | "pix" | "cash";
export type ConnectionStatus = "demo" | "pending" | "connected";

export type FinanceEntry = {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  description: string;
  category: string;
  paymentMethod: PaymentMethod;
  source: "manual" | "c6" | "import";
  installment?: { current: number; total: number };
};

export type FinancePlan = {
  income: number;
  budgets: Record<string, number>;
};

type FinanceState = {
  entries: FinanceEntry[];
  plan: FinancePlan;
  connection: ConnectionStatus;
  lastSyncAt: string | null;
  newPurchases: number;
};

const STORAGE_KEY = "gastocerto.finance.v1";
export const MONTH_KEY = new Date().toISOString().slice(0, 7);
export const TODAY_KEY = new Date().toISOString().slice(0, 10);
export const CATEGORIES = ["Alimentação", "Transporte", "Casa", "Lazer", "Saúde", "Compras"];
export const ALL_CATEGORIES = [...CATEGORIES, "Renda"];
export const CATEGORY_ICONS: Record<string, string> = {
  Alimentação: "restaurant-outline",
  Transporte: "car-outline",
  Casa: "home-outline",
  Lazer: "game-controller-outline",
  Saúde: "heart-outline",
  Compras: "bag-handle-outline",
};

const demoEntries: FinanceEntry[] = [
  { id: "c6-1", type: "expense", amount: 168.4, date: "2026-10-02", description: "Pão de Açúcar", category: "Alimentação", paymentMethod: "credit", source: "c6" },
  { id: "c6-2", type: "expense", amount: 89.9, date: "2026-10-01", description: "Uber", category: "Transporte", paymentMethod: "credit", source: "c6" },
  { id: "c6-3", type: "expense", amount: 249.9, date: "2026-09-29", description: "Streaming + jogos", category: "Lazer", paymentMethod: "credit", source: "c6" },
  { id: "manual-1", type: "expense", amount: 1350, date: "2026-10-01", description: "Aluguel", category: "Casa", paymentMethod: "pix", source: "manual" },
  { id: "manual-2", type: "expense", amount: 520, date: "2026-09-30", description: "Plano de saúde", category: "Saúde", paymentMethod: "debit", source: "manual" },
  { id: "income-1", type: "income", amount: 9800, date: "2026-10-01", description: "Salário", category: "Renda", paymentMethod: "debit", source: "manual" },
  { id: "c6-4", type: "expense", amount: 320.5, date: "2026-09-28", description: "Mercado do mês", category: "Alimentação", paymentMethod: "credit", source: "c6" },
];

const initialState: FinanceState = {
  entries: demoEntries,
  plan: {
    income: 9800,
    budgets: { Alimentação: 900, Transporte: 500, Casa: 2200, Lazer: 600, Saúde: 700, Compras: 700 },
  },
  connection: "demo",
  lastSyncAt: null,
  newPurchases: 0,
};

type FinanceContextValue = FinanceState & {
  hydrated: boolean;
  addEntry: (entry: Omit<FinanceEntry, "id" | "source"> & { source?: FinanceEntry["source"] }) => void;
  updateEntry: (id: string, entry: Partial<FinanceEntry>) => void;
  deleteEntry: (id: string) => void;
  updatePlan: (plan: FinancePlan) => void;
  syncDemo: () => void;
  importCsv: (csv: string) => number;
  setConnection: (status: ConnectionStatus) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function makeId(prefix = "entry") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...initialState, ...JSON.parse(raw) });
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  const value = useMemo<FinanceContextValue>(() => ({
    ...state,
    hydrated,
    addEntry: (entry) => setState((current) => ({ ...current, entries: [{ ...entry, id: makeId(), source: entry.source ?? "manual" }, ...current.entries] })),
    updateEntry: (id, entry) => setState((current) => ({ ...current, entries: current.entries.map((item) => item.id === id ? { ...item, ...entry } : item) })),
    deleteEntry: (id) => setState((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== id) })),
    updatePlan: (plan) => setState((current) => ({ ...current, plan })),
    syncDemo: () => setState((current) => {
      const fresh: FinanceEntry = { id: makeId("c6"), type: "expense", amount: 74.9, date: TODAY_KEY, description: "Café Cultura", category: "Alimentação", paymentMethod: "credit", source: "c6" };
      return { ...current, entries: [fresh, ...current.entries], connection: "pending", lastSyncAt: new Date().toISOString(), newPurchases: 1 };
    }),
    importCsv: (csv) => {
      const parseAmount = (value: string) => { const clean = value.trim().replace(/R\$\s?/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."); return Number(clean) || 0; };
      const parseDate = (value: string) => { const trimmed = value.trim(); if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) { const [day, month, year] = trimmed.split("/"); return `${year}-${month}-${day}`; } if (/^\d{8}/.test(trimmed)) return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`; return trimmed.slice(0, 10) || TODAY_KEY; };
      const parseCsvLine = (line: string) => { const parts: string[] = []; let current = ""; let quoted = false; for (const char of line) { if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { parts.push(current.trim()); current = ""; } else current += char; } parts.push(current.trim()); return parts; };
      const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<\\r\\n]+)`, "i"))?.[1]?.trim() || "";
      const ofxBlocks = csv.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>)/gi) || [];
      const rawRows = ofxBlocks.length ? ofxBlocks.map((block) => [tag(block, "DTPOSTED"), tag(block, "NAME") || tag(block, "MEMO"), tag(block, "TRNAMT"), ""]) : csv.trim().split(/\r?\n/).filter(Boolean).map(parseCsvLine);
      const first = rawRows[0]?.join(" ").toLowerCase() || "";
      const rows = first.includes("data") || first.includes("date") || first.includes("descri") ? rawRows.slice(1) : rawRows;
      const imported = rows.filter((parts) => parts.length >= 3).map((parts) => { const amountValue = parseAmount(parts[2]); const category = ALL_CATEGORIES.includes(parts[3]) ? parts[3] : "Compras"; return { id: makeId("import"), type: (amountValue < 0 ? "expense" : "income") as EntryType, amount: Math.abs(amountValue), date: parseDate(parts[0]), description: parts[1] || "Importado do C6", category, paymentMethod: "credit" as PaymentMethod, source: "import" as const }; });
      if (imported.length) setState((current) => ({ ...current, entries: [...imported, ...current.entries], connection: "pending", lastSyncAt: new Date().toISOString() }));
      return imported.length;
    },
    setConnection: (connection) => setState((current) => ({ ...current, connection })),
  }), [hydrated, state]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used inside FinanceProvider");
  return value;
}

export function isCurrentMonth(date: string) { return date.startsWith(MONTH_KEY); }
export function formatBRL(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
export function formatCompactBRL(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
export function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""); }
export function paymentLabel(method: PaymentMethod) { return { credit: "Crédito", debit: "Débito", pix: "Pix", cash: "Dinheiro" }[method]; }
