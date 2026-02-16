import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Header from "./header";
import { SidebarContext } from "./sidebar-context";

interface LayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ sidebar, content, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SidebarContext.Provider value={{ closeSidebar }}>
      <div
        className={cn(
          "flex min-h-screen w-full antialiased scroll-smooth",
          className,
        )}
      >
        <div className="flex flex-col w-full">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex flex-1 min-h-0">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-80 md:flex-col md:border-r">
              {sidebar}
            </aside>

            {/* Mobile sidebar via Sheet */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full pt-10">{sidebar}</div>
              </SheetContent>
            </Sheet>

            {/* Main content */}
            <main className="flex-1 min-w-0">{content}</main>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Layout;
