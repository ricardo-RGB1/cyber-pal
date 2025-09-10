import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth"; 



export const authClient = createAuthClient({
    plugins: [polarClient()], // polar client is used to handle the authentication and authorization for the polar platform
});
