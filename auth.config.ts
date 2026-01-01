import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Nodemailer from "next-auth/providers/nodemailer"
import type { NextAuthConfig } from "next-auth"

const config: NextAuthConfig = {
  providers: [
    Google,
    GitHub,
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: { strategy: "jwt" },
  theme: {
    colorScheme: "dark",
    logo: "https://authjs.dev/img/logo-sm.png",
  },
}

export default config
