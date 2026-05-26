# 🚀 Quick Reference - SelfDiscovery Platform

## 📋 Setup Checklist

- [ ] Run Migration 1: `COPY_THIS_SQL.sql`
- [ ] Run Migration 2: `supabase/migrations/00000000000002_user_profiles_and_activity.sql`
- [ ] Run Seed Data: `seed-wear-products.sql` (optional)
- [ ] Sign up at: http://localhost:3003/signup
- [ ] Test all features

---

## 🔗 Quick Links

| Page | URL | Description |
|------|-----|-------------|
| Home | http://localhost:3003 | Landing page |
| Sign Up | http://localhost:3003/signup | Create account |
| Login | http://localhost:3003/login | Sign in |
| Dashboard | http://localhost:3003/dashboard | Main dashboard |
| Product Costing | http://localhost:3003/product-costing | Manage products |
| Sales | http://localhost:3003/sales | Track sales |
| Expenses | http://localhost:3003/expenses | Track expenses |
| Inventory | http://localhost:3003/inventory | Stock levels |
| Profit & Loss | http://localhost:3003/profit-loss | Financial overview |
| Library Dashboard | http://localhost:3003/library/dashboard | Library overview |
| Add Books | http://localhost:3003/library/books | Manage books |
| Library Inventory | http://localhost:3003/library/inventory | Book stock |
| Library Expenses | http://localhost:3003/library/expenses | Library costs |
| Library Reports | http://localhost:3003/library/reports | Library stats |
| Settings | http://localhost:3003/settings | User settings |

---

## 🎯 Key Features

### ✅ User Management
- Sign up / Login / Sign out
- Profile with avatar
- Role-based access (Admin/User/Manager)
- Settings page (4 tabs)

### ✅ Activity Tracking
- All actions logged
- Activity log viewer
- Activity statistics
- Search history

### ✅ Global Search
- Search bar in header
- Real-time results
- Searches: Products, Sales, Expenses, Books
- Color-coded results

### ✅ SelfDiscovery Wear
- Dashboard with metrics
- Product costing (9 products)
- Sales tracking
- Expenses tracking
- Inventory management
- Profit & loss reports

### ✅ SelfDiscovery Library
- Library dashboard
- Book management
- Library inventory
- Library expenses
- Library reports

---

## 🗄️ Database Tables

1. `product_costing` - Products
2. `sales_records` - Sales
3. `expenses` - Expenses
4. `inventory` - Stock
5. `library_books` - Books
6. `library_borrows` - Borrowing
7. `library_expenses` - Library costs
8. `user_profiles` - Users (NEW!)
9. `user_activities` - Activities (NEW!)
10. `search_history` - Searches (NEW!)

---

## 🎨 Color Codes

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #6366F1 | Main actions |
| Secondary | #8B5CF6 | Secondary actions |
| Accent | #06B6D4 | Highlights |
| Success | #22C55E | Success states |
| Warning | #F59E0B | Warnings |
| Danger | #EF4444 | Errors |

---

## 📊 Activity Types

| Type | Icon | Description |
|------|------|-------------|
| login | 🔐 | User logged in |
| logout | 👋 | User signed out |
| page_view | 👁️ | Viewed a page |
| create | ➕ | Created record |
| update | ✏️ | Updated record |
| delete | 🗑️ | Deleted record |
| search | 🔍 | Performed search |

---

## 🔐 User Roles

| Role | Access Level |
|------|--------------|
| Admin | Full access to everything |
| Manager | Can manage but not delete |
| User | Standard access |

---

## 💡 Quick Tips

### Search
- Type at least 2 characters
- Results appear instantly
- Click to navigate
- Search is tracked

### Profile
- Click avatar in top-right
- Upload image for avatar
- Edit name in Settings
- View activity log

### Sign Out
- Click "Sign Out" in sidebar
- Logout is tracked
- Redirects to login

### Activity Log
- Settings → Activity Log tab
- See all your actions
- View statistics
- Filter by type

---

## 🚨 Common Issues

**"Table does not exist"**
→ Run both migrations in Supabase

**"Not authenticated"**
→ Sign up or login first

**"Search not working"**
→ Add data to database first

**"Avatar not uploading"**
→ Check Supabase storage enabled

---

## 📚 Documentation

- `README.md` - Overview
- `QUICK_START.md` - Getting started
- `SETUP_INSTRUCTIONS.md` - Setup
- `PRODUCTION_READY.md` - New features
- `FINAL_SETUP_GUIDE.md` - Setup steps
- `COMPLETE_APP_SUMMARY.md` - Full summary
- `QUICK_REFERENCE.md` - This file

---

## 🎉 You're Ready!

Your SelfDiscovery platform is **100% production-ready**!

**Next:** Run migrations → Sign up → Start using!

---

**Built with ❤️ for SelfDiscovery**
