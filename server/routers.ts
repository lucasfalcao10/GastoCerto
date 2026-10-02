import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createPluggyConnectToken, getPluggyStatus, getPluggyTransactions } from "./pluggy";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(getSessionCookieName(ctx.req), {
        ...cookieOptions,
        maxAge: -1,
      });
      return {
        success: true,
      } as const;
    }),
  }),

  finance: router({
    integrationStatus: publicProcedure.query(() => getPluggyStatus()),
    createConnectToken: protectedProcedure
      .mutation(({ ctx }) => createPluggyConnectToken(ctx.user.openId)),
    syncItem: protectedProcedure
      .input(z.object({ itemId: z.string().min(1).max(128) }))
      .mutation(async ({ input }) => ({ imported: await getPluggyTransactions(input.itemId) })),
  }),
});

export type AppRouter = typeof appRouter;
