-- Create item_drafts table for saving incomplete listings
CREATE TABLE IF NOT EXISTS item_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  brand TEXT,
  category TEXT,
  description TEXT,
  condition TEXT,
  price DECIMAL(10, 2),
  location TEXT,
  size TEXT,
  trade_preference TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE item_drafts ENABLE ROW LEVEL SECURITY;

-- Policies for item_drafts
CREATE POLICY "Users can view their own drafts"
  ON item_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
  ON item_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON item_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON item_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_item_drafts_user_id ON item_drafts(user_id);
CREATE INDEX idx_item_drafts_created_at ON item_drafts(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_item_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_item_drafts_updated_at_trigger
  BEFORE UPDATE ON item_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_item_drafts_updated_at();
