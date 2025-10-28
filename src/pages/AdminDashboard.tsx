import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Package, MessageSquare, Flag, Ban, TrendingUp, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { ReverseIcon } from "@/components/ReverseIcon";
import { toast } from "@/hooks/use-toast";

type AdminStats = {
  total_users: number;
  new_users_today: number;
  new_users_week: number;
  total_listings: number;
  active_listings: number;
  flagged_listings: number;
  total_messages: number;
  messages_today: number;
  flagged_messages: number;
  banned_users: number;
};

type RecentActivity = {
  id: string;
  type: 'user' | 'listing' | 'message';
  action: string;
  timestamp: Date;
  user?: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading, requireAdmin } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading) {
      requireAdmin('/');
    }
  }, [loading, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchRecentActivity();

      // Set up real-time subscriptions
      const itemsSubscription = supabase
        .channel('admin-items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
          fetchStats();
          fetchRecentActivity();
        })
        .subscribe();

      const messagesSubscription = supabase
        .channel('admin-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchStats();
        })
        .subscribe();

      const profilesSubscription = supabase
        .channel('admin-profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchStats();
        })
        .subscribe();

      return () => {
        itemsSubscription.unsubscribe();
        messagesSubscription.unsubscribe();
        profilesSubscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch counts manually since views might not work
      const [usersResult, itemsResult, messagesResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      const [newUsersToday, newUsersWeek, activeListings, flaggedListings, messagesToday, flaggedMessages, bannedUsers] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('moderation_status', 'flagged'),
        supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      ]);

      setStats({
        total_users: usersResult.count || 0,
        new_users_today: newUsersToday.count || 0,
        new_users_week: newUsersWeek.count || 0,
        total_listings: itemsResult.count || 0,
        active_listings: activeListings.count || 0,
        flagged_listings: flaggedListings.count || 0,
        total_messages: messagesResult.count || 0,
        messages_today: messagesToday.count || 0,
        flagged_messages: flaggedMessages.count || 0,
        banned_users: bannedUsers.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: recentItems } = await supabase
        .from('items')
        .select('id, title, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentItems || recentItems.length === 0) {
        setRecentActivity([]);
        return;
      }

      // Fetch profiles for these items
      const userIds = recentItems.map(item => item.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profilesMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

      const activities: RecentActivity[] = recentItems.map(item => ({
        id: item.id,
        type: 'listing' as const,
        action: 'New listing created',
        timestamp: new Date(item.created_at),
        user: profilesMap.get(item.user_id) || 'Unknown',
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ReverseIcon className="w-12 h-12 animate-pulse" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, onClick }: any) => (
    <Card
      className="p-4 sm:p-6 cursor-pointer hover:shadow-glow transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gradient">{value}</p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-500 text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ReverseIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tighter text-gradient">ADMIN</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Dashboard & Moderation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary">Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats?.total_users || 0}
            subtitle={`${stats?.new_users_today || 0} new today`}
            trend={`+${stats?.new_users_week || 0} this week`}
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            icon={Package}
            title="Total Listings"
            value={stats?.total_listings || 0}
            subtitle={`${stats?.active_listings || 0} active`}
            onClick={() => navigate('/admin/listings')}
          />
          <StatCard
            icon={MessageSquare}
            title="Messages"
            value={stats?.total_messages || 0}
            subtitle={`${stats?.messages_today || 0} today`}
            onClick={() => navigate('/admin/messages')}
          />
          <StatCard
            icon={Flag}
            title="Flagged Listings"
            value={stats?.flagged_listings || 0}
            subtitle="Needs review"
            onClick={() => navigate('/admin/listings?filter=flagged')}
          />
          <StatCard
            icon={Flag}
            title="Flagged Messages"
            value={stats?.flagged_messages || 0}
            subtitle="Needs review"
            onClick={() => navigate('/admin/messages?filter=flagged')}
          />
          <StatCard
            icon={Ban}
            title="Banned Users"
            value={stats?.banned_users || 0}
            subtitle="Currently banned"
            onClick={() => navigate('/admin/users?filter=banned')}
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Button
              onClick={() => navigate('/admin/messages')}
              variant="outline"
              className="w-full h-auto py-3 flex-col gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs sm:text-sm">View All Messages</span>
            </Button>
            <Button
              onClick={() => navigate('/admin/listings')}
              variant="outline"
              className="w-full h-auto py-3 flex-col gap-2"
            >
              <Package className="h-5 w-5" />
              <span className="text-xs sm:text-sm">Moderate Listings</span>
            </Button>
            <Button
              onClick={() => navigate('/admin/users')}
              variant="outline"
              className="w-full h-auto py-3 flex-col gap-2"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs sm:text-sm">Manage Users</span>
            </Button>
            <Button
              onClick={() => navigate('/admin/reports')}
              variant="outline"
              className="w-full h-auto py-3 flex-col gap-2"
            >
              <Flag className="h-5 w-5" />
              <span className="text-xs sm:text-sm">View Reports</span>
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
