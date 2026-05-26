# ⚠️ IMPORTANT: Run This Migration Now!

## The app is showing errors because these tables are missing:
- `user_profiles`
- `user_activities`
- `search_history`

## 🚀 Quick Fix (2 minutes):

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### Step 2: Select Your Project
Click on your project: `wzwqtgcoezkblkhsggbg`

### Step 3: Go to SQL Editor
- Click "SQL Editor" in the left sidebar
- Click "New Query"

### Step 4: Copy and Run This SQL

Open the file: `supabase/migrations/00000000000002_user_profiles_and_activity.sql`

Copy the ENTIRE contents and paste into the SQL Editor, then click **RUN**.

### Step 5: Refresh Your App

After running the migration:
1. Refresh your browser at http://localhost:3003
2. All errors should be gone!
3. Profile and settings will work perfectly

---

## ✅ What This Migration Does:

Creates 3 new tables:
1. **user_profiles** - Stores user information (name, avatar, role)
2. **user_activities** - Tracks all user actions
3. **search_history** - Stores search queries

Plus:
- Auto-creates user profile on signup
- Sets up Row Level Security (RLS)
- Creates proper indexes

---

## 🔧 Alternative: App Works Without Migration

I've updated the code so the app works even without the migration, but:
- ❌ No user profiles
- ❌ No activity tracking
- ❌ No search history
- ❌ Settings page shows default data

**Recommendation:** Run the migration for full functionality!

---

## 📍 Migration File Location:

```
supabase/migrations/00000000000002_user_profiles_and_activity.sql
```

---

**After running the migration, everything will work perfectly!** 🎉
