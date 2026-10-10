'use client';

// import Link from 'next/link';
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
  LucideOctagonAlert,
  LucideUndo2,
  LucideHouse,
  LucideLogIn,
} from "lucide-react";

import Keep from "@/components/app/keep";

import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { signIn } from "next-auth/react";
import { Suspense } from "react";

enum Error {
  Default = "Default",
  Configuration = "Configuration",
  AccessDenied = "AccessDenied",
  Verification = "Verification",
}

const errorMap = {
  [Error.Default]: [],
  [Error.Configuration]: [
    'Server Error',
    (
      <>
        <p>There is a problem with the server configuration.</p>
        <p>Check the server logs for more information.</p>
      </>
    )
  ],
  [Error.AccessDenied]: [
    'Access Denied',
    (
      <>
        <p>You do not have permission to sign in.</p>
      </>
    )
  ],
  [Error.Verification]: [
    'Unable to sign in',
    (
      <>
        <p>The sign in code is incorrect or no longer valid.</p>
        <p>It may have expired, or too many attempts were made.</p>
      </>
    ),
    (
      <>
        <Button variant="outline" onClick={() => window.history.back()}>
          <LucideUndo2 /> Try again
        </Button>
        <Button onClick={() => signIn(undefined, { redirectTo: '/' })}>
          <LucideLogIn /> Sign in
        </Button>
      </>
    )
  ],
}

const AuthErrorClient = () => {
  const router = useRouter()
  const search = useSearchParams()
  const error = search.get("error") as Error

  return (
    <div className="central p-5 bg-no-repeat bg-center bg-cover">
      <Card className="w-full sm:max-w-[450px] dark:border-none dark:bg-black backdrop-blur-lg">
        <CardHeader>
          <div className="flex justify-center my-5"><Keep /></div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-center">
          <CardTitle className="flex flex-col justify-center items-center gap-2 text-xl">
            <LucideOctagonAlert /> 
            {errorMap?.[error]?.[0] || (
              <>Something went wrong</>
            )}
          </CardTitle>
          <CardDescription className="flex flex-col justify-center items-center gap-3 text-base">
            {errorMap?.[error]?.[1] || (
              <><p>Please contact us if this error persists.</p></>
            )}
          </CardDescription>
          <div className="mt-5 flex gap-3 justify-center items-center">
            {errorMap?.[error]?.[2] || (
              <>
                <Button onClick={() => router.back()}>
                  <LucideUndo2 /> Go back
                </Button>
                <Button onClick={() => redirect('/')}>
                  <LucideHouse /> Go home
                </Button>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense>
      <AuthErrorClient />
    </Suspense>
  );
}
