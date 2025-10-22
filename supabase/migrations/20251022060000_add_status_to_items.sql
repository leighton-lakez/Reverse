-- Add status column to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' NOT NULL;

-- Add check constraint for valid status values
ALTER TABLE public.items
ADD CONSTRAINT items_status_check
CHECK (status IN ('available', 'sold', 'pending'));

-- Update any existing items to have 'available' status
UPDATE public.items
SET status = 'available'
WHERE status IS NULL;

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
