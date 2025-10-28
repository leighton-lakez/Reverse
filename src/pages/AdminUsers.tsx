import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { ArrowLeft, Search, Shield, Ban, UserCheck, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  location: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { isAdmin, requireAdmin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "ban" | "unban" | "admin" | "unadmin" | "delete" | null;
  }>({ open: false, action: null });

  useEffect(() => {
    requireAdmin();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Combine auth users with profiles
      const combinedUsers = authUsers.users.map((authUser) => {
        const profile = profiles?.find((p) => p.id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || "",
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          location: profile?.location || null,
          is_admin: profile?.is_admin || false,
          is_banned: profile?.is_banned || false,
          created_at: authUser.created_at,
        };
      });

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionDialog.action) return;

    try {
      let updateData: any = {};

      switch (actionDialog.action) {
        case "ban":
          updateData = { is_banned: true };
          break;
        case "unban":
          updateData = { is_banned: false };
          break;
        case "admin":
          updateData = { is_admin: true };
          break;
        case "unadmin":
          updateData = { is_admin: false };
          break;
        case "delete":
          // Delete user profile and auth account
          const { error: deleteError } = await supabase.auth.admin.deleteUser(
            selectedUser.id
          );
          if (deleteError) throw deleteError;

          toast({
            title: "User Deleted",
            description: `${selectedUser.email} has been permanently deleted.`,
          });
          fetchUsers();
          setActionDialog({ open: false, action: null });
          setSelectedUser(null);
          return;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", selectedUser.id);

        if (error) throw error;

        // Log admin action
        await supabase.from("admin_actions").insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: actionDialog.action,
          target_type: "user",
          target_id: selectedUser.id,
          details: { email: selectedUser.email },
        });

        toast({
          title: "Success",
          description: `User ${actionDialog.action} action completed.`,
        });

        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error performing action:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setActionDialog({ open: false, action: null });
      setSelectedUser(null);
    }
  };

  const openActionDialog = (user: User, action: typeof actionDialog.action) => {
    setSelectedUser(user);
    setActionDialog({ open: true, action });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-sm text-muted-foreground">
                  {users.length} total users
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="glass rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.display_name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.display_name?.[0]?.toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">
                            {user.display_name || "No name"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">
                        {user.location || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.is_admin && (
                            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
                              Admin
                            </span>
                          )}
                          {user.is_banned && (
                            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                              Banned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {!user.is_admin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionDialog(user, "admin")}
                              title="Make Admin"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionDialog(user, "unadmin")}
                              title="Remove Admin"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {!user.is_banned ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionDialog(user, "ban")}
                              title="Ban User"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionDialog(user, "unban")}
                              title="Unban User"
                              className="text-green-500"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openActionDialog(user, "delete")}
                            title="Delete User"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {actionDialog.action === "ban" &&
                `Are you sure you want to ban ${selectedUser?.email}?`}
              {actionDialog.action === "unban" &&
                `Are you sure you want to unban ${selectedUser?.email}?`}
              {actionDialog.action === "admin" &&
                `Are you sure you want to make ${selectedUser?.email} an admin?`}
              {actionDialog.action === "unadmin" &&
                `Are you sure you want to remove admin privileges from ${selectedUser?.email}?`}
              {actionDialog.action === "delete" &&
                `Are you sure you want to permanently delete ${selectedUser?.email}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              variant={actionDialog.action === "delete" ? "destructive" : "default"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
