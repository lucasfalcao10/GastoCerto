import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createCorsMiddleware } from "./cors";
import { clearLegacySessionCookie } from "./cookies";
import { sdk } from "./sdk";
import { createFinanceEntry, deleteFinanceEntry, getFinanceSnapshot, saveFinanceConnection, saveFinancePlan, updateFinanceEntry } from "../finance";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(createCorsMiddleware());
  app.use(clearLegacySessionCookie());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.get("/api/finance/bootstrap", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const monthKey = typeof req.query.monthKey === "string" ? req.query.monthKey : new Date().toISOString().slice(0, 7);
      res.json(await getFinanceSnapshot(user.openId, monthKey));
    } catch {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/finance/entries", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.status(201).json(await createFinanceEntry(user.openId, req.body));
    } catch (error) {
      res.status(error instanceof Error && error.message === "Not authenticated" ? 401 : 400).json({ error: error instanceof Error ? error.message : "Entry create failed" });
    }
  });

  app.patch("/api/finance/entries/:id", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const updated = await updateFinanceEntry(user.openId, req.params.id, req.body);
      res.json(updated || { error: "Entry not found" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Entry update failed" });
    }
  });

  app.delete("/api/finance/entries/:id", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json(await deleteFinanceEntry(user.openId, req.params.id));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Entry delete failed" });
    }
  });

  app.put("/api/finance/plan", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json(await saveFinancePlan(user.openId, req.body.monthKey, Number(req.body.income) || 0, req.body.budgets || {}));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Plan save failed" });
    }
  });

  app.put("/api/finance/connection", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json(await saveFinanceConnection(user.openId, req.body.status, req.body.itemId, req.body.lastSyncAt));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Connection save failed" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log("[api] server listening");
  });
}

startServer().catch(() => {
  console.error("[api] server failed to start");
});
