import { useState, useEffect } from "react";
import { Upload, X, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { itemSchema } from "@/lib/validationSchemas";
import { ReverseIcon } from "@/components/ReverseIcon";

const EditDraft = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    category: "",
    description: "",
    condition: "",
    price: "",
    location: "",
    size: "",
    tradePreference: "yes",
  });

  useEffect(() => {
    // Check auth and fetch draft
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      await fetchDraft(session.user.id);
    });
  }, [navigate, id]);

  const fetchDraft = async (currentUserId: string) => {
    if (!id) {
      navigate("/profile");
      return;
    }

    const { data, error } = await supabase
      .from("item_drafts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Failed to load draft",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }

    // Check if user owns this draft
    if (data.user_id !== currentUserId) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own drafts",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }

    // Set form data
    setFormData({
      title: data.title || "",
      brand: data.brand || "",
      category: data.category || "",
      description: data.description || "",
      condition: data.condition || "",
      price: data.price?.toString() || "",
      location: data.location || "",
      size: data.size || "",
      tradePreference: data.trade_preference || "yes",
    });

    setExistingImages(data.images || []);
    setExistingVideos(data.videos || []);
    setLoading(false);
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setNewImageFiles([...newImageFiles, ...newFiles]);
      setNewImagePreviews([...newImagePreviews, ...newPreviews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);

    try {
      // Upload new images to storage
      const newUploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/drafts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Failed to upload images');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(uploadData.path);

        newUploadedUrls.push(publicUrl);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newUploadedUrls];

      // Update the draft
      const { error } = await supabase
        .from("item_drafts")
        .update({
          title: formData.title,
          brand: formData.brand,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          price: formData.price ? parseFloat(formData.price) : null,
          location: formData.location,
          size: formData.size,
          trade_preference: formData.tradePreference,
          images: allImages,
          videos: existingVideos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Draft Saved!",
        description: "Your changes have been saved.",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!userId) return;

    setPublishing(true);

    try {
      // Validate input data
      const validationResult = itemSchema.safeParse({
        title: formData.title,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        condition: formData.condition,
        price: parseFloat(formData.price),
        location: formData.location,
        size: formData.size,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: `${firstError.path[0]}: ${firstError.message}`,
          variant: "destructive",
        });
        setPublishing(false);
        return;
      }

      // Check if we have at least one image
      if (existingImages.length === 0 && newImageFiles.length === 0) {
        toast({
          title: "Missing Images",
          description: "Please add at least one photo before publishing.",
          variant: "destructive",
        });
        setPublishing(false);
        return;
      }

      // Upload new images to storage
      const newUploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Failed to upload images');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(uploadData.path);

        newUploadedUrls.push(publicUrl);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newUploadedUrls];

      // Insert into items table
      const { error: insertError } = await supabase
        .from("items")
        .insert({
          user_id: userId,
          title: validationResult.data.title,
          brand: validationResult.data.brand,
          category: validationResult.data.category,
          description: validationResult.data.description,
          condition: validationResult.data.condition,
          price: validationResult.data.price,
          location: validationResult.data.location,
          size: validationResult.data.size,
          trade_preference: formData.tradePreference,
          images: allImages,
          videos: existingVideos,
          status: 'available',
        });

      if (insertError) throw insertError;

      // Delete the draft
      await supabase
        .from("item_drafts")
        .delete()
        .eq("id", id);

      toast({
        title: "Published!",
        description: "Your item is now live.",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("item_drafts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Your draft has been removed.",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const allImagePreviews = [
    ...existingImages.map(url => ({ type: 'existing', url })),
    ...newImagePreviews.map(url => ({ type: 'new', url }))
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-8 h-8" />
              <h1 className="text-xl font-black tracking-tighter text-gradient">REVRS</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-3">
        <form onSubmit={handleSaveDraft} className="space-y-3 animate-fade-in">
          {/* Images */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Photos</Label>
            <div className="grid grid-cols-4 gap-2">
              {allImagePreviews.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                  <img
                    src={img.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (img.type === 'existing') {
                        const existingIndex = existingImages.indexOf(img.url);
                        removeExistingImage(existingIndex);
                      } else {
                        const newIndex = newImagePreviews.indexOf(img.url);
                        removeNewImage(newIndex);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <label className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 bg-muted/50 hover:bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleNewImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="bg-muted border-border h-9"
            />
          </div>

          {/* Brand & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="brand" className="text-sm font-semibold">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="bg-muted border-border h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm font-semibold">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="bg-muted border-border h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handbags">Handbags</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="watches">Watches</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-semibold">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              required
              className="bg-muted border-border resize-none text-sm"
            />
          </div>

          {/* Condition & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="condition" className="text-sm font-semibold">Condition *</Label>
              <Select value={formData.condition} onValueChange={(val) => setFormData({...formData, condition: val})}>
                <SelectTrigger className="bg-muted border-border h-9">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New with Tags</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="price" className="text-sm font-semibold">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  min="0"
                  step="0.01"
                  required
                  className="pl-7 bg-muted border-border h-9"
                />
              </div>
            </div>
          </div>

          {/* Location & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="location" className="text-sm font-semibold">Location *</Label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(val) => setFormData({...formData, location: val})}
                className="bg-muted border-border h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="size" className="text-sm font-semibold">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="bg-muted border-border h-9"
              />
            </div>
          </div>

          {/* Trade Option */}
          <div className="space-y-1">
            <Label htmlFor="trade" className="text-sm font-semibold">Open to Trades?</Label>
            <Select value={formData.tradePreference} onValueChange={(val) => setFormData({...formData, tradePreference: val})}>
              <SelectTrigger className="bg-muted border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={handlePublish}
              className="w-full h-10 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={publishing || saving}
            >
              {publishing ? "Publishing..." : "Publish Now"}
            </Button>

            <Button
              type="submit"
              variant="outline"
              className="w-full h-10 text-base font-semibold"
              disabled={saving || publishing}
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/profile")}
              className="w-full h-10 text-base font-semibold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default EditDraft;
