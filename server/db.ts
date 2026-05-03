import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * STRATEGY QUERIES
 */
export async function createStrategy(data: {
  userId: number;
  name: string;
  description?: string;
  config: any;
  initialCapital: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { strategies } = await import("../drizzle/schema");
  const result = await db.insert(strategies).values({
    userId: data.userId,
    name: data.name,
    description: data.description,
    config: data.config,
    initialCapital: data.initialCapital as any,
    currentCapital: data.initialCapital as any,
    status: "created",
  });
  return result;
}

export async function getStrategyById(strategyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { strategies } = await import("../drizzle/schema");
  const result = await db.select().from(strategies).where(eq(strategies.id, strategyId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getStrategiesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { strategies } = await import("../drizzle/schema");
  return await db.select().from(strategies).where(eq(strategies.userId, userId));
}

export async function updateStrategyStatus(strategyId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { strategies } = await import("../drizzle/schema");
  return await db.update(strategies).set({ status: status as any, updatedAt: new Date() }).where(eq(strategies.id, strategyId));
}

export async function updateStrategyPnl(strategyId: number, realizedPnl: string, unrealizedPnl: string, currentCapital: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { strategies } = await import("../drizzle/schema");
  return await db.update(strategies).set({
    realizedPnl: realizedPnl as any,
    unrealizedPnl: unrealizedPnl as any,
    currentCapital: currentCapital as any,
    updatedAt: new Date(),
  }).where(eq(strategies.id, strategyId));
}

/**
 * ORDER QUERIES
 */
export async function createOrder(data: {
  strategyId: number;
  userId: number;
  instrument: string;
  orderType: string;
  action: string;
  quantity: number;
  price: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { orders } = await import("../drizzle/schema");
  const result = await db.insert(orders).values({
    strategyId: data.strategyId,
    userId: data.userId,
    instrument: data.instrument,
    orderType: data.orderType as any,
    action: data.action as any,
    quantity: data.quantity,
    price: data.price as any,
    status: "created",
  });
  return result;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { orders } = await import("../drizzle/schema");
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrdersByStrategy(strategyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { orders } = await import("../drizzle/schema");
  return await db.select().from(orders).where(eq(orders.strategyId, strategyId));
}

/**
 * POSITION QUERIES
 */
export async function createPosition(data: {
  strategyId: number;
  userId: number;
  instrument: string;
  action: string;
  quantity: number;
  entryPrice: string;
  currentPrice: string;
  stoploss?: string;
  target?: string;
  trailingSlEnabled?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { positions } = await import("../drizzle/schema");
  const result = await db.insert(positions).values({
    strategyId: data.strategyId,
    userId: data.userId,
    instrument: data.instrument,
    action: data.action as any,
    quantity: data.quantity,
    entryPrice: data.entryPrice as any,
    currentPrice: data.currentPrice as any,
    stoploss: data.stoploss ? (data.stoploss as any) : null,
    target: data.target ? (data.target as any) : null,
    trailingSlEnabled: data.trailingSlEnabled || false,
    status: "open",
  });
  return result;
}

export async function getOpenPositions(strategyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { positions } = await import("../drizzle/schema");
  const { eq: eqFn } = await import("drizzle-orm");
  return await db.select().from(positions).where(eqFn(positions.strategyId, strategyId) && eqFn(positions.status, "open"));
}

export async function updatePositionPrice(positionId: number, currentPrice: string, unrealizedPnl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { positions } = await import("../drizzle/schema");
  return await db.update(positions).set({
    currentPrice: currentPrice as any,
    unrealizedPnl: unrealizedPnl as any,
  }).where(eq(positions.id, positionId));
}

export async function closePosition(positionId: number, realizedPnl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { positions } = await import("../drizzle/schema");
  return await db.update(positions).set({
    status: "closed",
    realizedPnl: realizedPnl as any,
    closedAt: new Date(),
  }).where(eq(positions.id, positionId));
}

/**
 * TRADE QUERIES
 */
export async function createTrade(data: {
  strategyId: number;
  userId: number;
  instrument: string;
  entryOrderId: number;
  action: string;
  quantity: number;
  entryPrice: string;
  entryAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { trades } = await import("../drizzle/schema");
  const result = await db.insert(trades).values({
    strategyId: data.strategyId,
    userId: data.userId,
    instrument: data.instrument,
    entryOrderId: data.entryOrderId,
    action: data.action as any,
    quantity: data.quantity,
    entryPrice: data.entryPrice as any,
    entryAt: data.entryAt,
  });
  return result;
}

export async function getTradeById(tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { trades } = await import("../drizzle/schema");
  const result = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTradesByStrategy(strategyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { trades } = await import("../drizzle/schema");
  return await db.select().from(trades).where(eq(trades.strategyId, strategyId));
}

export async function closeTrade(tradeId: number, data: {
  exitPrice: string;
  exitAt: Date;
  pnl: string;
  pnlPercent: string;
  exitReason: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { trades } = await import("../drizzle/schema");
  return await db.update(trades).set({
    exitPrice: data.exitPrice as any,
    exitAt: data.exitAt,
    pnl: data.pnl as any,
    pnlPercent: data.pnlPercent as any,
    exitReason: data.exitReason as any,
  }).where(eq(trades.id, tradeId));
}

/**
 * EXECUTION LOG QUERIES
 */
export async function logExecution(data: {
  strategyId: number;
  userId: number;
  eventType: string;
  message: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { executionLogs } = await import("../drizzle/schema");
  return await db.insert(executionLogs).values({
    strategyId: data.strategyId,
    userId: data.userId,
    eventType: data.eventType,
    message: data.message,
    metadata: data.metadata,
  });
}

export async function getExecutionLogs(strategyId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { executionLogs } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return await db.select().from(executionLogs).where(eq(executionLogs.strategyId, strategyId)).orderBy(desc(executionLogs.createdAt)).limit(limit);
}

/**
 * SUBSCRIPTION QUERIES
 */
export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = await import("../drizzle/schema");
  const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  // Create free subscription by default
  const result = await db.insert(subscriptions).values({
    userId,
    plan: "free",
    maxActiveStrategies: 1,
  });
  
  return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1).then(r => r[0]);
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = await import("../drizzle/schema");
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSubscription(userId: number, plan: string, maxActiveStrategies: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = await import("../drizzle/schema");
  return await db.update(subscriptions).set({
    plan: plan as any,
    maxActiveStrategies,
    updatedAt: new Date(),
  }).where(eq(subscriptions.userId, userId));
}

/**
 * RISK CONFIG QUERIES
 */
export async function getOrCreateRiskConfig(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { riskConfigs } = await import("../drizzle/schema");
  const existing = await db.select().from(riskConfigs).where(eq(riskConfigs.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  // Create default risk config
  const result = await db.insert(riskConfigs).values({
    userId,
    maxDrawdownPercent: "10" as any,
    maxOpenPositions: 5,
  });
  
  return await db.select().from(riskConfigs).where(eq(riskConfigs.userId, userId)).limit(1).then(r => r[0]);
}

export async function getActiveStrategies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { strategies } = await import("../drizzle/schema");
  const { eq: eqFn } = await import("drizzle-orm");
  return await db.select().from(strategies).where(eqFn(strategies.status, "active"));
}
