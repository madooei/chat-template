import { useState } from "react";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInSchema } from "@/auth/types/auth";
import type { AuthFlow } from "@/auth/types/auth";
import { strongPasswordRequirements } from "@/auth/types/password";

interface AuthFormProps {
  onSubmit: (flow: AuthFlow, email: string, password: string) => void;
  onForgotPassword: () => void;
  isSubmitting: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit,
  onForgotPassword,
  isSubmitting,
}) => {
  const [flow, setFlow] = useState<AuthFlow>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    onSubmit(flow, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex gap-1 rounded-md bg-muted p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            flow === "signIn"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setFlow("signIn")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            flow === "signUp"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setFlow("signUp")}
        >
          Sign Up
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          {flow === "signIn" && (
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          )}
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete={flow === "signIn" ? "current-password" : "new-password"}
          required
        />
      </div>

      {flow === "signUp" && password.length > 0 && (
        <ul
          className="flex flex-col gap-1 text-xs"
          aria-label="Password requirements"
        >
          {strongPasswordRequirements.map((req) => {
            const met = req.test(password);
            return (
              <li
                key={req.label}
                className={cn(
                  "flex items-center gap-1.5",
                  met
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground",
                )}
              >
                {met ? (
                  <CheckCircle2Icon className="h-3.5 w-3.5" />
                ) : (
                  <CircleIcon className="h-3.5 w-3.5" />
                )}
                {req.label}
              </li>
            );
          })}
        </ul>
      )}

      {validationError && (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Loading..."
          : flow === "signIn"
            ? "Sign In"
            : "Sign Up"}
      </Button>
    </form>
  );
};

export default AuthForm;
