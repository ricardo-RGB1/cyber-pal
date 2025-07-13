import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema"; // import the schema




/**
 * The `auth` object is the main authentication handler for the application.
 * 
 * It is configured with:
 * - Social providers (GitHub and Google) for OAuth sign-in.
 * - Email and password authentication.
 * - A Drizzle ORM adapter for database persistence, using the provided schema.
 * 
 * Environment variables are used to securely provide OAuth client credentials.
 * 
 * Usage:
 *   - `auth.api.getSession()` to retrieve the current session (server-side).
 *   - `authClient` (see `@/lib/auth-client`) for client-side authentication actions.
 */
export const auth = betterAuth({
    socialProviders: {
        github: { 
            clientId: process.env.GITHUB_CLIENT_ID as string, 
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
        }, 
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
    emailAndPassword: {  
        enabled: true
    },
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema: { 
            ...schema // Spread the schema for Drizzle
        }
    })
})