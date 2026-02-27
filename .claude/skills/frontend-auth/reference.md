# Auth Reference

Detailed patterns and code examples for the authentication system.

---

## Backend: Provider Registration

`convex/auth.ts` — the single source of truth for available auth providers:

```typescript
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Anonymous, Password],
});
```

The `Anonymous` provider enables guest access. The `Password` provider enables email/password sign-in/sign-up. Both are always registered; `AUTH_MODE` only controls which frontend UI is shown.

---

## Backend: Auth Wrappers

`convex/lib.ts` provides auth-enforcing function wrappers:

```typescript
export const queryWithAuth = customQuery(baseQuery, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return { ctx: { userId }, args: {} };
  },
});
```

`mutationWithAuth` and `actionWithAuth` follow the same pattern. All inject `ctx.userId` of type `Id<"users">` into the handler context.

---

## Frontend: AUTH_MODE Configuration

`src/config/env.ts`:

```typescript
export const AUTH_MODE: "anonymous" | "password" =
  import.meta.env.VITE_AUTH_MODE === "password" ? "password" : "anonymous";
```

Set `VITE_AUTH_MODE=password` in `.env` to enable the login page. Defaults to anonymous.

---

## Frontend: App Routing by Auth Mode

`src/App.tsx` renders different top-level components:

```typescript
return AUTH_MODE === "password" ? <PasswordApp /> : <AnonymousApp />;
```

**PasswordApp** uses Convex's auth-aware components:

```typescript
<AuthLoading>{
  /* shown while checking session */
}<Unauthenticated>;
{
  /* shows AuthPage */
}
<Authenticated>{
  /* shows MainApp */
};
```

**AnonymousApp** uses `useAutoSignIn()` to silently authenticate, then renders `MainApp`.

---

## Frontend: useAuth Hook

`src/auth/hooks/use-auth.ts` — manages authentication state and actions:

```typescript
export function useAuth() {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (
    flow: AuthFlow,
    email: string,
    password: string,
  ) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", flow);
      await signIn("password", formData);
    } catch (err) {
      toast.error(friendlyAuthError(err, flow));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signIn("anonymous");
    } catch {
      toast.error("Could not sign in as guest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleAuth, handleAnonymousSignIn, isSubmitting };
}
```

Sign-out is handled separately — `SignOutButton` in `src/layout/header.tsx` calls `useAuthActions().signOut()` directly. This is only rendered when `AUTH_MODE === "password"`.

---

## Frontend: Form Validation

`src/auth/types/auth.ts`:

```typescript
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignInData = z.infer<typeof signInSchema>;
export type AuthFlow = "signIn" | "signUp";
```

`AuthForm` validates against `signInSchema` before calling `onSubmit`. Validation errors are shown inline.

---

## Frontend: AuthForm Component

`src/auth/components/auth-form.tsx` — tabbed form with sign-in and sign-up:

- Tabs switch between "Sign In" and "Sign Up" (sets the `flow` field)
- Email input with type `email`
- Password input with `autocomplete` switching:
  - `"current-password"` for sign-in
  - `"new-password"` for sign-up
- Submit button disabled while `isSubmitting` is true
- Props: `onSubmit: (flow, email, password) => void` and `isSubmitting: boolean`

---

## Frontend: useAutoSignIn Hook

`src/hooks/use-auto-sign-in.ts` — used only in anonymous mode:

```typescript
export function useAutoSignIn() {
  // Calls signIn("anonymous") on mount
  // Returns { isLoading, isAuthenticated, error }
}
```

---

## Testing Auth

### Hook tests (`src/auth/hooks/__tests__/use-auth.test.ts`):

Mock `@convex-dev/auth/react` and `sonner`:

```typescript
const mockSignIn = vi.fn();
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));
```

Test categories:

- Error mapping (all `friendlyAuthError` branches)
- `handleAuth` form data construction
- `handleAnonymousSignIn` provider call
- `isSubmitting` state transitions (before, during, after)

### Component tests (`src/auth/components/__tests__/auth-form.test.tsx`):

- Form rendering with correct fields
- Tab switching between sign-in/sign-up
- Validation error display
- Form submission with correct arguments
- Disabled state during submission

### Backend tests (`convex/users.test.ts`):

- Unauthenticated access rejected
- `getMe` returns user data
- `updateMe` persists changes
- User isolation (one user's data doesn't leak to another)
