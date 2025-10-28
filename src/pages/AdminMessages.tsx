import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Flag, Check, X, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { ReverseIcon } from "@/components/ReverseIcon";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  sender: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
};

const AdminMessages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, loading, requireAdmin } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState(searchParams.get('filter') || "all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [showFlagDialog, setShowFlagDialog] = useState(false);

  useEffect(() => {
    if (!loading) {
      requireAdmin('/');
    }
  }, [loading, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();

      // Real-time subscription
      const subscription = supabase
        .channel('admin-all-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    filterMessages();
  }, [messages, searchQuery, filterType]);

  const fetchMessages = async () => {
    try {
      // Fetch messages first
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.receiver_id)
      ])];

      // Fetch all related profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by ID
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      // Combine messages with profile data
      const enrichedMessages = messagesData.map(msg => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id) || { id: msg.sender_id, display_name: 'Unknown', avatar_url: null },
        receiver: profilesMap.get(msg.receiver_id) || { id: msg.receiver_id, display_name: 'Unknown', avatar_url: null }
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.receiver?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    if (filterType === 'flagged') {
      filtered = filtered.filter((msg) => msg.is_flagged);
    } else if (filterType === 'unflagged') {
      filtered = filtered.filter((msg) => !msg.is_flagged);
    }

    setFilteredMessages(filtered);
  };

  const handleFlagMessage = async (messageId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({
          is_flagged: true,
          flag_reason: reason,
          flagged_by: user.id,
          flagged_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'flag_message',
        target_type: 'message',
        target_id: messageId,
        reason: reason,
      });

      toast({
        title: 'Success',
        description: 'Message flagged successfully',
      });

      fetchMessages();
      setShowFlagDialog(false);
      setFlagReason("");
    } catch (error) {
      console.error('Error flagging message:', error);
      toast({
        title: 'Error',
        description: 'Failed to flag message',
        variant: 'destructive',
      });
    }
  };

  const handleUnflagMessage = async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({
          is_flagged: false,
          flag_reason: null,
          flagged_by: null,
          flagged_at: null,
        })
        .eq('id', messageId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'unflag_message',
        target_type: 'message',
        target_id: messageId,
      });

      toast({
        title: 'Success',
        description: 'Message unflagged successfully',
      });

      fetchMessages();
    } catch (error) {
      console.error('Error unflagging message:', error);
      toast({
        title: 'Error',
        description: 'Failed to unflag message',
        variant: 'destructive',
      });
    }
  };

  if (loading || loadingMessages) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ReverseIcon className="w-12 h-12 animate-pulse" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-black tracking-tighter text-gradient">
                Message Monitoring
              </h1>
              <p className="text-xs text-muted-foreground">View and moderate all messages</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="flagged">Flagged Only</SelectItem>
              <SelectItem value="unflagged">Unflagged Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-gradient">{messages.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Flagged</p>
            <p className="text-2xl font-bold text-red-500">
              {messages.filter((m) => m.is_flagged).length}
            </p>
          </Card>
          <Card className="p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground mb-1">Showing</p>
            <p className="text-2xl font-bold">{filteredMessages.length}</p>
          </Card>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`p-4 ${message.is_flagged ? 'border-red-500/50 bg-red-500/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">
                        {message.sender?.display_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm font-semibold">
                        {message.receiver?.display_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                      {message.is_flagged && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-medium">
                          Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-sm break-words">{message.content}</p>
                    {message.flag_reason && (
                      <p className="text-xs text-red-500 mt-2">
                        <Flag className="inline h-3 w-3 mr-1" />
                        {message.flag_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {message.is_flagged ? (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleUnflagMessage(message.id)}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        title="Unflag"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowFlagDialog(true);
                        }}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        title="Flag"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No messages found</p>
            </Card>
          )}
        </div>
      </div>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flag Message</DialogTitle>
            <DialogDescription>
              Provide a reason for flagging this message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for flagging..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedMessage && handleFlagMessage(selectedMessage.id, flagReason)}
              disabled={!flagReason.trim()}
            >
              Flag Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;
