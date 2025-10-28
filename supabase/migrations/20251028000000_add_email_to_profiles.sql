-- Add email column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;

        -- Populate email from auth.users
        UPDATE public.profiles p
        SET email = (
            SELECT email
            FROM auth.users u
            WHERE u.id = p.id
        );
    END IF;
END $$;

-- Create a trigger to automatically set email on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created_set_email ON public.profiles;
CREATE TRIGGER on_profile_created_set_email
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_email();
