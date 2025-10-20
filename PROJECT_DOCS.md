# REVERSE - Project Documentation

> **Luxury Designer Fashion Marketplace**
> Swipe, connect, and trade authentic designer pieces in the ultimate modern marketplace.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Brand Identity](#brand-identity)
4. [Color Scheme](#color-scheme)
5. [Features](#features)
6. [Database Schema](#database-schema)
7. [Project Structure](#project-structure)
8. [Setup Instructions](#setup-instructions)
9. [Deployment](#deployment)
10. [Key Functionality](#key-functionality)

---

## 🎯 Project Overview

**REVERSE** is a luxury designer fashion marketplace that uses a Tinder-style swipe interface to connect buyers and sellers. The platform emphasizes:
- **Authentic luxury** fashion pieces
- **Modern, sophisticated** design aesthetic
- **Mobile-first** responsive experience
- **Real-time messaging** between users
- **Optional authentication** - browse without signing up, but must authenticate to interact

### Brand Evolution
- **v1.0**: Design-Up (original name)
- **v1.5**: DesignX (first rebrand with blue/purple colors)
- **v2.0**: stob. (luxury rebrand with champagne gold/burgundy)
- **v2.1**: REVERSE (current name with UNO-style icon)

---

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide React** - Icon system
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (email/password)
  - Real-time subscriptions
  - Storage for images
  - Row Level Security (RLS)

### Testing
- **Playwright** - E2E testing across browsers
  - Chromium, Firefox, WebKit
  - Mobile Chrome, Mobile Safari

### Deployment
- **Vercel** - Hosting and CI/CD
- **GitHub** - Version control

---

## 🎨 Brand Identity

### Name & Tagline
- **Name**: REVERSE
- **Tagline**: "Discover authentic luxury fashion"
- **Icon**: UNO-style circular arrows (dual-direction design)

### Logo
The REVERSE logo consists of:
1. **Icon**: Circular arrows with champagne gold → burgundy gradient
2. **Text**: "REVERSE" in bold, uppercase with gradient text effect
3. **Positioning**: Icon on left, text on right

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Weights**: 300-900
- **Letter Spacing**: -0.03em (headings), -0.011em (body)
- **Features**: cv02, cv03, cv04, cv11

---

## 🎨 Color Scheme

### Modern Luxury Palette (Current)

#### Primary Colors
```css
--background: 0 0% 4%;          /* Deep charcoal black */
--foreground: 40 25% 95%;       /* Warm white */
--primary: 43 43% 58%;          /* Champagne gold */
--secondary: 350 59% 36%;       /* Deep burgundy */
--accent: 40 64% 90%;           /* Cream/ivory */
```

#### Neutral Tones
```css
--card: 0 0% 7%;                /* Slightly lighter black */
--muted: 30 10% 18%;            /* Warm dark gray */
--muted-foreground: 40 15% 65%; /* Mid-tone gray */
--border: 30 10% 20%;           /* Subtle border */
```

#### Gradients
```css
--gradient-primary: linear-gradient(135deg,
  hsl(43 43% 58%),  /* Champagne gold */
  hsl(350 59% 36%)  /* Deep burgundy */
);

--gradient-mesh: radial-gradient(at 40% 20%, hsl(43 43% 58% / 0.08), transparent),
                 radial-gradient(at 80% 0%, hsl(350 59% 36% / 0.08), transparent),
                 radial-gradient(at 0% 50%, hsl(43 43% 58% / 0.06), transparent);
```

### Design Philosophy
- **Sophisticated minimalism** over flashy colors
- **Warm tones** instead of cold blues
- **Subtle luxury** with refined gradients
- **High contrast** for accessibility (black backgrounds, light text)

---

## ✨ Features

### Core Features
1. **Browse Without Sign-Up**
   - View all available items as guest
   - Tinder-style swipe interface
   - Swipe left = skip, swipe right = interested

2. **Authentication System**
   - Email/password sign-up and sign-in
   - "Remember Me" checkbox (localStorage vs sessionStorage)
   - Optional - only required for interactions
   - Exit button on auth page to skip

3. **Conversational Listing**
   - ChatGPT-style interface for listing items
   - Step-by-step flow: images → title → brand → category → description → condition → price → location → size → trade preference → summary
   - Typing indicators and chat bubbles
   - Quick-select buttons for categories

4. **Swipe Interface**
   - Card stack with next item visible behind
   - Mouse and touch support
   - Drag-to-swipe with visual indicators
   - Undo last skip with RotateCcw button
   - Auto-message on swipe right: "I'm interested in this product: [title]"

5. **Smart Auth Requirements**
   - Browse: ✅ No auth required
   - Sell: ❌ Auth required
   - Message sellers (swipe right): ❌ Auth required
   - View notifications: ❌ Auth required
   - View profile: ❌ Auth required
   - Helpful toast notifications explain why auth is needed

6. **Real-Time Messaging**
   - Direct messages between users
   - Real-time updates via Supabase subscriptions
   - Message notifications
   - Unread message counts

7. **Profile System**
   - Display name, bio, location, avatar
   - Follow/unfollow users
   - Friends list (mutual follows)
   - View user's listed items

8. **Mobile Responsive**
   - Mobile-first design
   - Touch-optimized controls
   - Responsive breakpoints (sm:, md:)
   - Viewport-fit for notch support
   - Safe area bottom padding

---

## 🗄 Database Schema

### Tables

#### `profiles`
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

#### `items`
```sql
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  brand text,
  category text,
  description text,
  condition text NOT NULL,
  price decimal NOT NULL,
  location text NOT NULL,
  size text,
  trade_preference text,
  images text[] DEFAULT '{}',
  status text DEFAULT 'available',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

#### `messages`
```sql
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `follows`
```sql
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
```

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- **profiles**: Everyone can view, users can update their own
- **items**: Everyone can view, users can CRUD their own
- **messages**: Users can view their sent/received, send messages, update received (mark as read)
- **follows**: Everyone can view, users can follow/unfollow

---

## 📁 Project Structure

```
style-swap-nation/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── BottomNav.tsx          # Bottom navigation bar
│   │   ├── LocationAutocomplete.tsx
│   │   └── ReverseIcon.tsx        # Custom UNO-style icon
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client config
│   │       └── types.ts           # Database types
│   ├── lib/
│   │   ├── errorHandler.ts        # User-friendly error messages
│   │   └── validationSchemas.ts   # Zod validation schemas
│   ├── pages/
│   │   ├── Auth.tsx               # Sign in/up page
│   │   ├── ProfileSetup.tsx       # Complete profile
│   │   ├── Index.tsx              # Browse/swipe page
│   │   ├── Sell.tsx               # Conversational listing
│   │   ├── Notifications.tsx      # Notifications & friends
│   │   ├── Messages.tsx           # Message threads
│   │   ├── Chat.tsx               # Chat interface
│   │   ├── Profile.tsx            # User profile
│   │   ├── UserProfile.tsx        # View other users
│   │   ├── ItemDetail.tsx         # Item details
│   │   ├── EditListing.tsx        # Edit items
│   │   ├── Settings.tsx           # User settings
│   │   ├── FollowersList.tsx      # Followers
│   │   ├── FollowingList.tsx      # Following
│   │   └── NotFound.tsx           # 404 page
│   ├── App.tsx                    # Routes and providers
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles & design system
├── supabase/
│   └── migrations/                # Database migrations
├── tests/
│   ├── example.spec.ts            # Basic tests
│   └── mobile-check.spec.ts       # Mobile responsiveness tests
├── index.html                     # HTML entry
├── vite.config.ts                 # Vite + SPA routing config
├── vercel.json                    # Vercel deployment config
├── playwright.config.ts           # Playwright test config
├── package.json                   # Dependencies
└── PROJECT_DOCS.md                # This file
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Git installed

### 1. Clone Repository
```bash
git clone https://github.com/leighton-lakez/style-swap-nation.git
cd style-swap-nation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**Stripe Setup:**
1. Create a Stripe account at https://stripe.com
2. Get your publishable key from https://dashboard.stripe.com/apikeys
3. Add your secret key to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

### 4. Set Up Supabase Database
Go to your Supabase SQL Editor and run the complete database setup (see Database Schema section above).

**Key migrations:**
1. Create `items` table
2. Create `profiles` table with auto-creation trigger
3. Create `messages` table with real-time enabled
4. Create `follows` table
5. Enable RLS on all tables
6. Create indexes for performance

### 5. Enable Email Auth in Supabase
- Go to Authentication → Providers → Email
- Make sure it's enabled

### 6. Deploy Supabase Edge Functions
Deploy the Stripe checkout session Edge Function:
```bash
supabase functions deploy create-checkout-session
```

Set the Stripe secret key in Supabase:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### 7. Start Development Server
```bash
npm run dev
```
Server runs at: `http://localhost:8080`

### 8. Run Tests (Optional)
```bash
npm run test           # Run all tests
npm run test:ui        # Interactive UI mode
npm run test:headed    # See browser
```

---

## 🌐 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import `style-swap-nation` repository
   - Framework: Vite (auto-detected)

2. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables** (CRITICAL)
   ```
   VITE_SUPABASE_URL = https://[your-project-id].supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = your_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY = pk_test_your_stripe_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Auto-deploys on every push to main branch

### SPA Routing
The `vercel.json` file ensures all routes serve `index.html`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## ⚙️ Key Functionality

### Authentication Flow
1. User visits site → sees Browse page
2. Can swipe and view items without auth
3. Clicking "Sell", "Profile", "Notifications", or swiping right → prompted to sign in
4. Auth page has X button to skip and return to browsing

### Listing Flow (Sell Page)
1. Welcome message appears
2. Upload photos immediately (button appears right away)
3. Conversational steps collect all data
4. Summary review at end
5. "List Item" uploads images to Supabase Storage, creates item in database

### Swipe Mechanics
1. Fetch items (exclude user's own if logged in)
2. Display card stack (current + next preview)
3. Mouse/touch drag to swipe or click buttons
4. Left swipe → add to skippedItems array
5. Right swipe → check auth → send message → move to next
6. Undo → pop from skippedItems, decrement index

### Messaging
1. Swipe right auto-sends: "I'm interested in this product: [title]"
2. Messages stored in `messages` table with sender_id, receiver_id, item_id
3. Real-time subscription updates notifications
4. Grouped by sender in notifications page
5. Full chat interface in `/chat` route

---

## 🎨 Design System Classes

### Custom Utility Classes

```css
.glass              /* Glassmorphism effect */
.gradient-primary   /* Gold → Burgundy gradient */
.gradient-mesh      /* Subtle background mesh */
.text-gradient      /* Gradient text effect */
.shadow-glow        /* Gold glow shadow */
.shadow-glow-secondary /* Burgundy glow shadow */
.safe-area-bottom   /* iOS notch support */
```

### Focus States
All interactive elements have a glowing gold outline on focus:
```css
*:focus {
  outline: 2px solid hsl(var(--primary));
  box-shadow: 0 0 12px hsl(var(--primary) / 0.4);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first - default styles */
sm:  /* 640px - Small tablets */
md:  /* 768px - Medium tablets */
lg:  /* 1024px - Laptops */
xl:  /* 1280px - Desktops */
```

### Mobile Optimizations
- Smaller text sizes (text-xs sm:text-sm)
- Reduced padding (px-3 sm:px-4)
- Smaller buttons (h-10 sm:h-12)
- Smaller icons (h-5 w-5 sm:h-6 w-6)
- Stacked layouts → side-by-side on larger screens

---

## 🔧 Troubleshooting

### Blank Page
- Hard refresh: `Ctrl + Shift + R`
- Check browser console for errors
- Verify `.env` variables are set
- Ensure dev server is running on port 8080

### 404 on Page Refresh
- Vite config has SPA fallback middleware
- `vercel.json` has rewrites configured
- Check `vite.config.ts` has custom plugin

### Sign Up Not Working
- Database tables must be created in Supabase
- Run all migrations in SQL Editor
- Email auth must be enabled in Supabase
- Check browser console for specific errors

### Images Not Uploading
- Supabase Storage bucket `item-images` must exist
- Bucket must be public
- Check Storage policies in Supabase

---

## 📝 Important Notes

### Version History
- **v2.1** (Current): REVERSE with UNO icon, luxury colors
- **v2.0**: stob. rebrand with luxury palette
- **v1.5**: DesignX with blue/purple colors
- **v1.0**: Design-Up (original)

### Never Removed Features
- Tinder-style swipe interface
- Conversational listing
- Optional authentication
- Mobile responsiveness
- Real-time messaging
- Follow system

### Critical Environment Variables
```env
VITE_SUPABASE_URL=https://bljvvmhrsgiucvvaqwun.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your-key]
```
⚠️ **Must be set in both `.env` (local) and Vercel (production)**

---

## 🤝 Contributing

This is a solo project by Leighton. All changes tracked in Git history.

### Commit Message Format
```
<type>: <description>

<detailed explanation>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 📞 Support

- **GitHub**: https://github.com/leighton-lakez/style-swap-nation
- **Issues**: Report bugs via GitHub Issues
- **Supabase Project**: bljvvmhrsgiucvvaqwun

---

## 🎉 Credits

- **Developer**: Leighton
- **AI Assistant**: Claude (Anthropic)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Hosting**: Vercel
- **Backend**: Supabase
- **Fonts**: Google Fonts (Inter)

---

**Last Updated**: October 2025
**Version**: 2.1 - REVERSE with UNO Icon
