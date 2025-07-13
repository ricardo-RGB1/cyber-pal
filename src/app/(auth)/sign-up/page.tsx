
import { auth } from "@/lib/auth";
import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SignUpPage = async () => {
     // check if the user is logged in using server-side session 
     const session = await auth.api.getSession({
      headers: await headers(), 
    }); 
  
    // if the user is logged in, redirect to the home page  
    if (!!session) {
      redirect("/"); 
    }
  return <SignUpView />;
};

export default SignUpPage;
