---
name: frontend-auth
description: Authentication system with email/password and guest access. Use when adding auth providers, modifying login/signup flows, working with useAuth hook, protecting routes with Authenticated/Unauthenticated, debugging auth errors, or asking about auth architecture, session management, and @convex-dev/auth integration.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# Frontend Auth Guide

Authentication patterns using `@convex-dev/auth` with anonymous and password providers.

## Related Skills

- **[frontend-hooks](../frontend-hooks/SKILL.md)** — Hook patterns (useAuth follows these conventions)
- **[frontend-types](../frontend-types/SKILL.md)** — Zod schemas (signInSchema)
- **[frontend-features](../frontend-features/SKILL.md)** — Feature module structure
- **[convex-functions](../convex-functions/SKILL.md)** — Auth wrappers (queryWithAuth, mutationWithAuth)
- **[convex-guards](../convex-guards/SKILL.md)** — Server-side authorization

---

## Quick Reference

| Topic         | File                         | Description                                        |
| ------------- | ---------------------------- | -------------------------------------------------- |
| **Reference** | [reference.md](reference.md) | Auth flows, error mapping, backend config patterns |

---

## Module Structure

```plaintext
src/auth/
├── types/
│   └── auth.ts              # signInSchema, SignInData, AuthFlow
├── hooks/
│   ├── use-auth.ts          # handleAuth, handleAnonymousSignIn, isSubmitting
│   └── __tests__/
│       └── use-auth.test.ts
├── components/
│   ├── auth-form.tsx        # Tabbed sign-in/sign-up form
│   └── __tests__/
│       └── auth-form.test.tsx
└── pages/
    └── auth-page.tsx        # Full auth page with form + guest button
```

No `store/` layer — auth state is managed by `ConvexAuthProvider`, not Legend-State.

---

## Key Files Outside the Module

| File                    | Role                                                  |
| ----------------------- | ----------------------------------------------------- |
| `convex/auth.ts`        | Registers providers: `Anonymous`, `Password`          |
| `convex/lib.ts`         | `queryWithAuth` / `mutationWithAuth` wrappers         |
| `src/App.tsx`           | Uses `<Authenticated>` / `<Unauthenticated>` routing  |
| `src/main.tsx`          | Wraps app with `<ConvexAuthProvider>`                 |
| `src/layout/header.tsx` | `SignOutButton` always shown for authenticated users  |

---

## Error Mapping

`friendlyAuthError()` in `use-auth.ts` converts Convex auth errors to user-friendly messages:

| Backend Error          | User Message                                  |
| ---------------------- | --------------------------------------------- |
| `InvalidAccountId`     | "Invalid email or password"                   |
| `InvalidSecret`        | "Invalid email or password"                   |
| `AccountAlreadyExists` | "An account with this email already exists"   |
| `already exists`       | "An account with this email already exists"   |
| _(other, signIn flow)_ | "Could not sign in. Please try again."        |
| _(other, signUp flow)_ | "Could not create account. Please try again." |

---

## Auth Data Flow

```plaintext
AuthPage → AuthForm → useAuth().handleAuth() → signIn("password", formData)
                     → useAuth().handleAnonymousSignIn() → signIn("anonymous")
  ↓
ConvexAuthProvider → convex/auth.ts (Password | Anonymous provider)
  ↓
<Authenticated> renders → MainApp
```

---

## Adding a New Auth Provider

- [ ] Add the provider import in `convex/auth.ts` and register it in `providers[]`
- [ ] Add a new sign-in method in `src/auth/hooks/use-auth.ts`
- [ ] Update error mapping in `friendlyAuthError()` for provider-specific errors
- [ ] Add UI trigger in `src/auth/components/auth-form.tsx` or `src/auth/pages/auth-page.tsx`
- [ ] Add tests for the new flow in `src/auth/hooks/__tests__/use-auth.test.ts`

---

## Detailed Documentation

- [reference.md](reference.md) — Auth flow details, hook signatures, form validation, backend auth wrappers
