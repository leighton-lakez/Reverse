# How to Apply Database Migrations

## For the Drafts Feature

The drafts feature requires a new database table. To enable it:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `migrations/20251023110000_create_item_drafts.sql`
5. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# From the project root
supabase db push
```

### Verify the Migration

After applying, verify the table exists:

1. Go to **Table Editor** in Supabase Dashboard
2. Look for `item_drafts` table
3. You should see columns: id, user_id, title, brand, category, description, condition, price, location, size, trade_preference, images, videos, created_at, updated_at

## What This Enables

Once the migration is applied, users will be able to:
- Save incomplete listings as drafts from the sell page
- View all their drafts in the "Drafts" tab on their profile
- Delete drafts they no longer need
- Continue editing and publish drafts later

## Troubleshooting

If users see an error when trying to save a draft:
- Check that the `item_drafts` table exists in your database
- Verify RLS policies are enabled
- Check that the auth.users table is accessible
