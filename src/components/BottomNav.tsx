import { Home, PlusCircle, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-1 py-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className={`flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10 ${
              location.pathname === "/" ? "text-primary" : ""
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Browse</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate("/sell")}
            className={`flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10 ${
              location.pathname === "/sell" ? "text-primary" : ""
            }`}
          >
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs font-medium">Sell</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate("/notifications")}
            className={`flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10 ${
              location.pathname === "/notifications" ? "text-primary" : ""
            }`}
          >
            <Bell className="h-6 w-6" />
            <span className="text-xs font-medium">Notifications</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className={`flex flex-col items-center gap-1 h-auto py-2 hover:text-primary hover:bg-primary/10 ${
              location.pathname === "/profile" ? "text-primary" : ""
            }`}
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
