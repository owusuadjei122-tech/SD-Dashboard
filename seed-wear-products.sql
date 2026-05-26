-- ============================================
-- SelfDiscovery Wear Products
-- ============================================
-- Insert these specific products into product_costing
-- Run this AFTER the main migration
-- ============================================

INSERT INTO public.product_costing (product_name, cost_price, selling_price) VALUES
('Purpose', 80, 120),
('He''s Alive', 45, 85),
('Fear Not', 45, 85),
('Jesus Series', 45, 85),
('GodisTheGreatest', 45, 85),
('Good God', 45, 85),
('I am with you', 45, 85),
('Jesus Caps', 30, 60),
('Purpose Cap', 30, 60);

-- Auto-create inventory entries for these products
INSERT INTO public.inventory (product_id, product_name, starting_stock, reorder_level)
SELECT 
    id,
    product_name,
    100, -- Starting with 100 units each
    20   -- Reorder when below 20
FROM public.product_costing
WHERE product_name IN (
    'Purpose', 'He''s Alive', 'Fear Not', 'Jesus Series', 
    'GodisTheGreatest', 'Good God', 'I am with you', 
    'Jesus Caps', 'Purpose Cap'
);

-- ============================================
-- Products Created!
-- ============================================
-- Profit per unit and Markup % will calculate automatically
-- Purpose: Profit = $40, Markup = 50%
-- He's Alive: Profit = $40, Markup = 88.89%
-- Fear Not: Profit = $40, Markup = 88.89%
-- Jesus Series: Profit = $40, Markup = 88.89%
-- GodisTheGreatest: Profit = $40, Markup = 88.89%
-- Good God: Profit = $40, Markup = 88.89%
-- I am with you: Profit = $40, Markup = 88.89%
-- Jesus Caps: Profit = $30, Markup = 100%
-- Purpose Cap: Profit = $30, Markup = 100%
-- ============================================
