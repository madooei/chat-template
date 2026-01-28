import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { BotMessageSquareIcon } from 'lucide-react';

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
      <ThemeToggle />
    </header>
  );
};

export default Header;
