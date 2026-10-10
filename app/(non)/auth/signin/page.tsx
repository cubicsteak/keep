import { redirect } from "next/navigation"
import { signIn, providerMap } from "@/auth.ts"
import { AuthError } from "next-auth"

// import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  // CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Keep from "@/components/app/keep";
import { sendEmailCode } from "../actions";

export default async function AuthSignIn(props: {
  searchParams?: Promise<{ 
    callbackUrl: string | undefined;
  }>;
}) {
  const searchParams = await props.searchParams;
  const providerSet = {
    credentials: providerMap.filter((e) => e.type === "credentials"),
    oauth: providerMap.filter((e) => e.type === "oauth"),
    email: providerMap.filter((e) => e.type === "email"),
  };

  const signinErrorURL = '/auth/error';
  const formElementsCN = {
    label: 'sr-only',
    input: 'w-full h-10 text-base md:text-base focus-visible:ring-[1px]',
    button: 'w-full h-10 text-base flex justify-between items-center',
  };

  const OR = () => {
    return (
      <div className="flex gap-3 items-center">
        <hr className="flex-1" />
        <span>or</span>
        <hr className="flex-1" />
      </div>
    );
  };

  return (
    <div className="central p-5 bg-no-repeat bg-center bg-cover">
      <Card className="w-full sm:max-w-[450px] dark:border-none dark:bg-black backdrop-blur-lg">
        <CardHeader>
          <div className="flex justify-center my-5"><Keep /></div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-center">
          <CardTitle className="flex flex-col justify-center items-center gap-2 text-2xl sr-only">
            <h1>Sign in</h1>
          </CardTitle>
          <div className="flex flex-col gap-6">
            {(providerSet.credentials?.length > 0) && (
              <form
                action={async (formData) => {
                  "use server"
                  try {
                    await signIn("credentials", formData)
                  } catch (error) {
                    // console.log(error)
                    if (error instanceof AuthError) {
                      return redirect(`${signinErrorURL}?error=${error}`)
                    }
                    throw error
                  }
                }}
              >
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label className={`${formElementsCN.label}`} htmlFor="email">Email</Label>
                    <Input className={`${formElementsCN.input}`} name="email" id="email" placeholder="Email" />
                  </div>
                  <div className="grid gap-2">
                    <Label className={`${formElementsCN.label}`} htmlFor="password">Password</Label>
                    <Input className={`${formElementsCN.input}`} name="password" id="password" placeholder="Password" />
                  </div>
                  <div className="grid gap-2">
                    <Button type="submit" className={`${formElementsCN.button} justify-center`}>Sign in</Button>
                  </div>
                </div>
              </form>
            )}

            {(providerSet.credentials?.length > 0 && providerSet.oauth?.length > 0) && <OR />}

            {(providerSet.oauth?.length > 0) && (
              <div className="flex flex-col gap-3">
                {Object.values(providerSet.oauth).map((provider) => (
                  <form 
                    key={provider.id}
                    action={async () => {
                      "use server"
                      try {
                        await signIn(provider.id, {
                          redirectTo: searchParams?.callbackUrl ?? "",
                        })
                      } catch (error) {
                        // console.log(error)
                        if (error instanceof AuthError) {
                          return redirect(`${signinErrorURL}?error=${error}`)
                        }
                        throw error
                      }
                    }}
                  >
                    <Button type="submit" className={`${formElementsCN.button}`}>
                      <span>Sign in with {provider.name}</span>
                      <div className="size-6 bg-no-repeat bg-left bg-size-[auto_24px]" style={{ backgroundSize: `auto 100%`, backgroundImage: `url(https://authjs.dev/img/providers/${provider.id}.svg)` }}></div>
                    </Button>
                  </form>
                ))}
              </div>
            )}

            {((providerSet.oauth?.length > 0 || providerSet.credentials?.length > 0) && providerSet.email?.length > 0) && <OR />}

            {(providerSet.email?.length > 0) && (
              <div className="flex flex-col gap-6">
                {Object.values(providerSet.email).map((provider) => (
                  <form
                    key={provider.id}
                    action={sendEmailCode}
                  >
                    <input type="hidden" name="provider" value={provider.id} />
                    <input type="hidden" name="callbackUrl" value={searchParams?.callbackUrl ?? ""} />
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label className={`${formElementsCN.label}`} htmlFor={`email-${provider.id}`}>Email</Label>
                        <Input className={`${formElementsCN.input}`} type="email" name="email" id={`email-${provider.id}`} placeholder="Email" required />
                      </div>
                      <div className="grid gap-2">
                        <Button type="submit" className={`${formElementsCN.button}`}>
                          <div>Sign in with {provider.name}</div>
                          <div className="size-6 bg-no-repeat bg-left bg-size-[auto_24px]" style={{ backgroundSize: `auto 100%`, backgroundImage: `url(https://authjs.dev/img/providers/${provider.id}.svg)` }}></div>
                        </Button>
                      </div>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
        </CardFooter>
      </Card>
    </div>
  );
}
