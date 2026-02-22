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

  const hasChanges = displayName !== initialValues.displayName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      displayName: displayName.trim(),
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

      <Button type="submit" disabled={!hasChanges}>
        Save
      </Button>
    </form>
  );
};

export default SettingsForm;
