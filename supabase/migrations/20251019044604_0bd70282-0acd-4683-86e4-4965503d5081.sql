-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for item images
CREATE POLICY "Anyone can view item images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'item-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own item images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'item-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own item images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'item-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create admin role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view user roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Only admins can assign roles
CREATE POLICY "Admins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to prevent status updates by sellers
CREATE OR REPLACE FUNCTION public.prevent_seller_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow status changes only if user is admin or status hasn't changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can update item status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to items table to prevent status manipulation
DROP TRIGGER IF EXISTS prevent_seller_status_updates ON items;
CREATE TRIGGER prevent_seller_status_updates
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_seller_status_change();

-- Add admin policy for viewing all transactions
CREATE POLICY "Admins can view all transactions"
ON transactions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policy for managing transactions
CREATE POLICY "Admins can update any transaction"
ON transactions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));