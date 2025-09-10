import { db } from "@/db";
import { eq, count } from "drizzle-orm";
import { agents, meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { polarClient } from "@/lib/polar";


/**
 * Premium Router
 * 
 * Handles all premium subscription and billing-related procedures.
 * Integrates with Polar for subscription management and tracks free tier usage limits.
 * 
 * Key Features:
 * - Subscription status checking and product retrieval
 * - Free tier usage tracking for meetings and agents
 * - Integration with Polar billing platform
 */
export const premiumRouter = createTRPCRouter({
 
  /**
   * Get Current Subscription
   * 
   * Retrieves the current active subscription for the authenticated user.
   * Fetches subscription data from Polar and returns the associated product details.
   * 
   * Flow:
   * 1. Query Polar for customer data using user ID as external identifier
   * 2. Check for active subscriptions (takes first if multiple exist)
   * 3. If no subscription exists, return null (user is on free tier)
   * 4. If subscription exists, fetch and return the product details
   * 
   * @returns Product object with subscription details, or null if no active subscription
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.session.user.id, 
    });

    const subscription = customer.activeSubscriptions[0];

    if(!subscription) {
      return null;
    }
    // if user does have a subscription, match it to the product
    const product = await polarClient.products.get({ // get the product from the polar database 
      id: subscription.productId, 
    }); 

    return product;
  }),
  
  /**
   * Get Available Products
   * 
   * Fetches all available subscription products from Polar.
   * Returns only active, recurring products sorted by price.
   * 
   * @returns Array of available subscription products sorted by price
   */
  getProducts: protectedProcedure.query(async () => {
    const products = await polarClient.products.list({
      isArchived: false, 
      isRecurring: true, 
      sorting: ["price_amount"], 
    })

    return products.result.items;
  }),
  
  /**
   * Get Free Tier Usage
   * 
   * Tracks usage counts for free tier users to enforce limits.
   * Returns null if user has an active subscription (no limits apply).
   * Otherwise returns current usage counts for meetings and agents.
   * 
   * Used to:
   * - Display remaining free tier allowances in UI
   * - Enforce creation limits before hitting premium upgrade prompts
   * - Show usage progress bars and warnings
   * 
   * @returns Object with usage counts for meetings and agents, or null if user has subscription
   */
  getFreeUsage: protectedProcedure.query(async ({ ctx }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.session.user.id, // the user id is the external id; this is the id of the user in the polar database;
    });

    // if the customer already has a subscription don't show the free usage
    const subscription = customer.activeSubscriptions[0];
    if (subscription) {
      return null;
    }

    // count the meetings this user has created
    const [userMeetingCount] = await db
      .select({ count: count(meetings.id) }) // count the meetings this user has created
      .from(meetings)
      .where(eq(meetings.userId, ctx.session.user.id));

    const [userAgentsCount] = await db
      .select({ count: count(agents.id) }) // count the agents this user has created
      .from(agents)
      .where(eq(agents.userId, ctx.session.user.id));

    // return the count of the meetings and agents this user has created
    return {
      userMeetingCount: userMeetingCount.count,
      userAgentsCount: userAgentsCount.count,
    };
  }),
});
