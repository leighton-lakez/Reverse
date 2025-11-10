-- Add payment method fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN venmo text,
ADD COLUMN cashapp text,
ADD COLUMN zelle text,
ADD COLUMN paypal text,
ADD COLUMN apple_pay text,
ADD COLUMN other_payment text;

-- Add comment to document the columns
COMMENT ON COLUMN public.profiles.venmo IS 'User Venmo username/handle';
COMMENT ON COLUMN public.profiles.cashapp IS 'User Cash App $cashtag';
COMMENT ON COLUMN public.profiles.zelle IS 'User Zelle email or phone number';
COMMENT ON COLUMN public.profiles.paypal IS 'User PayPal email or handle';
COMMENT ON COLUMN public.profiles.apple_pay IS 'User Apple Pay email or phone number';
COMMENT ON COLUMN public.profiles.other_payment IS 'Other payment method info';
