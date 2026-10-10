'use client';

import { useRef, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LucideLogIn } from "lucide-react";

import { OTP_LENGTH } from "@/lib/otp";

// Submits straight to the Auth.js email callback, which verifies the code,
// signs the user in and redirects to the callback URL, or to the error page.
export default function EmailCodeForm({
  provider,
  email,
  callbackUrl,
}: {
  provider: string;
  email: string;
  callbackUrl?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const complete = code.length === OTP_LENGTH;

  return (
    <form
      ref={formRef}
      method="get"
      action={`/api/auth/callback/${encodeURIComponent(provider)}`}
      className="flex flex-col items-center gap-5"
      onSubmit={(e) => {
        // Read the field itself: onComplete submits before state re-renders.
        const token = String(new FormData(e.currentTarget).get("token") ?? "");
        if (token.length !== OTP_LENGTH || submitting) {
          e.preventDefault();
          return;
        }
        setSubmitting(true);
      }}
    >
      <input type="hidden" name="email" value={email} />
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <InputOTP
        name="token"
        maxLength={OTP_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={code}
        onChange={setCode}
        onComplete={() => formRef.current?.requestSubmit()}
        readOnly={submitting}
        aria-label="Sign in code"
      >
        <InputOTPGroup>
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <Button type="submit" disabled={!complete || submitting}>
        <LucideLogIn /> Sign in
      </Button>
    </form>
  );
}
