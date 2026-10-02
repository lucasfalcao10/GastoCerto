import { and, desc, eq } from "drizzle-orm";
import { financeConnections, financeEntries, financePlans } from "../drizzle/schema";
import { getDb, getUserByOpenId } from "./db";

export type FinanceEntryInput = {
  type: "expense" | "income";
  amountCents: number;
  entryDate: string;
  description: string;
  category: string;
  paymentMethod: string;
  source?: "manual" | "c6" | "import";
  externalId?: string | null;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
};

async function getOwnedUserId(openId: string) {
  const user = await getUserByOpenId(openId);
  if (!user?.id) throw new Error("USER_NOT_FOUND");
  return user.id;
}

function toClientEntry(row: typeof financeEntries.$inferSelect) {
  return {
    id: `server-${row.id}`,
    type: row.type,
    amount: row.amountCents / 100,
    date: row.entryDate,
    description: row.description,
    category: row.category,
    paymentMethod: row.paymentMethod,
    source: row.source,
    installment: row.installmentTotal ? { current: row.installmentCurrent || 1, total: row.installmentTotal } : undefined,
  };
}

export async function getFinanceSnapshot(openId: string, monthKey: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const userId = await getOwnedUserId(openId);
  const [entries, plans, connections] = await Promise.all([
    db.select().from(financeEntries).where(eq(financeEntries.userId, userId)).orderBy(desc(financeEntries.entryDate), desc(financeEntries.createdAt)),
    db.select().from(financePlans).where(and(eq(financePlans.userId, userId), eq(financePlans.monthKey, monthKey))).limit(1),
    db.select().from(financeConnections).where(eq(financeConnections.userId, userId)).orderBy(desc(financeConnections.createdAt)).limit(1),
  ]);
  const plan = plans[0];
  const connection = connections[0];
  return {
    entries: entries.map(toClientEntry),
    plan: plan ? { income: plan.incomeCents / 100, budgets: JSON.parse(plan.budgetsJson) as Record<string, number> } : null,
    connection: connection ? { status: connection.status, lastSyncAt: connection.lastSyncAt?.toISOString() || null, institution: connection.institution } : null,
  };
}

export async function createFinanceEntry(openId: string, input: FinanceEntryInput) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const userId = await getOwnedUserId(openId);
  const result = await db.insert(financeEntries).values({ userId, ...input }).$returningId();
  const id = result[0]?.id;
  if (!id) throw new Error("ENTRY_CREATE_FAILED");
  const rows = await db.select().from(financeEntries).where(eq(financeEntries.id, id)).limit(1);
  if (!rows[0]) throw new Error("ENTRY_CREATE_FAILED");
  return toClientEntry(rows[0]);
}

function parseServerId(id: string) {
  const parsed = Number(id.replace(/^server-/, ""));
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("INVALID_ENTRY_ID");
  return parsed;
}

export async function updateFinanceEntry(openId: string, id: string, input: Partial<FinanceEntryInput>) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const userId = await getOwnedUserId(openId);
  await db.update(financeEntries).set(input).where(and(eq(financeEntries.id, parseServerId(id)), eq(financeEntries.userId, userId)));
  const rows = await db.select().from(financeEntries).where(and(eq(financeEntries.id, parseServerId(id)), eq(financeEntries.userId, userId))).limit(1);
  return rows[0] ? toClientEntry(rows[0]) : null;
}

export async function deleteFinanceEntry(openId: string, id: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const userId = await getOwnedUserId(openId);
  await db.delete(financeEntries).where(and(eq(financeEntries.id, parseServerId(id)), eq(financeEntries.userId, userId)));
  return { success: true };
}

export async function saveFinancePlan(openId: string, monthKey: string, income: number, budgets: Record<string, number>) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const userId = await getOwnedUserId(openId);
  const existing = await db.select().from(financePlans).where(and(eq(financePlans.userId, userId), eq(financePlans.monthKey, monthKey))).limit(1);
  const values = { userId, monthKey, incomeCents: Math.round(income * 100), budgetsJson: JSON.stringify(budgets) };
  if (existing[0]) await db.update(financePlans).set(values).where(eq(financePlans.id, existing[0].id));
  else await db.insert(financePlans).values(values);
  return { success: true };
}

export async function saveFinanceConnection(openId: string, status: "pending" | "connected" | "error", itemId?: string, lastSyncAt?: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const userId = await getOwnedUserId(openId);
  const existing = await db.select().from(financeConnections).where(eq(financeConnections.userId, userId)).limit(1);
  const values = { userId, provider: "pluggy", institution: "C6 Bank", status, itemId: itemId || null, lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null };
  if (existing[0]) await db.update(financeConnections).set(values).where(eq(financeConnections.id, existing[0].id));
  else await db.insert(financeConnections).values(values);
  return { success: true };
}
