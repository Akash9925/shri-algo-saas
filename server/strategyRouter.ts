import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createStrategy,
  getStrategyById,
  getStrategiesByUserId,
  updateStrategyStatus,
  getTradesByStrategy,
  getExecutionLogs,
  getOrCreateSubscription,
  getOpenPositions,
} from "./db";
import { PositionManager } from "./executionEngine";

const strategyConfigSchema = z.object({
  entry: z.object({
    type: z.enum(["time", "signal"]),
    value: z.string(),
  }),
  legs: z.array(
    z.object({
      instrument: z.string(),
      type: z.enum(["CE", "PE"]),
      action: z.enum(["BUY", "SELL"]),
      strike: z.string(),
      quantity: z.number().positive(),
      stoploss: z.number().nonnegative(),
      target: z.number().nonnegative(),
      trailing_sl: z.boolean().optional(),
    })
  ),
  overall: z.object({
    mtm_stoploss: z.number(),
    mtm_target: z.number(),
  }),
  reentry: z.object({
    enabled: z.boolean(),
    max_reentries: z.number(),
  }),
});

export const strategyRouter = router({
  /**
   * Create a new strategy
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        config: strategyConfigSchema,
        initialCapital: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits
      const subscription = await getOrCreateSubscription(ctx.user.id);
      if (subscription.plan === "free") {
        // Free plan: max 1 active strategy
        const userStrategies = await getStrategiesByUserId(ctx.user.id);
        const activeCount = userStrategies.filter((s) => s.status === "active").length;
        if (activeCount >= 1) {
          throw new Error("Free plan allows only 1 active strategy. Upgrade to paid plan for unlimited strategies.");
        }
      }

      const result = await createStrategy({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        config: input.config,
        initialCapital: input.initialCapital.toString(),
      });

      return {
        success: true,
        message: "Strategy created successfully",
      };
    }),

  /**
   * Get user's strategies
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const strategies = await getStrategiesByUserId(ctx.user.id);
    return strategies.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      status: s.status,
      initialCapital: s.initialCapital,
      currentCapital: s.currentCapital,
      realizedPnl: s.realizedPnl,
      unrealizedPnl: s.unrealizedPnl,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }),

  /**
   * Get strategy details with trades and logs
   */
  detail: protectedProcedure
    .input(z.object({ strategyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const strategy = await getStrategyById(input.strategyId);
      if (!strategy || strategy.userId !== ctx.user.id) {
        throw new Error("Strategy not found");
      }

      const trades = await getTradesByStrategy(input.strategyId);
      const logs = await getExecutionLogs(input.strategyId, 50);
      const openPositions = await getOpenPositions(input.strategyId);

      // Calculate totals
      let totalRealizedPnl = 0;
      let totalUnrealizedPnl = 0;

      for (const trade of trades) {
        if (trade.pnl) {
          totalRealizedPnl += parseFloat(trade.pnl.toString());
        }
      }

      for (const pos of openPositions) {
        totalUnrealizedPnl += parseFloat(pos.unrealizedPnl.toString());
      }

      return {
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        status: strategy.status,
        config: strategy.config,
        initialCapital: strategy.initialCapital,
        currentCapital: strategy.currentCapital,
        realizedPnl: strategy.realizedPnl,
        unrealizedPnl: strategy.unrealizedPnl,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt,
        startedAt: strategy.startedAt,
        completedAt: strategy.completedAt,
        trades: trades.map((t) => ({
          id: t.id,
          instrument: t.instrument,
          action: t.action,
          quantity: t.quantity,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          pnl: t.pnl,
          pnlPercent: t.pnlPercent,
          exitReason: t.exitReason,
          entryAt: t.entryAt,
          exitAt: t.exitAt,
        })),
        openPositions: openPositions.map((p) => ({
          id: p.id,
          instrument: p.instrument,
          action: p.action,
          quantity: p.quantity,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          unrealizedPnl: p.unrealizedPnl,
          stoploss: p.stoploss,
          target: p.target,
          createdAt: p.createdAt,
        })),
        logs: logs.map((l) => ({
          id: l.id,
          eventType: l.eventType,
          message: l.message,
          metadata: l.metadata,
          createdAt: l.createdAt,
        })),
        totalRealizedPnl,
        totalUnrealizedPnl,
      };
    }),

  /**
   * Start a strategy (activate it)
   */
  start: protectedProcedure
    .input(z.object({ strategyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const strategy = await getStrategyById(input.strategyId);
      if (!strategy || strategy.userId !== ctx.user.id) {
        throw new Error("Strategy not found");
      }

      await updateStrategyStatus(input.strategyId, "active");

      return {
        success: true,
        message: "Strategy started",
      };
    }),

  /**
   * Stop a strategy (deactivate it)
   */
  stop: protectedProcedure
    .input(z.object({ strategyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const strategy = await getStrategyById(input.strategyId);
      if (!strategy || strategy.userId !== ctx.user.id) {
        throw new Error("Strategy not found");
      }

      await updateStrategyStatus(input.strategyId, "stopped");

      return {
        success: true,
        message: "Strategy stopped",
      };
    }),

  /**
   * Get execution logs for a strategy
   */
  logs: protectedProcedure
    .input(z.object({ strategyId: z.number(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const strategy = await getStrategyById(input.strategyId);
      if (!strategy || strategy.userId !== ctx.user.id) {
        throw new Error("Strategy not found");
      }

      const logs = await getExecutionLogs(input.strategyId, input.limit || 100);
      return logs.map((l) => ({
        id: l.id,
        eventType: l.eventType,
        message: l.message,
        metadata: l.metadata,
        createdAt: l.createdAt,
      }));
    }),
});
