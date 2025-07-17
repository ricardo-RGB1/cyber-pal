import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';




/**
 * The main application router for tRPC.
 * 
 * This router defines all available API endpoints for the app.
 * 
 * Endpoints:
 * - hello: Accepts an object with a `text` string, and returns a greeting message.
 *   - Input: { text: string }
 *   - Output: { greeting: string }
 */
export const appRouter = createTRPCRouter({
// one endpoint  called hello that accepts an object with a text string and returns a greeting message. 
// input: { text: string }
// output: { greeting: string }
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
export type AppRouter = typeof appRouter;