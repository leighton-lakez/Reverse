-- Add videos column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';
