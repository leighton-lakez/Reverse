import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  stories: Story[];
  initialIndex?: number;
}

export default function StoryViewer({
  open,
  onOpenChange,
  userId,
  stories,
  initialIndex = 0
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    if (stories && stories.length > 0) {
      setCurrentStory(stories[currentIndex]);

      // Record story view
      if (open && stories[currentIndex]) {
        recordStoryView(stories[currentIndex].id);
      }
    }
  }, [currentIndex, stories, open]);

  const recordStoryView = async (storyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Don't record views on own stories
      if (currentStory?.user_id === user.id) return;

      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id,
        })
        .select()
        .single();
    } catch (error) {
      console.error('Error recording story view:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-0 p-0 max-w-md h-[80vh] sm:h-[90vh]">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={currentStory.profiles?.avatar_url} />
                  <AvatarFallback>
                    {currentStory.profiles?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {currentStory.profiles?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-white/80">
                    {getTimeAgo(currentStory.created_at)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress bars */}
            <div className="flex gap-1 mt-3">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full bg-white transition-all ${
                      index < currentIndex ? 'w-full' :
                      index === currentIndex ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Media */}
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={currentStory.media_url}
              autoPlay
              controls
              className="max-w-full max-h-full object-contain"
              onEnded={handleNext}
            />
          )}

          {/* Navigation */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 text-white hover:bg-white/20"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          {currentIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
