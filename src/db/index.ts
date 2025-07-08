import { drizzle } from 'drizzle-orm/neon-http';


// This connects to the database using the Neon API
export const db = drizzle(process.env.DATABASE_URL!); 
