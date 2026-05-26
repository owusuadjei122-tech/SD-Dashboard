-- ============================================
-- Sample Data for Testing
-- ============================================
-- Run this AFTER the main migration
-- This will populate your database with test data
-- ============================================

-- Sample Products
INSERT INTO public.product_costing (product_name, cost_price, selling_price) VALUES
('Premium T-Shirt', 15.00, 35.00),
('Classic Hoodie', 25.00, 65.00),
('Designer Cap', 8.00, 22.00),
('Sports Jacket', 40.00, 95.00),
('Casual Sneakers', 30.00, 75.00);

-- Get product IDs for inventory (you'll need to run this after products are created)
-- Sample Inventory (will be auto-created when you add products through the app)

-- Sample Sales Records
INSERT INTO public.sales_records (date, product_id, product_name, quantity, selling_price)
SELECT 
    CURRENT_DATE - (random() * 30)::integer,
    id,
    product_name,
    (random() * 10 + 1)::integer,
    selling_price
FROM public.product_costing
LIMIT 15;

-- Sample Expenses
INSERT INTO public.expenses (date, category, description, amount) VALUES
(CURRENT_DATE - 1, 'Marketing', 'Social media advertising campaign', 250.00),
(CURRENT_DATE - 2, 'Inventory', 'Bulk product purchase', 1500.00),
(CURRENT_DATE - 3, 'Operations', 'Office supplies and equipment', 180.00),
(CURRENT_DATE - 5, 'Utilities', 'Monthly electricity bill', 120.00),
(CURRENT_DATE - 7, 'Marketing', 'Email marketing service', 99.00),
(CURRENT_DATE - 10, 'Operations', 'Shipping and packaging materials', 340.00),
(CURRENT_DATE - 12, 'Miscellaneous', 'Business insurance premium', 450.00),
(CURRENT_DATE - 15, 'Marketing', 'Google Ads campaign', 380.00),
(CURRENT_DATE - 18, 'Utilities', 'Internet and phone service', 95.00),
(CURRENT_DATE - 20, 'Operations', 'Software subscriptions', 150.00);

-- Sample Library Books
INSERT INTO public.library_books (title, author, category, isbn, quantity, available_copies) VALUES
('The Lean Startup', 'Eric Ries', 'Business', '978-0307887894', 3, 3),
('Atomic Habits', 'James Clear', 'Self-Help', '978-0735211292', 5, 4),
('Zero to One', 'Peter Thiel', 'Business', '978-0804139298', 2, 2),
('Deep Work', 'Cal Newport', 'Productivity', '978-1455586691', 4, 3),
('The 4-Hour Workweek', 'Tim Ferriss', 'Business', '978-0307465351', 3, 2),
('Thinking, Fast and Slow', 'Daniel Kahneman', 'Psychology', '978-0374533557', 2, 2),
('Good to Great', 'Jim Collins', 'Business', '978-0066620992', 3, 3),
('The Power of Habit', 'Charles Duhigg', 'Self-Help', '978-0812981605', 4, 4);

-- Sample Library Borrows
INSERT INTO public.library_borrows (book_id, borrower_name, borrower_email, borrow_date, due_date, status)
SELECT 
    id,
    CASE (random() * 5)::integer
        WHEN 0 THEN 'John Smith'
        WHEN 1 THEN 'Sarah Johnson'
        WHEN 2 THEN 'Mike Davis'
        WHEN 3 THEN 'Emily Brown'
        ELSE 'David Wilson'
    END,
    CASE (random() * 5)::integer
        WHEN 0 THEN 'john@example.com'
        WHEN 1 THEN 'sarah@example.com'
        WHEN 2 THEN 'mike@example.com'
        WHEN 3 THEN 'emily@example.com'
        ELSE 'david@example.com'
    END,
    CURRENT_DATE - (random() * 20)::integer,
    CURRENT_DATE + (random() * 10)::integer,
    'borrowed'
FROM public.library_books
WHERE available_copies < quantity
LIMIT 3;

-- Sample Library Expenses
INSERT INTO public.library_expenses (date, category, description, amount) VALUES
(CURRENT_DATE - 5, 'Book Purchase', 'New business books collection', 450.00),
(CURRENT_DATE - 10, 'Maintenance', 'Bookshelf repairs and cleaning', 120.00),
(CURRENT_DATE - 15, 'Utilities', 'Library space utilities', 85.00),
(CURRENT_DATE - 20, 'Miscellaneous', 'Library management software', 99.00);

-- ============================================
-- Sample Data Created!
-- ============================================
-- Now refresh your app and see the data!
-- ============================================
