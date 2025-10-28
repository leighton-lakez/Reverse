import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
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
        <VisuallyHidden>
          <DialogTitle>Story Viewer</DialogTitle>
          <DialogDescription>
            Viewing story from {currentStory.profiles?.display_name || 'User'}
          </DialogDescription>
        </VisuallyHidden>
        <div
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
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

          {/* Left tap area for previous */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-20"
            onClick={handlePrevious}
          />

          {/* Right tap area for next */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-20"
            onClick={handleNext}
          />

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

          {/* Navigation Arrows - Always visible */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-30 transition-opacity ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
            }`}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-10 w-10" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-30 transition-opacity ${
              currentIndex === stories.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
            }`}
            onClick={handleNext}
            disabled={currentIndex === stories.length - 1}
          >
            <ChevronRight className="h-10 w-10" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
