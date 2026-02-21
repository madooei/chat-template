import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [mastraEndpoint, setMastraEndpoint] = useState(
    initialValues.mastraEndpoint ?? "",
  );

  const hasChanges =
    displayName !== initialValues.displayName ||
    mastraEndpoint !== (initialValues.mastraEndpoint ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      displayName: displayName.trim(),
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
