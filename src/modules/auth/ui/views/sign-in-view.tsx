"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OctagonAlertIcon } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa"; 
// local imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";





// form schema - no min required when logging in
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required" }),
});






export const SignInView = () => {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter(); 
  // form hook - used to handle the form state and validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Handles the form submission for signing in.
   *
   * What it does:
   * - Resets any previous error state.
   * - Calls the `authClient.signIn.email` method with the user's email and password.
   * - If the sign-in is successful, navigates the user to the home page ("/").
   * - If there is an error during sign-in, sets the error message to be displayed.
   *
   * What it returns:
   * - This function does not return a value (returns void). It performs side effects such as navigation and error state updates.
   */
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    authClient.signIn.email( 
      {
        email: data.email,
        password: data.password,
        callbackURL: "/", 
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/"); 
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error.message);
        },
        onSettled: () => {
          setPending(false);
        },
      }
    );
  };

  /**
   * Handles social sign-in (Google or GitHub).
   *
   */
    const onSocial = (provider: "google" | "github") => {
      setError(null);
      setPending(true);
      authClient.signIn.social(
        {
          provider,
          callbackURL: "/",
        },
        {
          onSuccess: () => {
            setPending(false);
          },
          onError: ({ error }) => {
            setPending(false);
            setError(error.message);
          },
          onSettled: () => {
            setPending(false);
          },
        }
      );
    };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome back!</h1>
                  <p className="text-muted-foreground text-balance">
                    Login to your account to continue
                  </p>
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="abc@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="********"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!!error && (
                  <Alert className="bg-destructive/10 border-none text-destructive">
                    <OctagonAlertIcon className="size-4 !text-destructive" />
                    <AlertTitle className="text-sm">{error}</AlertTitle>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  Sign in
                </Button>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      onSocial("google");
                    }}
                    disabled={pending}
                    variant="outline"
                    type="button"
                    className="w-full"
                  >
                    <FaGoogle className="mr-2" />
                    Google
                  </Button>
                  <Button
                    onClick={() => {
                      onSocial("github");
                    }}
                    disabled={pending}
                    variant="outline"
                    type="button"
                    className="w-full"
                  >
                    <FaGithub className="mr-2" />
                    GitHub
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </Form>
          <div className="bg-radial from-slate-700 to-slate-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <img src="/logo.png" alt="logo" className="h-[92px] w-[92px]" />
            <p className="text-2xl font-semibold text-white">CyberPal</p>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking sign in, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>
      </div>
    </div>
  );
};
