import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getOrCreateSubscription, updateSubscription } from "./db";

export const subscriptionRouter = router({
  /**
   * Get user's current subscription
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getOrCreateSubscription(ctx.user.id);
    return {
      id: subscription.id,
      plan: subscription.plan,
      maxActiveStrategies: subscription.maxActiveStrategies,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }),

  /**
   * Upgrade to paid plan
   */
  upgradeToPaid: protectedProcedure.mutation(async ({ ctx }) => {
    await updateSubscription(ctx.user.id, "paid", 999); // Unlimited strategies

    return {
      success: true,
      message: "Upgraded to paid plan successfully",
      plan: "paid",
    };
  }),

  /**
   * Downgrade to free plan
   */
  downgradeToFree: protectedProcedure.mutation(async ({ ctx }) => {
    await updateSubscription(ctx.user.id, "free", 1); // 1 active strategy

    return {
      success: true,
      message: "Downgraded to free plan successfully",
      plan: "free",
    };
  }),
});
