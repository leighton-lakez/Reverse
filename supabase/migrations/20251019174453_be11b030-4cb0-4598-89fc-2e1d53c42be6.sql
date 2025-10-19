-- Add image_url column to messages table
ALTER TABLE public.messages 
ADD COLUMN image_url TEXT;