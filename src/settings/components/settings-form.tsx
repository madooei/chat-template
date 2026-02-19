import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import type { SettingsType } from "@/settings/types/settings";

interface SettingsFormProps {
  initialValues: SettingsType;
  onSubmit: (values: SettingsType) => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  initialValues,
  onSubmit,
}) => {
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [openRouterApiKey, setOpenRouterApiKey] = useState(
    initialValues.openRouterApiKey,
  );
  const [mastraEndpoint, setMastraEndpoint] = useState(
    initialValues.mastraEndpoint ?? "",
  );
  const [showApiKey, setShowApiKey] = useState(false);

  const hasChanges =
    displayName !== initialValues.displayName ||
    openRouterApiKey !== initialValues.openRouterApiKey ||
    mastraEndpoint !== (initialValues.mastraEndpoint ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      displayName: displayName.trim(),
      openRouterApiKey: openRouterApiKey.trim(),
      mastraEndpoint: mastraEndpoint.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="openRouterApiKey" className="text-sm font-medium">
          OpenRouter API Key
        </label>
        <div className="relative">
          <input
            id="openRouterApiKey"
            type={showApiKey ? "text" : "password"}
            value={openRouterApiKey}
            onChange={(e) => setOpenRouterApiKey(e.target.value)}
            placeholder="Enter your OpenRouter API key"
            className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
            className="absolute right-0 top-0 h-full w-10"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Warning: Client-side API keys are subject to XSS attacks. Use this for
          local development only.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="mastraEndpoint" className="text-sm font-medium">
          Mastra Server URL
        </label>
        <input
          id="mastraEndpoint"
          type="text"
          value={mastraEndpoint}
          onChange={(e) => setMastraEndpoint(e.target.value)}
          placeholder="http://localhost:4111"
          className="rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          URL of the Mastra server for agent-powered chats. Leave blank to use
          the default.
        </p>
      </div>

      <Button type="submit" disabled={!hasChanges}>
        Save
      </Button>
    </form>
  );
};

export default SettingsForm;
