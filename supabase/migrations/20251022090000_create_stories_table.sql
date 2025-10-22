-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW() + INTERVAL '24 hours') NOT NULL
);

-- Create story views table to track who viewed each story
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
CREATE POLICY "Users can view their own stories"
ON public.stories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view stories from people they follow"
ON public.stories
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
        AND following_id = stories.user_id
    )
);

CREATE POLICY "Users can view any story (for profile viewing)"
ON public.stories
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for story views
CREATE POLICY "Users can view story views on their own stories"
ON public.story_views
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stories
        WHERE stories.id = story_views.story_id
        AND stories.user_id = auth.uid()
    )
);

CREATE POLICY "Users can record story views"
ON public.story_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON public.story_views(viewer_id);

-- Function to delete expired stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.stories
    WHERE expires_at < NOW();
END;
$$;
