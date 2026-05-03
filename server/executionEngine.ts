import {
  getDb,
  createOrder,
  createPosition,
  getOpenPositions,
  updatePositionPrice,
  closePosition,
  createTrade,
  closeTrade,
  logExecution,
  getStrategyById,
  updateStrategyStatus,
  updateStrategyPnl,
  getActiveStrategies,
} from "./db";
import { MarketDataService } from "./marketDataService";

/**
 * Core Execution Engine
 * Handles strategy evaluation, order execution, position tracking, and risk management
 */

export interface StrategyConfig {
  strategy_id: string;
  entry: {
    type: "time" | "signal";
    value: string;
  };
  legs: Array<{
    instrument: string;
    type: "CE" | "PE";
    action: "BUY" | "SELL";
    strike: "ATM" | "OTM" | string;
    quantity: number;
    stoploss: number;
    target: number;
    trailing_sl: boolean;
  }>;
  overall: {
    mtm_stoploss: number;
    mtm_target: number;
  };
  reentry: {
    enabled: boolean;
    max_reentries: number;
  };
}

/**
 * Strategy Service: Manages strategy configuration and state
 */
export class StrategyService {
  static parseConfig(configJson: any): StrategyConfig {
    return configJson as StrategyConfig;
  }

  static validateConfig(config: StrategyConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.entry || !config.entry.type) errors.push("Entry condition required");
    if (!config.legs || config.legs.length === 0) errors.push("At least one leg required");
    if (!config.overall) errors.push("Overall risk config required");

    config.legs.forEach((leg, idx) => {
      if (!leg.instrument) errors.push(`Leg ${idx}: instrument required`);
      if (!leg.action) errors.push(`Leg ${idx}: action (BUY/SELL) required`);
      if (leg.quantity <= 0) errors.push(`Leg ${idx}: quantity must be positive`);
      if (leg.stoploss < 0) errors.push(`Leg ${idx}: stoploss must be non-negative`);
      if (leg.target < 0) errors.push(`Leg ${idx}: target must be non-negative`);
    });

    return { valid: errors.length === 0, errors };
  }
}

/**
 * Order Manager: Handles order lifecycle
 */
export class OrderManager {
  static async placeOrder(data: {
    strategyId: number;
    userId: number;
    instrument: string;
    orderType: "market" | "limit";
    action: "BUY" | "SELL";
    quantity: number;
    price: number;
  }) {
    try {
      const result = await createOrder({
        strategyId: data.strategyId,
        userId: data.userId,
        instrument: data.instrument,
        orderType: data.orderType,
        action: data.action,
        quantity: data.quantity,
        price: data.price.toString(),
      });

      await logExecution({
        strategyId: data.strategyId,
        userId: data.userId,
        eventType: "order_created",
        message: `Order placed: ${data.action} ${data.quantity} ${data.instrument} @ ${data.price}`,
        metadata: { orderType: data.orderType, price: data.price },
      });

      return result;
    } catch (error) {
      console.error("[OrderManager] Failed to place order:", error);
      throw error;
    }
  }
}

/**
 * Position Manager: Tracks and updates positions
 */
export class PositionManager {
  static calculateUnrealizedPnl(
    action: "BUY" | "SELL",
    quantity: number,
    entryPrice: number,
    currentPrice: number
  ): number {
    if (action === "BUY") {
      return (currentPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - currentPrice) * quantity;
    }
  }

  static async openPosition(data: {
    strategyId: number;
    userId: number;
    instrument: string;
    action: "BUY" | "SELL";
    quantity: number;
    entryPrice: number;
    stoploss?: number;
    target?: number;
    trailingSlEnabled?: boolean;
  }) {
    try {
      const result = await createPosition({
        strategyId: data.strategyId,
        userId: data.userId,
        instrument: data.instrument,
        action: data.action,
        quantity: data.quantity,
        entryPrice: data.entryPrice.toString(),
        currentPrice: data.entryPrice.toString(),
        stoploss: data.stoploss?.toString(),
        target: data.target?.toString(),
        trailingSlEnabled: data.trailingSlEnabled,
      });

      await logExecution({
        strategyId: data.strategyId,
        userId: data.userId,
        eventType: "position_opened",
        message: `Position opened: ${data.action} ${data.quantity} ${data.instrument} @ ${data.entryPrice}`,
        metadata: {
          quantity: data.quantity,
          entryPrice: data.entryPrice,
          stoploss: data.stoploss,
          target: data.target,
        },
      });

      return result;
    } catch (error) {
      console.error("[PositionManager] Failed to open position:", error);
      throw error;
    }
  }

