import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema"; // import the schema


// Add the schema to the auth object 

export const auth = betterAuth({
    emailAndPassword: {  
        enabled: true
    },

    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: { 
            ...schema // spread the schema
        }
    })
})