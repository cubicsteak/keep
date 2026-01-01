import NextAuth from "next-auth"
import authConfig from "./auth.config"
import type { Provider } from "next-auth/providers"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import { PrismaClient as PrismaClientModule } from "@prisma/client"
// import { saltAndHashPassword } from "@/utils/password"
// import { getUserFromDb } from "@/utils/db"
// import Credentials from "next-auth/providers/credentials"
import Nodemailer from "next-auth/providers/nodemailer"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
// import Naver from "next-auth/providers/naver"
// import Kakao from "next-auth/providers/kakao"

declare module "next-auth" {
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    role?: string | null;
    nick?: string | null;
    photo?: string | null;
    bio?: string | null;
    url?: string | null;
    username?: string | null;
    password?: string | null;
    passsalt?: string | null;
  }
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      emailVerified?: Date | null;
      image?: string | null;
      createdAt?: Date | null;
      updatedAt?: Date | null;
      role?: string | null;
      nick?: string | null;
      photo?: string | null;
      bio?: string | null;
      url?: string | null;
      username?: string | null;
      password?: string | null;
      passsalt?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      emailVerified?: Date | null;
      image?: string | null;
      createdAt?: Date | null;
      updatedAt?: Date | null;
      role?: string | null;
      nick?: string | null;
      photo?: string | null;
      bio?: string | null;
      url?: string | null;
      username?: string | null;
      password?: string | null;
      passsalt?: string | null;
    }
  }
}

const providers: Provider[] = [
  // Credentials({
  //   credentials: {
  //     email: {},
  //     password: {},
  //   },
  //   authorize: async (credentials) => {
  //     let user = null
  //     const pwHash = saltAndHashPassword(credentials.password)
  //     user = await getUserFromDb(credentials.email, pwHash)
  //     if (!user) {
  //       throw new Error("Invalid credentials.")
  //     }
  //     return user
  //   },
  // }),
  Google,
  GitHub,
  // Naver,
  // Kakao,
  Nodemailer({
    server: process.env.EMAIL_SERVER,
    from: process.env.EMAIL_FROM,
  }),
]

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider()
      return {
        ...providerData, 
        type: 'oauth', 
        id: providerData.id, 
        name: providerData.name, 
      }
    } else {
      return {
        ...provider, 
        type: provider.type, 
        id: provider.id, 
        name: provider.name, 
      }
    }
  })

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: false,
  adapter: PrismaAdapter(prisma as PrismaClientModule),
  session: { strategy: "jwt" },
  ...authConfig,
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session: newData }) {
      delete user?.password;
      delete user?.passsalt;
      // token = { ...token, ...user }
      if (trigger === 'update') {
        return { ...token, ...newData }
      }
      if (trigger === 'signIn' || trigger === 'signUp') {
        if (trigger === 'signUp') {
          await prisma.user.update({
            where: {
              id: user?.id ?? '',
            },
            data: {
              nick: user?.name ?? null,
              photo: user?.image ?? null,
            },
          });
          user.nick = user?.name ?? null;
          user.photo = user?.image ?? null;
        }
        token.user = { ...token?.user ?? [], ...user }
      }
      return token
    },
    async session({ session, token }: { session: Session, token?: JWT }) {
      session.user = token?.user;
      return session
    },
  },
  theme: {
    colorScheme: 'dark',
    logo: 'https://authjs.dev/img/logo-sm.png',
  },
  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    // newUser: '/auth/signup',
  },
})
