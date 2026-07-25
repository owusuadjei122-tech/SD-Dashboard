# 🚀 Deploy SelfDiscovery to Vercel

## Step 1: Push to GitHub

### Option A: Using GitHub Desktop (Easiest)
1. Open **GitHub Desktop**
2. It will show all your changes
3. Add commit message: "Production-ready deployment with all fixes"
4. Click **"Commit to main"**
5. Click **"Push origin"**

### Option B: Using Terminal with Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Check "repo" scope
4. Generate and copy the token
5. Run in terminal:
```bash
git push https://YOUR_TOKEN@github.com/TheoLencer1/SD-DASHBOARD.git main
```

### Option C: Using SSH (If configured)
```bash
git remote set-url origin git@github.com:TheoLencer1/SD-DASHBOARD.git
git push origin main
```

---

## Step 2: Deploy to Vercel

### A. Create Vercel Account (if needed)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Allow Vercel to access your repositories

### B. Import Project
1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Find **"TheoLencer1/SD-DASHBOARD"**
4. Click **"Import"**

### C. Configure Environment Variables

**CRITICAL:** Add these environment variables in Vercel:

1. Click **"Environment Variables"** section
2. Add each of these:

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://wzwqtgcoezkblkhsggbg.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3F0Z2NvZXprYmxraHNnZ2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzg0MzUsImV4cCI6MjA5NDYxNDQzNX0.26JJU_2CqEy9ZmhV2uGQRaZsZoDi0hhOZ4vSEhKztw4
```

3. Select **"Production"**, **"Preview"**, and **"Development"** for both
4. Click **"Add"** for each

### D. Deploy Settings

**Framework Preset:** Next.js
**Build Command:** (leave default) `npm run build`
**Output Directory:** (leave default) `.next`
**Install Command:** (leave default) `npm install`

### E. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Get your live URL: `https://your-project.vercel.app`

---

## Step 3: Configure Supabase for Production

### A. Add Vercel URL to Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Scroll to **"Site URL"**
5. Add your Vercel URL: `https://your-project.vercel.app`

### B. Add to Redirect URLs

1. In Supabase Settings → **Authentication**
2. Add to **"Redirect URLs"**:
```
https://your-project.vercel.app/**
https://your-project.vercel.app/auth/callback
```

---

## Step 4: Run Database Migrations (IMPORTANT!)

Your production database needs the user tables:

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Run **`RUN_THIS_IN_SUPABASE.sql`**
4. Verify success

---

## Step 5: Test Production App

1. Visit your Vercel URL
2. Sign up with a new account
3. Test all features:
   - ✅ User profile dropdown
   - ✅ Notifications
   - ✅ Global search
   - ✅ Settings page
   - ✅ All dashboard pages

---

## 🎯 Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Vercel project
- [ ] Add environment variables
- [ ] Deploy to Vercel
- [ ] Get live URL
- [ ] Add URL to Supabase
- [ ] Configure redirect URLs
- [ ] Run database migration
- [ ] Test production app
- [ ] Verify all features work

---

## 🔧 Troubleshooting

### Build Fails on Vercel
- Check environment variables are set
- Check build logs for specific errors
- Verify `package.json` has all dependencies

### Authentication Fails
- Add Vercel URL to Supabase redirect URLs
- Check environment variables are correct
- Clear browser cache and try again

### Database Errors
- Run `RUN_THIS_IN_SUPABASE.sql` migration
- Check RLS policies in Supabase
- Verify connection string is correct

---

## 📊 After Deployment

Your app will be live at:
```
https://your-project-name.vercel.app
```

### Features Available:
- ✅ Production-ready UI
- ✅ User authentication
- ✅ Profile management
- ✅ Activity tracking
- ✅ Global search
- ✅ All business modules
- ✅ Automatic deployments on git push

---

## 🎉 Congratulations!

Your SelfDiscovery platform is now live in production! 🚀

**Next Steps:**
1. Share the URL with your team
2. Set up custom domain (optional)
3. Monitor analytics in Vercel
4. Set up error tracking (optional)

---

**Need Help?** Check Vercel docs: https://vercel.com/docs
