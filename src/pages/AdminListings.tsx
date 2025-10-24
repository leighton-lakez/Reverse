import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Flag, Check, Trash2, Eye, Filter } from "lucide-react";
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

type Listing = {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  status: string;
  moderation_status: string;
  flagged_reason: string | null;
  images: string[];
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    display_name: string;
  };
};

const AdminListings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, loading, requireAdmin } = useAdmin();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState(searchParams.get('filter') || "all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (!loading) {
      requireAdmin('/');
    }
  }, [loading, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchListings();

      // Real-time subscription
      const subscription = supabase
        .channel('admin-all-listings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
          fetchListings();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    filterListings();
  }, [listings, searchQuery, filterType]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles!items_user_id_fkey(id, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load listings',
        variant: 'destructive',
      });
    } finally {
      setLoadingListings(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    if (filterType === 'flagged') {
      filtered = filtered.filter((l) => l.moderation_status === 'flagged');
    } else if (filterType === 'pending') {
      filtered = filtered.filter((l) => l.moderation_status === 'pending');
    } else if (filterType === 'removed') {
      filtered = filtered.filter((l) => l.moderation_status === 'removed');
    } else if (filterType === 'approved') {
      filtered = filtered.filter((l) => l.moderation_status === 'approved');
    }

    setFilteredListings(filtered);
  };

  const handleFlagListing = async (listingId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('items')
        .update({
          moderation_status: 'flagged',
          flagged_reason: reason,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'flag_listing',
        target_type: 'listing',
        target_id: listingId,
        reason: reason,
      });

      toast({
        title: 'Success',
        description: 'Listing flagged successfully',
      });

      fetchListings();
      setShowFlagDialog(false);
      setFlagReason("");
    } catch (error) {
      console.error('Error flagging listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to flag listing',
        variant: 'destructive',
      });
    }
  };

  const handleApproveListing = async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('items')
        .update({
          moderation_status: 'approved',
          flagged_reason: null,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'approve_listing',
        target_type: 'listing',
        target_id: listingId,
      });

      toast({
        title: 'Success',
        description: 'Listing approved successfully',
      });

      fetchListings();
    } catch (error) {
      console.error('Error approving listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve listing',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteListing = async (listingId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'delete_listing',
        target_type: 'listing',
        target_id: listingId,
        reason: reason,
      });

      toast({
        title: 'Success',
        description: 'Listing deleted successfully',
      });

      fetchListings();
      setShowDeleteDialog(false);
      setDeleteReason("");
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      });
    }
  };

  if (loading || loadingListings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ReverseIcon className="w-12 h-12 animate-pulse" />
          <p className="text-muted-foreground">Loading listings...</p>
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
                Listings Moderation
              </h1>
              <p className="text-xs text-muted-foreground">Review and moderate all listings</p>
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
              placeholder="Search listings, brands, sellers..."
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
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="removed">Removed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-gradient">{listings.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Flagged</p>
            <p className="text-2xl font-bold text-red-500">
              {listings.filter((l) => l.moderation_status === 'flagged').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-500">
              {listings.filter((l) => l.moderation_status === 'approved').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Showing</p>
            <p className="text-2xl font-bold">{filteredListings.length}</p>
          </Card>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <Card
                key={listing.id}
                className={`p-4 ${
                  listing.moderation_status === 'flagged' ? 'border-red-500/50 bg-red-500/5' : ''
                }`}
              >
                {listing.images && listing.images.length > 0 && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm line-clamp-2">{listing.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        listing.moderation_status === 'flagged'
                          ? 'bg-red-500/20 text-red-500'
                          : listing.moderation_status === 'approved'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {listing.moderation_status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing.brand} • ${listing.price}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {listing.profiles?.display_name || 'Unknown'}
                  </p>
                  {listing.flagged_reason && (
                    <p className="text-xs text-red-500 break-words">
                      <Flag className="inline h-3 w-3 mr-1" />
                      {listing.flagged_reason}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/item/${listing.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {listing.moderation_status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveListing(listing.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {listing.moderation_status !== 'flagged' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowFlagDialog(true);
                        }}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center col-span-full">
              <p className="text-muted-foreground">No listings found</p>
            </Card>
          )}
        </div>
      </div>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flag Listing</DialogTitle>
            <DialogDescription>
              Provide a reason for flagging this listing
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
              onClick={() => selectedListing && handleFlagListing(selectedListing.id, flagReason)}
              disabled={!flagReason.trim()}
            >
              Flag Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Provide a reason for deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for deletion..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedListing && handleDeleteListing(selectedListing.id, deleteReason)}
              disabled={!deleteReason.trim()}
            >
              Delete Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListings;
