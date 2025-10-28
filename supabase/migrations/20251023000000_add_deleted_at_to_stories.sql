-- Add deleted_at column to stories table to track deleted stories
ALTER TABLE public.stories
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on deleted stories
CREATE INDEX IF NOT EXISTS idx_stories_deleted_at ON public.stories(deleted_at);

-- Update the policy to allow viewing deleted stories (only own stories)
DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;

CREATE POLICY "Users can view their own stories including deleted"
ON public.stories
FOR SELECT
USING (auth.uid() = user_id);
