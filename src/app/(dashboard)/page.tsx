import { HomeView } from "@/modules/home/ui/views/home-view";
import { auth } from "@/lib/auth";  
import { redirect } from "next/navigation";  
import { headers } from "next/headers"; 



const Page = async () => {
  // check if the user is logged in using server-side session 
  const session = await auth.api.getSession({
    headers: await headers(), 
  }); 

  if (!session) {
    redirect("/sign-in"); 
  }

  // if the user is logged in, show the home view 
  return (
    <HomeView />
  )
}

export default Page; 