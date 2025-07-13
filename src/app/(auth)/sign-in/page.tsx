
import { auth } from "@/lib/auth";
import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SignInPage = async () => {
    // check if the user is logged in using server-side session 
    const session = await auth.api.getSession({
      headers: await headers(), 
    }); 
  
    // if the user is logged in, redirect to the home page  
    if (!!session) {
      redirect("/"); 
    }

    // if the user is not logged in, show the sign-in view 
  return <SignInView />;
};

export default SignInPage;