  static async updatePositions(strategyId: number, marketPrices: Map<string, number>) {
    try {
      const openPositions = await getOpenPositions(strategyId);

      for (const position of openPositions) {
        const currentPrice = marketPrices.get(position.instrument);
        if (!currentPrice) continue;

        const unrealizedPnl = this.calculateUnrealizedPnl(
          position.action as "BUY" | "SELL",
          position.quantity,
          parseFloat(position.entryPrice.toString()),
          currentPrice
        );

        await updatePositionPrice(
          position.id,
          currentPrice.toString(),
          unrealizedPnl.toString()
        );
      }
    } catch (error) {
      console.error("[PositionManager] Failed to update positions:", error);
    }
  }
}

/**
 * Risk Engine: Evaluates and enforces risk rules
 */
export class RiskEngine {
  static checkStoploss(
    position: any,
    currentPrice: number
  ): { triggered: boolean; reason?: string } {
    if (!position.stoploss) return { triggered: false };

    const slPrice = parseFloat(position.stoploss.toString());

    if (position.action === "BUY" && currentPrice <= slPrice) {
      return { triggered: true, reason: "Stoploss hit" };
    } else if (position.action === "SELL" && currentPrice >= slPrice) {
      return { triggered: true, reason: "Stoploss hit" };
    }

    return { triggered: false };
  }

  static checkTarget(
    position: any,
    currentPrice: number
  ): { triggered: boolean; reason?: string } {
    if (!position.target) return { triggered: false };

    const targetPrice = parseFloat(position.target.toString());

    if (position.action === "BUY" && currentPrice >= targetPrice) {
      return { triggered: true, reason: "Target hit" };
    } else if (position.action === "SELL" && currentPrice <= targetPrice) {
      return { triggered: true, reason: "Target hit" };
    }

    return { triggered: false };
  }

  static async evaluatePositionRisks(
    strategyId: number,
    userId: number,
    positions: any[],
    marketPrices: Map<string, number>
  ) {
    const exitPositions: Array<{ positionId: number; reason: "target" | "stoploss"; price: number }> = [];

    for (const position of positions) {
      const currentPrice = marketPrices.get(position.instrument);
      if (!currentPrice) continue;

      // Check target first (priority)
      const targetCheck = this.checkTarget(position, currentPrice);
      if (targetCheck.triggered) {
        exitPositions.push({
          positionId: position.id,
          reason: "target",
          price: currentPrice,
        });
        await logExecution({
          strategyId,
          userId,
          eventType: "target_hit",
          message: `Target hit for ${position.instrument}`,
          metadata: { price: currentPrice },
        });
        continue;
      }

      // Check stoploss
      const slCheck = this.checkStoploss(position, currentPrice);
      if (slCheck.triggered) {
        exitPositions.push({
          positionId: position.id,
          reason: "stoploss",
          price: currentPrice,
        });
        await logExecution({
          strategyId,
          userId,
          eventType: "stoploss_hit",
          message: `Stoploss hit for ${position.instrument}`,
          metadata: { price: currentPrice },
        });
      }
    }

    return exitPositions;
  }
}

/**
 * Execution Loop: Main strategy evaluation loop
 */
export class ExecutionLoop {
  private static processedStrategies = new Set<number>();

