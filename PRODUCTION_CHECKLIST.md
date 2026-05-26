# SelfDiscovery™ — Production Checklist

## Before deploy

- [ ] Run `RUN_THIS_IN_SUPABASE.sql` in Supabase SQL Editor (user profiles, activities, search history)
- [ ] Run business migration: `supabase/migrations/00000000000001_business_management.sql`
- [ ] Set Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Enable email auth in Supabase → Authentication → Providers
- [ ] Configure Site URL + Redirect URLs in Supabase (your production domain)

## Verify locally

```bash
rm -rf .next && npm run build && npm run start
```

Test while signed in:

1. **Dashboard** — metrics and charts load
2. **Product Costing** — add product, profit/markup preview in modal
3. **Sales** — add sale, totals update
4. **Expenses** — add expense (modal styling)
5. **Inventory** — list loads
6. **Profit & Loss** — figures match sales/expenses
7. **Global search** (⌘K) — finds products/sales
8. **Settings** — profile save, locale
9. **Mobile** — hamburger menu opens sidebar

## Deploy (Vercel)

```bash
npm i -g vercel
vercel
```

## Known requirements

- Users must **sign up / sign in** — home page goes to `/login` only (no duplicate “Enter Platform”)
- RLS policies require authenticated role for business tables
