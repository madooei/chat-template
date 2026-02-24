# Auth

## Purpose

Provides user authentication so conversations and settings are tied to individual accounts. Supports two modes: anonymous (silent auto-sign-in for zero-friction access) and password (email/password with optional guest access), letting deployers choose the right trade-off between convenience and identity.

## Scope

**Does:**

- Render a sign-in/sign-up form with email and password fields
- Validate credentials client-side before submission (email format, 8+ char password)
- Map Convex auth errors to user-friendly toast messages
- Support anonymous sign-in via a "Continue as Guest" button
- Track submission state to prevent double-submits
- Switch between sign-in and sign-up flows via tabs
- Show a sign-out button in the header (password mode only)

**Does NOT:**

- Manage user profile data (that's the settings feature)
- Handle session persistence or token refresh (managed by `ConvexAuthProvider`)
- Protect backend endpoints (that's `queryWithAuth`/`mutationWithAuth` in `convex/lib.ts`)
- Control which app shell renders for authenticated vs unauthenticated users (that's `src/App.tsx`)
- Provide password reset or email verification flows

## Key Behaviors

1. When `AUTH_MODE` is `"password"`, the auth page is shown to unauthenticated users with a tabbed sign-in/sign-up form and a guest button
2. When `AUTH_MODE` is `"anonymous"` (default), users are auto-signed-in silently without seeing the auth page
3. When a user submits valid credentials on the sign-in tab, a `signIn("password", formData)` call is made with `flow: "signIn"`
4. When a user submits valid credentials on the sign-up tab, a `signIn("password", formData)` call is made with `flow: "signUp"`
5. If the email or password is invalid client-side, validation errors are shown inline without calling the backend
6. If the backend returns `InvalidAccountId` or `InvalidSecret`, a toast shows "Invalid email or password"
7. If the backend returns `AccountAlreadyExists`, a toast shows "An account with this email already exists"
8. If the backend returns an unknown error during sign-in, a toast shows "Could not sign in. Please try again."
9. If the backend returns an unknown error during sign-up, a toast shows "Could not create account. Please try again."
10. When a user clicks "Continue as Guest", a `signIn("anonymous")` call is made
11. If anonymous sign-in fails, a toast shows "Could not sign in as guest. Please try again."
12. While any auth operation is in progress, all form buttons are disabled
13. When `AUTH_MODE` is `"password"` and the user is authenticated, a sign-out button appears in the header
14. When `AUTH_MODE` is `"anonymous"`, no sign-out button is shown

## Dependencies

- `@convex-dev/auth/react` — `useAuthActions()` for `signIn` and `signOut`
- `convex/auth.ts` — registers `Anonymous` and `Password` providers
- `src/config/env.ts` — exports `AUTH_MODE` to select the auth flow
- `sonner` — toast notifications for auth errors
- `zod` — form validation schema

## Known Gaps

- No password reset flow
- No email verification on sign-up
- No OAuth/social login providers
- Anonymous users in password mode have no way to upgrade to a full account
- The "Continue as Guest" button is always shown in password mode with no configuration to hide it

## Files

| File                       | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `types/auth.ts`            | Zod schema for credentials, AuthFlow type        |
| `hooks/use-auth.ts`        | Auth actions, error mapping, submission state    |
| `components/auth-form.tsx` | Tabbed sign-in/sign-up form with validation      |
| `pages/auth-page.tsx`      | Full auth page layout with form and guest button |
