import { randomInt } from "node:crypto"
import { createTransport } from "nodemailer"
import type { Adapter } from "next-auth/adapters"
import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email"
import type { NodemailerConfig } from "next-auth/providers/nodemailer"
import { OTP_LENGTH, OTP_MAX_ATTEMPTS } from "@/lib/otp"

export { OTP_LENGTH, OTP_MAX_AGE_SECONDS, OTP_MAX_ATTEMPTS } from "@/lib/otp"

export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0")
}

// Mirrors the first steps of Auth.js' default normalizer so the email we carry
// to the code entry page matches the identifier the token was stored under.
export function normalizeEmail(email: string): string {
  return email.normalize("NFKC").toLowerCase().trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function otpEmail({ code, host, minutes }: { code: string; host: string; minutes: number }) {
  const safeHost = escapeHtml(host)
  return {
    subject: `${code} is your sign-in code for ${host}`,
    text: `Your sign-in code for ${host} is ${code}\n\nThe code expires in ${minutes} minutes.\nIf you did not request this email you can safely ignore it.\n`,
    html: `<body style="background:#f9f9f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background:#fff;max-width:600px;margin:auto;border-radius:10px;">
    <tr><td align="center" style="padding:10px 0;font-size:20px;color:#444;">Sign in to <strong>${safeHost}</strong></td></tr>
    <tr><td align="center" style="padding:10px 0;font-size:16px;color:#444;">Enter this code to sign in:</td></tr>
    <tr><td align="center" style="padding:10px 0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;">${code}</td></tr>
    <tr><td align="center" style="padding:0 0 10px;font-size:14px;color:#666;">The code expires in ${minutes} minutes.<br />If you did not request this email you can safely ignore it.</td></tr>
  </table>
</body>`,
  }
}

export async function sendOtpVerificationRequest(params: EmailProviderSendVerificationRequestParams) {
  const { identifier, token, url, expires } = params
  const provider = params.provider as NodemailerConfig
  const { host } = new URL(url)
  const minutes = Math.max(1, Math.round((expires.getTime() - Date.now()) / 60000))
  const transport = createTransport(provider.server)
  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    ...otpEmail({ code: token, host, minutes }),
  })
  const failed = [...(result.rejected || []), ...(result.pending || [])].filter(Boolean)
  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`)
  }
}

export interface VerificationTokenStore {
  deleteMany(args: { where: { identifier: string; attempts?: { gte: number } } }): Promise<unknown>
  updateMany(args: { where: { identifier: string }; data: { attempts: { increment: number } } }): Promise<unknown>
}

// A six digit code is easy to guess, so only the latest code per email is kept
// and it is discarded after too many wrong guesses.
export function withOtpGuard(
  adapter: Adapter,
  store: VerificationTokenStore,
  maxAttempts = OTP_MAX_ATTEMPTS,
): Adapter {
  const { createVerificationToken: createToken, useVerificationToken: consumeToken } = adapter
  if (!createToken || !consumeToken) {
    throw new Error("Adapter must support verification tokens")
  }

  return {
    ...adapter,
    async createVerificationToken(token) {
      await store.deleteMany({ where: { identifier: token.identifier } })
      return createToken(token)
    },
    async useVerificationToken(params) {
      // Without an identifier a guess cannot be attributed to an email.
      if (!params.identifier) return null
      const token = await consumeToken(params)
      if (!token) {
        const where = { identifier: params.identifier }
        await store.updateMany({ where, data: { attempts: { increment: 1 } } })
        await store.deleteMany({ where: { ...where, attempts: { gte: maxAttempts } } })
      }
      return token
    },
  }
}
