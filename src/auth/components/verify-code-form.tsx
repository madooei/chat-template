import { useState } from "react";
import { Button } from "@/components/ui/button";
import CodeInput from "@/auth/components/code-input";

interface VerifyCodeFormProps {
  email: string;
  onSubmit: (email: string, code: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const VerifyCodeForm: React.FC<VerifyCodeFormProps> = ({
  email,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, code);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <h2 className="text-lg font-semibold text-center">Check your email</h2>
      <p className="text-sm text-muted-foreground text-center">
        We sent a verification code to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="flex justify-center">
        <CodeInput value={code} onChange={setCode} />
      </div>

      <Button type="submit" disabled={isSubmitting || code.length < 8}>
        {isSubmitting ? "Verifying..." : "Verify"}
      </Button>

      <Button type="button" variant="ghost" onClick={onCancel}>
        Back to sign in
      </Button>
    </form>
  );
};

export default VerifyCodeForm;
