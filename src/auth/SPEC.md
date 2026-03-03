# Auth

## Purpose

Provides user authentication so conversations and settings are tied to individual accounts. Users see an auth page where they can sign in or sign up with email/password, or continue as a guest via anonymous sign-in. Email verification is required after sign-up (via 8-digit OTP), and password reset is supported via the same OTP mechanism.

## Scope

**Does:**

- Render a sign-in/sign-up form with email and password fields
- Validate credentials client-side before submission (email format, 8+ char password)
- Map Convex auth errors to user-friendly toast messages
- Support anonymous sign-in via a "Continue as Guest" button
- Track submission state to prevent double-submits
- Switch between sign-in and sign-up flows via tabs
- Show a sign-out button in the header
- Require email verification via 8-digit OTP after sign-up before accessing the app
- Provide password reset flow via OTP (request code → enter code + new password)
- Show password strength hints (checklist) during sign-up
- Enforce strong password requirements on the server (environment-aware: dev vs production)

**Does NOT:**

- Manage user profile data (that's the settings feature)
- Handle session persistence or token refresh (managed by `ConvexAuthProvider`)
- Protect backend endpoints (that's `queryWithAuth`/`mutationWithAuth` in `convex/lib.ts`)
- Control which app shell renders for authenticated vs unauthenticated users (that's `src/App.tsx`)
- Handle email delivery configuration (that's Resend + `AUTH_RESEND_KEY` env var on Convex deployment)

## Key Behaviors

1. When a user visits the app unauthenticated, the auth page is shown with a tabbed sign-in/sign-up form and a guest button
2. When a user submits valid credentials on the sign-in tab, a `signIn("password", formData)` call is made with `flow: "signIn"`
3. When a user submits valid credentials on the sign-up tab, a `signIn("password", formData)` call is made with `flow: "signUp"`
4. If the email or password is invalid client-side, validation errors are shown inline without calling the backend
5. If the backend returns `InvalidAccountId` or `InvalidSecret`, a toast shows "Invalid email or password"
6. If the backend returns `AccountAlreadyExists`, a toast shows "An account with this email already exists"
7. If the backend returns an unknown error during sign-in, a toast shows "Could not sign in. Please try again."
8. If the backend returns an unknown error during sign-up, a toast shows "Could not create account. Please try again."
9. When a user clicks "Continue as Guest", a `signIn("anonymous")` call is made
10. If anonymous sign-in fails, a toast shows "Could not sign in as guest. Please try again."
11. While any auth operation is in progress, all form buttons are disabled
12. When the user is authenticated, a sign-out button appears in the header
13. After sign-up (or unverified sign-in), the verify-code form is shown; the user enters the 8-digit OTP from their email
14. If the OTP is invalid or expired, a toast shows "Invalid or expired code. Please try again."
15. When a user clicks "Forgot password?", the forgot-password form is shown with email input → code + new password
16. If the password reset code request fails, a toast shows "Could not send reset code. Please try again."
17. If the password reset fails, a toast shows "Could not reset password. Please try again."
18. If the server rejects a weak password (via `ConvexError("INVALID_PASSWORD")`), a toast shows "Password does not meet requirements"
19. During sign-up, password strength hints appear as a checklist (green check for met, circle for unmet)

## Dependencies

- `@convex-dev/auth/react` — `useAuthActions()` for `signIn` and `signOut`
- `convex/auth.ts` — registers `Anonymous` and `Password` providers (with verify + reset)
- `convex/values` — `ConvexError` for structured error identification
- `sonner` — toast notifications for auth errors
- `zod` — form validation schema
- `resend` — email delivery for OTP codes (backend)
- `oslo/crypto` — secure random OTP generation (backend)
- `@react-email/components` — email templates (backend)
- `input-otp` — 8-digit code input component (frontend)

## Known Gaps

- No OAuth/social login providers
- Anonymous users have no way to upgrade to a full account
- The "Continue as Guest" button is always shown with no configuration to hide it

## Files

| File                                  | Purpose                                               |
| ------------------------------------- | ----------------------------------------------------- |
| `types/auth.ts`                       | Zod schema for credentials, AuthFlow, AuthStep types  |
| `types/password.ts`                   | Password requirement rules for strength hints         |
| `hooks/use-auth.ts`                   | Auth actions, error mapping, step state, OTP handlers |
| `components/auth-form.tsx`            | Tabbed sign-in/sign-up form with password hints       |
| `components/code-input.tsx`           | 8-digit OTP input (wraps shadcn InputOTP)             |
| `components/verify-code-form.tsx`     | Email verification step after sign-up                 |
| `components/forgot-password-form.tsx` | Password reset flow (email → code + new password)     |
| `pages/auth-page.tsx`                 | Multi-step auth page (signIn/verify/forgot)           |
