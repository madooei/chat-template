import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipButton } from "@/components/tooltip-button";
import { $router } from "@/app/router";
import { BotMessageSquareIcon, Settings } from "lucide-react";

const DEBUG = false;

const Header: React.FC = () => {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-1 w-full py-1 border-b",
        {
          "border-2 border-green-500": DEBUG,
        },
      )}
    >
      <BotMessageSquareIcon />
      <div className="flex items-center gap-1">
        <TooltipButton
          variant="ghost"
          size="icon"
          className="w-7 h-7"
          tooltipContent="Settings"
          onClick={() => $router.open("/settings")}
        >
          <Settings className="h-4 w-4" />
        </TooltipButton>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
