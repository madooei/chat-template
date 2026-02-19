import { toast } from "sonner";

// In Phase 2, individual message mutations (edit/delete) are not yet
// implemented on the backend. This hook is kept as a placeholder to
// maintain the same API surface for components.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useMutationMessage(_messageId: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const editMessage = async (_updates: {
    content?: string;
  }): Promise<boolean> => {
    toast.error("Message editing is not yet supported");
    return false;
  };

  const deleteMessage = async (): Promise<boolean> => {
    toast.error("Message deletion is not yet supported");
    return false;
  };

  return {
    edit: editMessage,
    delete: deleteMessage,
  };
}
