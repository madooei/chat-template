import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CodeInput from "@/auth/components/code-input";

interface ForgotPasswordFormProps {
  onRequestReset: (email: string) => Promise<string | null>;
  onResetPassword: (email: string, code: string, newPassword: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

type ForgotStep = "email" | { email: string };

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onRequestReset,
  onResetPassword,
  onCancel,
  isSubmitting,
}) => {
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onRequestReset(email);
    if (result) {
      setForgotStep({ email: result });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof forgotStep === "object") {
      onResetPassword(forgotStep.email, code, newPassword);
    }
  };

  if (forgotStep === "email") {
    return (
      <form
        onSubmit={handleRequestReset}
        className="flex flex-col gap-4 w-full"
      >
        <h2 className="text-lg font-semibold text-center">Reset password</h2>
        <p className="text-sm text-muted-foreground text-center">
          Enter your email to receive a reset code.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="reset-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset code"}
        </Button>

        <Button type="button" variant="ghost" onClick={onCancel}>
          Back to sign in
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="flex flex-col gap-4 w-full">
      <h2 className="text-lg font-semibold text-center">Reset password</h2>
      <p className="text-sm text-muted-foreground text-center">
        Enter the code sent to{" "}
        <span className="font-medium text-foreground">{forgotStep.email}</span>{" "}
        and your new password.
      </p>

      <div className="flex justify-center">
        <CodeInput value={code} onChange={setCode} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="text-sm font-medium">
          New password
        </label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || code.length < 8 || newPassword.length < 8}
      >
        {isSubmitting ? "Resetting..." : "Reset password"}
      </Button>

      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
