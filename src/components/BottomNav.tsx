import { Home, PlusCircle, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-1 py-2">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Browse</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs font-medium">Sell</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10"
          >
            <Bell className="h-6 w-6" />
            <span className="text-xs font-medium">Notifications</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10"
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Profile</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
