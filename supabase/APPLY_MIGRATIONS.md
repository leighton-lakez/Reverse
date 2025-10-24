# How to Apply Database Migrations

## Recent Migrations

### 1. Drafts Feature (20251023110000)
The drafts feature requires a new database table.

### 2. Item Views Tracking (20251023120000)
Accurate view counting per listing with unique user tracking.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of the migration file you need:
   - For drafts: `migrations/20251023110000_create_item_drafts.sql`
   - For view tracking: `migrations/20251023120000_add_item_views.sql`
5. Click **Run** to execute the SQL
6. Repeat for each migration file

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

## What These Migrations Enable

### Drafts Migration
- Save incomplete listings as drafts from the sell page
- View all their drafts in the "Drafts" tab on their profile
- Delete drafts they no longer need
- Publish drafts instantly to make them public

### View Tracking Migration
- Accurate view counts per listing (shown on profile)
- Each unique user view is counted once per item
- Owners don't count as views
- View counts update in real-time
- Conversation counts remain accurate per listing

## Troubleshooting

If users see an error when trying to save a draft:
- Check that the `item_drafts` table exists in your database
- Verify RLS policies are enabled
- Check that the auth.users table is accessible
