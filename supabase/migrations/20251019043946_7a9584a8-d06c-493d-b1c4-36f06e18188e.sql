-- Create transactions table for audit trail
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'disputed')),
  payment_intent_id text,
  shipping_address jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Buyers can view their purchases
CREATE POLICY "Buyers can view their purchases" ON public.transactions
FOR SELECT
USING (auth.uid() = buyer_id);

-- Sellers can view their sales
CREATE POLICY "Sellers can view their sales" ON public.transactions
FOR SELECT
USING (auth.uid() = seller_id);

-- Only authenticated users can create transactions for themselves as buyers
CREATE POLICY "Users can create transactions as buyers" ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own pending transactions
CREATE POLICY "Buyers can cancel their pending transactions" ON public.transactions
FOR UPDATE
USING (auth.uid() = buyer_id AND status = 'pending')
WITH CHECK (status IN ('cancelled'));

-- Add status column to items table to prevent overselling
ALTER TABLE public.items 
ADD COLUMN status text NOT NULL DEFAULT 'available' 
CHECK (status IN ('available', 'pending', 'sold', 'cancelled'));

-- Update existing items to have 'available' status
UPDATE public.items SET status = 'available' WHERE status IS NULL;

-- Update RLS policy to show available items or user's own items
DROP POLICY "Anyone can view items" ON public.items;

CREATE POLICY "Anyone can view available items" ON public.items
FOR SELECT
USING (status = 'available' OR auth.uid() = user_id);

-- Create index for better performance on transactions queries
CREATE INDEX idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX idx_transactions_item_id ON public.transactions(item_id);
CREATE INDEX idx_items_status ON public.items(status);