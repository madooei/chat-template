import { BotMessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import AuthForm from "@/auth/components/auth-form";
import { useAuth } from "@/auth/hooks/use-auth";

const AuthPage: React.FC = () => {
  const { handleAuth, handleAnonymousSignIn, isSubmitting } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <BotMessageSquareIcon aria-hidden="true" />
          <span className="font-semibold text-lg">Chat Template</span>
        </div>
        <AuthForm onSubmit={handleAuth} isSubmitting={isSubmitting} />
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {/* "Continue as Guest" relies on the Anonymous provider registered in convex/auth.ts */}
        <Button
          variant="outline"
          className="w-full"
          disabled={isSubmitting}
          onClick={handleAnonymousSignIn}
        >
          Continue as Guest
        </Button>
      </div>
    </div>
  );
};

export default AuthPage;
