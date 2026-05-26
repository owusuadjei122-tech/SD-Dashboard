# 🚨 IMPORTANT: Run Database Migration First!

## The Error You're Seeing

```
Could not find the table 'public.sales_records' in the schema cache
```

This means the new database tables haven't been created yet.

---

## ✅ Solution: Run the Migration (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `wzwqtgcoezkblkhsggbg`
3. Click on **SQL Editor** in the left sidebar

### Step 2: Copy the Migration SQL

Open the file: `supabase/migrations/00000000000001_business_management.sql`

Or copy this SQL directly:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PRODUCT COSTING & PRICING
CREATE TABLE public.product_costing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name TEXT NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SALES RECORDS
CREATE TABLE public.sales_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_id UUID REFERENCES public.product_costing(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    selling_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- EXPENSES TRACKER
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Inventory', 'Marketing', 'Operations', 'Utilities', 'Miscellaneous')),
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INVENTORY TRACKER
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.product_costing(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    starting_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id)
);

-- LIBRARY BOOKS
CREATE TABLE public.library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    isbn TEXT UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LIBRARY BORROW RECORDS
CREATE TABLE public.library_borrows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    borrower_name TEXT NOT NULL,
    borrower_email TEXT,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LIBRARY EXPENSES
CREATE TABLE public.library_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Book Purchase', 'Maintenance', 'Utilities', 'Staff', 'Miscellaneous')),
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_sales_records_date ON public.sales_records(date);
CREATE INDEX idx_sales_records_product_id ON public.sales_records(product_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_library_borrows_status ON public.library_borrows(status);
CREATE INDEX idx_library_borrows_book_id ON public.library_borrows(book_id);

-- Enable RLS
ALTER TABLE public.product_costing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_borrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow authenticated users full access for now)
CREATE POLICY "Allow authenticated users" ON public.product_costing FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON public.sales_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON public.inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON public.library_books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON public.library_borrows FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON public.library_expenses FOR ALL USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_product_costing_updated_at BEFORE UPDATE ON public.product_costing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_books_updated_at BEFORE UPDATE ON public.library_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Run the SQL

1. Paste the SQL into the SQL Editor
2. Click **Run** (or press Cmd/Ctrl + Enter)
3. Wait for success message

### Step 4: Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see these new tables:
   - product_costing
   - sales_records
   - expenses
   - inventory
   - library_books
   - library_borrows
   - library_expenses

### Step 5: Refresh Your App

1. Go back to http://localhost:3004
2. Refresh the page
3. Sign up again (or log in if you already signed up)
4. You should now see the dashboard without errors!

---

## 🎯 After Migration

Once the migration is complete:

1. ✅ Sign up will work
2. ✅ Dashboard will load
3. ✅ You can add products
4. ✅ You can record sales
5. ✅ You can track expenses
6. ✅ All calculations will work automatically

---

## ⚠️ Important Notes

- This migration only needs to be run **once**
- If you get "table already exists" errors, the migration already ran
- The tables will persist in your Supabase database
- You can add sample data after migration

---

## 🆘 Still Having Issues?

### Check Supabase Connection
1. Verify `.env.local` has correct values
2. Check Supabase project is active
3. Verify API keys are correct

### Check Browser Console
1. Open browser DevTools (F12)
2. Look for error messages
3. Check Network tab for failed requests

---

**This is the ONLY step needed to fix the error!**

Run the migration and everything will work. 🚀
