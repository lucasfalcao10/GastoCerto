const PLUGGY_API = "https://api.pluggy.ai";

type PluggyAuth = { apiKey: string; expiresAt?: string };

type PluggyError = { message?: string; error?: string };

async function getApiKey(): Promise<PluggyAuth> {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PLUGGY_CREDENTIALS_MISSING");
  const response = await fetch(`${PLUGGY_API}/auth`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId, clientSecret }) });
  const data = (await response.json()) as { apiKey?: string; expiresAt?: string } & PluggyError;
  if (!response.ok || !data.apiKey) throw new Error(data.message || data.error || "PLUGGY_AUTH_FAILED");
  return { apiKey: data.apiKey, expiresAt: data.expiresAt };
}

export async function getPluggyStatus() {
  return { configured: Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET), provider: "Pluggy", institution: "C6 Bank", products: ["ACCOUNTS", "CREDIT_CARDS", "TRANSACTIONS"] };
}

export async function createPluggyConnectToken(clientUserId: string) {
  const { apiKey } = await getApiKey();
  const response = await fetch(`${PLUGGY_API}/connect_token`, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ options: { clientUserId, avoidDuplicates: true } }) });
  const data = (await response.json()) as { accessToken?: string; connectToken?: string } & PluggyError;
  if (!response.ok) throw new Error(data.message || data.error || "PLUGGY_CONNECT_TOKEN_FAILED");
  return { connectToken: data.accessToken || data.connectToken || "" };
}

export async function getPluggyTransactions(itemId: string) {
  const { apiKey } = await getApiKey();
  const accountsResponse = await fetch(`${PLUGGY_API}/accounts?itemId=${encodeURIComponent(itemId)}`, { headers: { authorization: `Bearer ${apiKey}` } });
  const accounts = (await accountsResponse.json()) as { results?: Array<{ id: string; type?: string; name?: string }> } & PluggyError;
  if (!accountsResponse.ok) throw new Error(accounts.message || accounts.error || "PLUGGY_ACCOUNTS_FAILED");
  const results: Array<Record<string, unknown>> = [];
  for (const account of accounts.results || []) {
    const transactionsResponse = await fetch(`${PLUGGY_API}/transactions?accountId=${encodeURIComponent(account.id)}&pageSize=500`, { headers: { authorization: `Bearer ${apiKey}` } });
    const transactions = (await transactionsResponse.json()) as { results?: Array<Record<string, unknown>> } & PluggyError;
    if (!transactionsResponse.ok) throw new Error(transactions.message || transactions.error || "PLUGGY_TRANSACTIONS_FAILED");
    for (const transaction of transactions.results || []) results.push({ ...transaction, accountId: account.id, accountName: account.name, accountType: account.type });
  }
  return results;
}
