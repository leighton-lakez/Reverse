import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";

interface CreateStoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryCreated?: () => void;
}

export default function CreateStory({ open, onOpenChange, onStoryCreated }: CreateStoryProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image or video
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit for images
          toast({
            title: "File too large",
            description: "Images must be under 10MB",
            variant: "destructive",
          });
          return;
        }
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit for videos
          toast({
            title: "File too large",
            description: "Videos must be under 50MB",
            variant: "destructive",
          });
          return;
        }
        setMediaType('video');
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image or video file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setMediaType("image");
    onOpenChange(false);
  };

  const handleCreateStory = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(uploadData.path);

      // Create story record
      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
        });

      if (insertError) throw insertError;

      toast({
        title: "Story posted!",
        description: "Your story is now live for 24 hours.",
      });

      handleClose();
      onStoryCreated?.();
    } catch (error: any) {
      console.error('Story creation error:', error);
      toast({
        title: "Error posting story",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-b from-card to-card/95 border-primary/20 sm:max-w-lg p-0 overflow-hidden">
        <div className="relative">
          {/* Decorative gradient header */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-32 blur-2xl" />

          <DialogHeader className="relative px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Create Your Story
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Share a moment that disappears in 24h ✨
            </p>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center py-16 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-10 w-10 text-primary" />
                  </div>

                  <p className="text-base font-semibold text-foreground mb-2">
                    Choose a photo or video
                  </p>
                  <p className="text-sm text-muted-foreground mb-6 text-center px-4">
                    Tap to select from your device
                  </p>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">Image</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border">
                      <Video className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">Video</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[9/16] max-h-[500px] bg-gradient-to-br from-muted to-muted/50 rounded-2xl overflow-hidden shadow-2xl border border-primary/10">
                  {mediaType === 'image' ? (
                    <img
                      src={previewUrl}
                      alt="Story preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-9 w-9 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    <X className="h-5 w-5 text-white" />
                  </Button>

                  {/* Media type badge */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full">
                    {mediaType === 'image' ? (
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-white" />
                        <span className="text-xs font-medium text-white">Image</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-white" />
                        <span className="text-xs font-medium text-white">Video</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1 h-12 border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all"
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                  <Button
                    onClick={handleCreateStory}
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Post Story
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <div className="h-1 w-1 rounded-full bg-primary/50" />
              <p>Stories disappear after 24 hours</p>
              <div className="h-1 w-1 rounded-full bg-primary/50" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
