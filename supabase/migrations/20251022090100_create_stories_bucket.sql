-- Create storage bucket for stories
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for stories
CREATE POLICY "Anyone can view stories"
ON storage.objects
FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'stories'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own stories"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'stories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own stories"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'stories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