  static async evaluateStrategy(
    strategyId: number,
    userId: number,
    marketPrices: Map<string, number>
  ) {
    try {
      const strategy = await getStrategyById(strategyId);
      if (!strategy || strategy.status !== "active") return;

      // Parse strategy config
      const config = StrategyService.parseConfig(strategy.config);
      const validation = StrategyService.validateConfig(config);
      if (!validation.valid) {
        await logExecution({
          strategyId,
          userId,
          eventType: "validation_error",
          message: `Strategy validation failed: ${validation.errors.join(", ")}`,
        });
        return;
      }

      // First run: open positions for each leg
      if (!this.processedStrategies.has(strategyId)) {
        await this.initializeStrategyLegs(strategyId, userId, config, marketPrices);
        this.processedStrategies.add(strategyId);
      }

      // Update all positions with current market prices
      await PositionManager.updatePositions(strategyId, marketPrices);

      // Get open positions and evaluate risks
      const openPositions = await getOpenPositions(strategyId);
      const exitPositions = await RiskEngine.evaluatePositionRisks(
        strategyId,
        userId,
        openPositions,
        marketPrices
      );

      // Close positions that hit risk limits
      for (const exit of exitPositions) {
        const position = openPositions.find((p) => p.id === exit.positionId);
        if (position) {
          const unrealizedPnl = PositionManager.calculateUnrealizedPnl(
            position.action as "BUY" | "SELL",
            position.quantity,
            parseFloat(position.entryPrice.toString()),
            exit.price
          );

          await closePosition(exit.positionId, unrealizedPnl.toString());

          // Create trade record - skip if no valid order ID
          if (position.id) {
            await createTrade({
              strategyId,
              userId,
              instrument: position.instrument,
              entryOrderId: position.id,
              action: position.action,
              quantity: position.quantity,
              entryPrice: position.entryPrice.toString(),
              entryAt: position.createdAt,
            });

            await closeTrade(position.id, {
            exitPrice: exit.price.toString(),
            exitAt: new Date(),
            pnl: unrealizedPnl.toString(),
            pnlPercent: ((unrealizedPnl / (parseFloat(position.entryPrice.toString()) * position.quantity)) * 100).toString(),
            exitReason: exit.reason,
          });
          }
        }
      }

      // Update strategy P&L
      let totalRealizedPnl = 0;
      let totalUnrealizedPnl = 0;

      const updatedPositions = await getOpenPositions(strategyId);
      for (const pos of updatedPositions) {
        totalUnrealizedPnl += parseFloat(pos.unrealizedPnl.toString());
      }

      const newCapital = parseFloat(strategy.initialCapital.toString()) + totalRealizedPnl + totalUnrealizedPnl;
      await updateStrategyPnl(
        strategyId,
        totalRealizedPnl.toString(),
        totalUnrealizedPnl.toString(),
        newCapital.toString()
      );
    } catch (error) {
      console.error("[ExecutionLoop] Error evaluating strategy:", error);
      await logExecution({
        strategyId,
        userId,
        eventType: "execution_error",
        message: `Execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  private static async initializeStrategyLegs(
    strategyId: number,
    userId: number,
    config: StrategyConfig,
    marketPrices: Map<string, number>
  ) {
    try {
      for (const leg of config.legs) {
        const currentPrice = marketPrices.get(leg.instrument) || 0;
        if (currentPrice === 0) continue;

        // Open position for each leg
        await PositionManager.openPosition({
          strategyId,
          userId,
          instrument: leg.instrument,
          action: leg.action,
          quantity: leg.quantity,
          entryPrice: currentPrice,
          stoploss: leg.stoploss,
          target: leg.target,
          trailingSlEnabled: leg.trailing_sl || false,
        });
      }

      await logExecution({
        strategyId,
        userId,
        eventType: "strategy_started",
        message: `Strategy started with ${config.legs.length} leg(s)`,
        metadata: { legCount: config.legs.length },
      });
    } catch (error) {
      console.error("[ExecutionLoop] Failed to initialize strategy legs:", error);
      await logExecution({
        strategyId,
        userId,
        eventType: "initialization_error",
        message: `Failed to initialize legs: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  static async runExecutionCycle() {
    try {
      // Get all active strategies
      const activeStrategies = await getActiveStrategies();

      if (activeStrategies.length === 0) {
        return;
      }

      // Update market prices
      const marketPrices = MarketDataService.updateAllPrices();

      // Evaluate each strategy
      for (const strategy of activeStrategies) {
        await this.evaluateStrategy(strategy.id, strategy.userId, marketPrices);
      }
    } catch (error) {
      console.error("[ExecutionLoop] Cycle error:", error);
    }
  }

  static resetProcessedStrategies() {
    this.processedStrategies.clear();
  }
}

/**
 * Start the execution engine loop
 */
export function startExecutionEngine() {
  console.log("[ExecutionEngine] Starting execution engine...");

  // Run execution cycle every 5 seconds
  setInterval(async () => {
    await ExecutionLoop.runExecutionCycle();
  }, 5000);

  console.log("[ExecutionEngine] Execution engine started (runs every 5 seconds)");
}

/**
 * Stop the execution engine (for testing)
 */
export function stopExecutionEngine() {
  console.log("[ExecutionEngine] Execution engine stopped");
  ExecutionLoop.resetProcessedStrategies();
}
