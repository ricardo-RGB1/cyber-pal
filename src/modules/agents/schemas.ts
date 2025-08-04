import { z } from "zod"; 


// These schemas are used to validate the input of the API endpoints for when we are creating or updating an agent or deleting an agent 
export const agentsInsertSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }), 
    instructions: z.string().min(1, { message: "Instructions are required" }),  
})

export const agentsUpdateSchema = agentsInsertSchema.extend({
    id: z.string().min(1, { message: "ID is required" }),
})

