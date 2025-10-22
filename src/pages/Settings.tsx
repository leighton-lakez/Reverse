import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  History, 
  Moon, 
  Sun, 
  LogOut, 
  Bell, 
  Lock, 
  HelpCircle,
  ChevronRight,
  Mail,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReverseIcon } from "@/components/ReverseIcon";

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    });

    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: "Theme updated",
      description: `Switched to ${newDarkMode ? 'dark' : 'light'} mode`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-8 h-8" />
              <h1 className="text-xl font-black tracking-tighter text-gradient">REVERSE</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Account Info Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Account Information</h2>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Display Name</p>
                <p className="font-medium text-foreground truncate">
                  {profile?.display_name || "User"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground truncate">
                  {user?.email || "Not provided"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium text-foreground">
                  {user?.created_at ? formatDate(user.created_at) : "Unknown"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
          <Card className="divide-y divide-border">
            <button
              onClick={toggleDarkMode}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                <div className="text-left">
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {darkMode ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </button>

            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Push notifications for messages
                  </p>
                </div>
              </div>
              <Switch 
                checked={notificationsEnabled} 
                onCheckedChange={setNotificationsEnabled} 
              />
            </button>
          </Card>
        </div>

        {/* Actions Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Actions</h2>
          <Card className="divide-y divide-border">
            <button
              onClick={() => navigate("/profile")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Purchase History</p>
                  <p className="text-sm text-muted-foreground">View your past orders</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Sales History</p>
                  <p className="text-sm text-muted-foreground">View your sold items</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => toast({ title: "Coming soon", description: "Privacy settings will be available soon" })}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Privacy & Security</p>
                  <p className="text-sm text-muted-foreground">Manage your privacy</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => toast({ title: "Need help?", description: "Contact support at support@example.com" })}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Help & Support</p>
                  <p className="text-sm text-muted-foreground">Get assistance</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Logout Button */}
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="destructive"
          className="w-full gap-2"
          size="lg"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Settings;
