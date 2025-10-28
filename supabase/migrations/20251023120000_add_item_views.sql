-- Add view tracking for items

-- Add view_count column to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create item_views table to track individual views
CREATE TABLE IF NOT EXISTS public.item_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate views from same user on same item
  UNIQUE(item_id, user_id)
);

-- Enable RLS
ALTER TABLE public.item_views ENABLE ROW LEVEL SECURITY;

-- Policies for item_views
CREATE POLICY "Anyone can view item views"
  ON public.item_views
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert item views"
  ON public.item_views
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_item_views_item_id ON public.item_views(item_id);
CREATE INDEX IF NOT EXISTS idx_item_views_user_id ON public.item_views(user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_item_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.items
  SET view_count = view_count + 1
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment view count
CREATE TRIGGER increment_view_count_trigger
  AFTER INSERT ON public.item_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_item_view_count();
