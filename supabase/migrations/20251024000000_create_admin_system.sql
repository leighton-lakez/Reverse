-- Add admin role to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create admin_actions log table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'ban_user', 'delete_listing', 'flag_message', 'approve_listing', etc.
    target_type TEXT NOT NULL, -- 'user', 'listing', 'message'
    target_id UUID NOT NULL,
    reason TEXT,
    metadata JSONB, -- Store additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);

-- Add moderation fields to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_items_moderation_status ON public.items(moderation_status);

-- Add banned status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.profiles(id);

-- Create index for banned users
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- Add flagged status to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE;

-- Create index for flagged messages
CREATE INDEX IF NOT EXISTS idx_messages_is_flagged ON public.messages(is_flagged);

-- Enable Row Level Security on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin actions
CREATE POLICY "Only admins can view admin actions"
    ON public.admin_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Policy: Only admins can create admin actions
CREATE POLICY "Only admins can create admin actions"
    ON public.admin_actions FOR INSERT
    WITH CHECK (
        auth.uid() = admin_id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Update items policies to allow admin moderation
CREATE POLICY "Admins can update any item"
    ON public.items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete any item"
    ON public.items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Policy: Admins can view all messages
CREATE POLICY "Admins can view all messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Policy: Admins can flag messages
CREATE POLICY "Admins can flag messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create a view for admin statistics
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
    (SELECT COUNT(*) FROM public.items) as total_listings,
    (SELECT COUNT(*) FROM public.items WHERE status = 'available') as active_listings,
    (SELECT COUNT(*) FROM public.items WHERE moderation_status = 'flagged') as flagged_listings,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.messages WHERE created_at > NOW() - INTERVAL '24 hours') as messages_today,
    (SELECT COUNT(*) FROM public.messages WHERE is_flagged = true) as flagged_messages,
    (SELECT COUNT(*) FROM public.profiles WHERE is_banned = true) as banned_users;

-- Grant select on the view to authenticated users (will be restricted by RLS)
GRANT SELECT ON public.admin_stats TO authenticated;

-- Policy: Only admins can view stats
CREATE POLICY "Only admins can view admin stats"
    ON public.admin_stats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );
