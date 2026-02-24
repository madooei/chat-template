import { useLocation } from "wouter";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFoundPage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
      </div>
      <Button variant="outline" onClick={() => setLocation("/")}>
        Return home
      </Button>
    </div>
  );
};

export default NotFoundPage;
