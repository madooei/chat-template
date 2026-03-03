import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { Resend as ResendAPI } from "resend";
import { PasswordResetEmail } from "./emails/PasswordResetEmail";

export const ResendOTPPasswordReset = Email({
  id: "resend-otp-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20,
  async generateVerificationToken() {
    return generateRandomString(8, alphabet("0-9"));
  },
  async sendVerificationRequest({
    identifier: email,
    provider,
    token,
    expires,
  }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL ?? "Chat Template <onboarding@resend.dev>",
      to: [email],
      subject: "Reset password in Chat Template",
      react: PasswordResetEmail({
        code: token,
        validityMinutes: Math.round((+expires - Date.now()) / (60 * 1000)),
      }),
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
