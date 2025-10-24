# REVERSE Admin System Documentation

## Overview
Complete mobile-friendly admin dashboard for monitoring and moderating all platform activity.

---

## 🎯 Features

### 1. Admin Dashboard (`/admin`)
- **Real-time Statistics**
  - Total users, new users (today/week)
  - Total listings (active/flagged)
  - Messages sent (total/today)
  - Flagged content counts
  - Banned users count
- **Live Activity Feed** - Recent listings, messages, user signups
- **Quick Actions** - One-tap access to all moderation tools
- **Responsive Design** - Optimized for mobile and desktop

### 2. Message Monitoring (`/admin/messages`)
- **View All Messages** - Complete message history between all users
- **Search & Filter**
  - Search by keyword, username
  - Filter: All | Flagged | Unflagged
- **Moderation Actions**
  - Flag inappropriate messages with reason
  - Unflag messages
  - View flagged reason
- **Real-time Updates** - Auto-refreshes when new messages arrive

### 3. Listings Moderation (`/admin/listings`)
- **View All Listings** - Grid view of all items
- **Search & Filter**
  - Search by title, brand, seller
  - Filter: All | Pending | Approved | Flagged | Removed
- **Moderation Actions**
  - Approve listings
  - Flag with reason
  - Delete with reason (audit trail)
  - View item details
- **Visual Status Indicators** - Color-coded status badges

---

## 🗄️ Database Schema

### New Tables

#### `admin_actions` (Audit Log)
```sql
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id),
    action_type TEXT, -- 'ban_user', 'delete_listing', etc.
    target_type TEXT, -- 'user', 'listing', 'message'
    target_id UUID,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP
);
```

### Modified Tables

#### `profiles` - Added admin features
```sql
ALTER TABLE profiles ADD COLUMN:
- is_admin BOOLEAN DEFAULT FALSE
- is_banned BOOLEAN DEFAULT FALSE
- ban_reason TEXT
- banned_at TIMESTAMP
- banned_by UUID
```

#### `items` - Added moderation fields
```sql
ALTER TABLE items ADD COLUMN:
- moderation_status TEXT DEFAULT 'approved'
  (pending | approved | flagged | removed)
- flagged_reason TEXT
- moderated_by UUID
- moderated_at TIMESTAMP
```

#### `messages` - Added flagging
```sql
ALTER TABLE messages ADD COLUMN:
- is_flagged BOOLEAN DEFAULT FALSE
- flag_reason TEXT
- flagged_by UUID
- flagged_at TIMESTAMP
```

---

## 🔐 Security & Permissions

### Row Level Security (RLS)
All admin tables and actions are protected by RLS policies:

- **Admin Actions**: Only admins can view/create
- **Message Viewing**: Admins can view all messages
- **Item Moderation**: Admins can update/delete any item
- **User Management**: Admins can ban/unban users

### Admin Check
```sql
EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND is_admin = true
)
```

---

## 📱 Mobile-First Design

### Responsive Features
- **Collapsible Stats** - Grid adapts to screen size
- **Touch-Optimized Buttons** - Large tap targets (44px minimum)
- **Swipe Gestures** - Card-based interface
- **Readable Text** - Responsive font sizes (text-xs sm:text-sm)
- **Bottom Navigation** - Easy thumb access on mobile
- **Optimized Images** - Lazy loading, proper sizing

### Breakpoints
- Mobile: Default (< 640px)
- Tablet: sm (≥ 640px)
- Desktop: lg (≥ 1024px)

---

## 🚀 Setup Instructions

### 1. Run Database Migration
Go to Supabase SQL Editor and run:
```bash
supabase/migrations/20251024000000_create_admin_system.sql
```

This will:
- Add `is_admin` field to profiles
- Create admin_actions table
- Add moderation fields to items/messages
- Set up RLS policies

### 2. Make Your Account Admin
In Supabase SQL Editor:
```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'YOUR_USER_ID';
```

To find your user ID:
```sql
SELECT id, display_name FROM profiles WHERE display_name = 'YourName';
```

### 3. Access Admin Dashboard
Navigate to: `https://your-domain.com/admin`

---

## 🎨 UI Components Used

All components are from shadcn/ui for consistency:
- `Card` - Content containers
- `Button` - Actions
- `Input` - Search fields
- `Select` - Filters
- `Dialog` - Modals for flag/delete actions
- `Textarea` - Reason input

---

## 📊 Admin Actions Tracked

Every moderation action is logged in `admin_actions` table:

| Action Type | Target Type | Description |
|------------|-------------|-------------|
| flag_message | message | Message flagged |
| unflag_message | message | Message unflagged |
| flag_listing | listing | Listing flagged |
| approve_listing | listing | Listing approved |
| delete_listing | listing | Listing removed |
| ban_user | user | User banned |
| unban_user | user | User unbanned |

---

## 🔧 Customization

### Add New Admin Pages
1. Create page in `/src/pages/Admin*.tsx`
2. Add route in `/src/App.tsx`
3. Use `useAdmin()` hook for protection

Example:
```tsx
import { useAdmin } from "@/hooks/useAdmin";

const AdminNewPage = () => {
  const { isAdmin, loading, requireAdmin } = useAdmin();

  useEffect(() => {
    if (!loading) {
      requireAdmin('/');
    }
  }, [loading, isAdmin]);

  if (!isAdmin) return null;

  return <div>Admin Content</div>;
};
```

### Add New Statistics
Update `fetchStats()` in `AdminDashboard.tsx`:
```typescript
const newStat = await supabase
  .from('your_table')
  .select('*', { count: 'exact', head: true })
  .eq('your_filter', value);
```

---

## 🧪 Testing

### Test Admin Access
1. Make account admin (see Setup step 2)
2. Visit `/admin`
3. Verify you see dashboard
4. Try accessing `/admin` with non-admin account (should redirect)

### Test Moderation
1. Create test listing
2. Flag it from admin panel
3. Verify it appears in "Flagged" filter
4. Approve/delete and verify actions are logged

### Test Mobile
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on various screen sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

---

## 🐛 Troubleshooting

### "Access Denied" error
- Ensure `is_admin = true` in profiles table
- Check Supabase RLS policies are created
- Verify you're signed in

### Stats not loading
- Run the migration SQL file
- Check browser console for errors
- Verify Supabase connection

### Real-time not working
- Check Supabase Realtime is enabled
- Verify table has Realtime enabled in Supabase dashboard
- Check for WebSocket errors in console

---

## 📁 Files Created

```
src/
├── hooks/
│   └── useAdmin.ts              # Admin auth hook
├── pages/
│   ├── AdminDashboard.tsx       # Main dashboard
│   ├── AdminMessages.tsx        # Message monitoring
│   └── AdminListings.tsx        # Listing moderation
supabase/
└── migrations/
    └── 20251024000000_create_admin_system.sql
```

---

## 🎯 Future Enhancements

Possible additions:
- User management page (ban/unban users)
- Analytics charts (user growth, revenue trends)
- Export data to CSV
- Bulk moderation actions
- Email notifications for flagged content
- Custom reports page
- Admin activity log viewer

---

## 📞 Support

Issues? Check:
1. Browser console for errors
2. Supabase logs for query errors
3. Network tab for failed requests
4. RLS policies in Supabase dashboard

---

**Last Updated**: October 2025
**Version**: 1.0
