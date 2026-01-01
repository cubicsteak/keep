import NextAuth from "next-auth"
import authConfig from "./auth.config"

// export const { auth: middleware } = NextAuth(authConfig)
export const { auth } = NextAuth(authConfig)
export { auth as proxy }
