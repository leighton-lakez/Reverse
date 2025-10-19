-- Add constraints to prevent message spoofing and enhance data integrity
-- Check for existing constraints before adding

-- Add foreign key constraint for item_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_item_id_fkey'
  ) THEN
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_item_id_fkey 
    FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update profiles RLS policy to limit location exposure
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON public.messages(item_id) WHERE item_id IS NOT NULL;