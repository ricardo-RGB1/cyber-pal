import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";
import { headers } from "next/headers";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { db } from "@/db";
import { count, eq } from "drizzle-orm";
import { meetings, agents } from "@/db/schema";
import { MAX_AGENTS_FREE_TRIAL, MAX_MEETINGS_FREE_TRIAL } from "@/modules/premium/constants";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: "user_123" };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;



/**
 * Protected procedure that requires user authentication.
 * Automatically adds session data to the context for authenticated users.
 */
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});


/**
 * Premium procedure that enforces usage limits for free users.
 * Checks if user has reached free tier limits for meetings or agents,
 * and throws an error if they're not premium and have exceeded the limit.
 * 
 * @param entity - The type of entity to check limits for ("meetings" | "agents")
 */
export const premiumProcedure = (entity: "meetings" | "agents") =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const customer = await polarClient.customers.getStateExternal({ // get the customer from the polar database
      externalId: ctx.session.user.id,
    });

    // count the meetings this user has created
    const [userMeetingCount] = await db
      .select({ count: count(meetings.id) }) // count the meetings this user has created
      .from(meetings)
      .where(eq(meetings.userId, ctx.session.user.id));

    const [userAgentsCount] = await db
      .select({ count: count(agents.id) }) // count the agents this user has created
      .from(agents)
      .where(eq(agents.userId, ctx.session.user.id));

    const isPremium = customer.activeSubscriptions.length > 0;
    const isFreeAgentLimitReached = userAgentsCount.count >= MAX_AGENTS_FREE_TRIAL;
    const isFreeMeetingLimitReached = userMeetingCount.count >= MAX_MEETINGS_FREE_TRIAL; 

    const shouldThrowMeetingError = entity === "meetings" && isFreeMeetingLimitReached && !isPremium; 
    const shouldThrowAgentError = entity === "agents" && isFreeAgentLimitReached && !isPremium; 

    if(shouldThrowMeetingError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You have reached the free meeting limit",
      });
    }

    if(shouldThrowAgentError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You have reached the free agent limit",
      });
    }

    return next({ 
      ctx: {
        ...ctx,
        customer,
      },
    });
  });
