import { z } from "zod"; 


// These schemas are used to validate the input of the API endpoints for when we are creating or updating a meeting 
export const meetingsInsertSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }), 
    agentId: z.string().min(1, { message: "Agent is required" }), // the agent that will be used to create the meeting  
})

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
    id: z.string().min(1, { message: "ID is required" }),
})