import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LucideMail,
  LucideHouse,
} from "lucide-react";

import Keep from "@/components/app/keep";
import EmailCodeForm from "@/components/app/email-code-form";
import { OTP_MAX_AGE_SECONDS } from "@/lib/otp";
import { sendEmailCode } from "../actions";

export default async function AuthVerifyRequest(props: {
  searchParams?: Promise<{
    provider?: string;
    email?: string;
    callbackUrl?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const provider = searchParams?.provider ?? "nodemailer";
  const email = searchParams?.email;
  const callbackUrl = searchParams?.callbackUrl;

  return (
    <div className="central p-5 bg-no-repeat bg-center bg-cover">
      <Card className="w-full sm:max-w-[450px] dark:border-none dark:bg-black backdrop-blur-lg">
        <CardHeader>
          <div className="flex justify-center my-5"><Keep /></div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-center">
          <CardTitle className="flex flex-col justify-center items-center gap-2 text-xl">
            <LucideMail />
            <h1>Check your email</h1>
          </CardTitle>
          {email ? (
            <>
              <CardDescription className="flex flex-col justify-center items-center gap-1 text-base">
                <p>Enter the code sent to <strong className="break-all">{email}</strong>.</p>
                <p>The code expires in {OTP_MAX_AGE_SECONDS / 60} minutes.</p>
              </CardDescription>
              <EmailCodeForm provider={provider} email={email} callbackUrl={callbackUrl} />
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                <form action={sendEmailCode}>
                  <input type="hidden" name="provider" value={provider} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
                  <Button type="submit" variant="link" size="sm">Send a new code</Button>
                </form>
                <Button asChild variant="link" size="sm">
                  <Link href="/auth/signin">Use a different email</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <CardDescription className="flex flex-col justify-center items-center gap-3 text-base">
                <p>A sign in code has been sent to your email address.</p>
              </CardDescription>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/"><LucideHouse /> Go home</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
        </CardFooter>
      </Card>
    </div>
  );
}
