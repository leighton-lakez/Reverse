import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Video } from "lucide-react";
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
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Share a photo or video to your story
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] max-h-96 bg-muted rounded-lg overflow-hidden">
                {mediaType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setSelectedFile(null);
                    setPreviewUrl("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                  disabled={uploading}
                >
                  Change
                </Button>
                <Button
                  onClick={handleCreateStory}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={uploading}
                >
                  {uploading ? "Posting..." : "Post Story"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Stories disappear after 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
