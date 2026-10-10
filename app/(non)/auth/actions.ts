"use server"

import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { signIn } from "@/auth"
import { normalizeEmail } from "@/lib/email-otp"

// Sends a sign-in code and moves on to the code entry page, which needs the
// email to complete the Auth.js email callback.
export async function sendEmailCode(formData: FormData) {
  const provider = String(formData.get("provider") ?? "nodemailer")
  const email = normalizeEmail(String(formData.get("email") ?? ""))
  const callbackUrl = String(formData.get("callbackUrl") ?? "")

  try {
    await signIn(provider, { email, redirectTo: callbackUrl, redirect: false })
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/auth/error?error=${error.type}`)
    }
    throw error
  }

  const params = new URLSearchParams({ provider, email })
  if (callbackUrl) params.set("callbackUrl", callbackUrl)
  redirect(`/auth/verify-request?${params}`)
}
