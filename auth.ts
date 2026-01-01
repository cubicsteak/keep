import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import { PrismaClient as PrismaClientModule } from "@prisma/client"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: false,
  adapter: PrismaAdapter(prisma as PrismaClientModule),
  ...authConfig,
  callbacks: {
    async jwt({ token, user, trigger, session: newData }) {
      delete user?.password
      delete user?.passsalt

      if (trigger === "update") {
        return { ...token, ...newData }
      }

      if (trigger === "signIn" || trigger === "signUp") {
        if (trigger === "signUp") {
          await prisma.user.update({
            where: { id: user?.id ?? "" },
            data: {
              nick: user?.name ?? null,
              photo: user?.image ?? null,
            },
          })
          user.nick = user?.name ?? null
          user.photo = user?.image ?? null
        }
        token.user = { ...token?.user ?? {}, ...user }
      }
      return token
    },
    async session({ session, token }: { session: Session; token?: JWT }) {
      session.user = token?.user
      return session
    },
  },
})

export const providerMap = authConfig.providers.map((provider) => {
  const providerData = typeof provider === "function" ? provider() : provider
  return {
    id: providerData.id,
    name: providerData.name,
    type: providerData.type ?? "oauth",
  }
})
