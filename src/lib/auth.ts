import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema"; // import the schema
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarClient } from "./polar"; // import the polar client

/**
 * Authentication configuration for the application using Better Auth.
 *
 * This configuration sets up a comprehensive authentication system with:
 * - Social providers (GitHub, Google)
 * - Email/password authentication
 * - Polar integration for subscription management
 * - Drizzle ORM database adapter for PostgreSQL
 *
 * Features:
 * - Automatic customer creation in Polar on user signup
 * - Authenticated-only checkout flow with upgrade redirection
 * - Customer portal access for subscription management
 * - Multi-provider social authentication
 * - Traditional email/password authentication
 *
 * @remarks
 * - Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables
 * - Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
 * - Uses PostgreSQL database with Drizzle ORM for data persistence
 * - Integrates with Polar for subscription and billing management
 */
export const auth = betterAuth({
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true, // this will create a customer in the polar database when the user signs up
      use: [
        checkout({
          authenticatedUsersOnly: true, // this will only allow authenticated users to checkout
          successUrl: "/upgrade",
        }),
        portal(), // this will allow the user to manage their subscription in the polar portal
      ],
    }),
  ],
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
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema, // Spread the schema for Drizzle
    },
  }),
});
