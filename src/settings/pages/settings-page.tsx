import { $router } from "@/app/router";
import { useQuerySettings } from "@/settings/hooks/use-query-settings";
import { useMutationSettings } from "@/settings/hooks/use-mutation-settings";
import SettingsForm from "@/settings/components/settings-form";
import type { SettingsType } from "@/settings/types/settings";

const SettingsPage: React.FC = () => {
  const { data: settings } = useQuerySettings();
  const { edit } = useMutationSettings();

  const handleSubmit = (values: SettingsType) => {
    edit(values);
  };

  const handleBack = () => {
    $router.open("/");
  };

  return (
    <SettingsForm
      initialValues={settings}
      onSubmit={handleSubmit}
      onBack={handleBack}
    />
  );
};

export default SettingsPage;
