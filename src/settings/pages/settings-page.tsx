import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuerySettings } from "@/settings/hooks/use-query-settings";
import { useMutationSettings } from "@/settings/hooks/use-mutation-settings";
import SettingsForm from "@/settings/components/settings-form";
import type { SettingsType } from "@/settings/types/settings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: settings } = useQuerySettings();
  const { edit } = useMutationSettings();

  const handleSubmit = (values: SettingsType) => {
    edit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsForm initialValues={settings} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
