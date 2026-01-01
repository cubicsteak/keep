import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id?: string
    role?: string | null
    nick?: string | null
    photo?: string | null
    bio?: string | null
    url?: string | null
    username?: string | null
    password?: string | null
    passsalt?: string | null
  }

  interface Session {
    user?: {
      id?: string
      role?: string | null
      nick?: string | null
      photo?: string | null
      bio?: string | null
      url?: string | null
      username?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    user?: {
      id?: string
      role?: string | null
      nick?: string | null
      photo?: string | null
      bio?: string | null
      url?: string | null
      username?: string | null
    }
  }
}
