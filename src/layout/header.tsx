import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipButton } from "@/components/tooltip-button";
import { BotMessageSquareIcon, Menu, Settings } from "lucide-react";
import SettingsDialog from "@/settings/pages/settings-page";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "flex items-center justify-between gap-2 w-full px-3 py-2 border-b",
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <BotMessageSquareIcon aria-hidden="true" />
          <span className="font-semibold text-sm">Chat Template</span>
        </div>
        <div className="flex items-center gap-2">
          <TooltipButton
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            tooltipContent="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </TooltipButton>
          <ThemeToggle />
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default Header;
