import { createContext, useContext } from "react";

export const SidebarContext = createContext<{ closeSidebar: () => void }>({
  closeSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}
