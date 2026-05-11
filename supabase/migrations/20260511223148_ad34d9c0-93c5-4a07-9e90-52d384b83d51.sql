
-- 1. Drop anon write policies on marketplace tables
DROP POLICY IF EXISTS "Allow public insert dynamic_services" ON public.dynamic_services;
DROP POLICY IF EXISTS "Allow public update dynamic_services" ON public.dynamic_services;
DROP POLICY IF EXISTS "Allow public delete dynamic_services" ON public.dynamic_services;

DROP POLICY IF EXISTS "Allow public insert dynamic_products" ON public.dynamic_products;
DROP POLICY IF EXISTS "Allow public update dynamic_products" ON public.dynamic_products;
DROP POLICY IF EXISTS "Allow public delete dynamic_products" ON public.dynamic_products;

-- 2. Drop anon write policies on providers
DROP POLICY IF EXISTS "Allow public insert providers" ON public.providers;
DROP POLICY IF EXISTS "Allow public update providers" ON public.providers;
DROP POLICY IF EXISTS "Allow public delete providers" ON public.providers;

-- 3. Drop anon CRUD on kits & stock
DROP POLICY IF EXISTS "Public anon kits CRUD" ON public.kits;
DROP POLICY IF EXISTS "Public anon kit_items CRUD" ON public.kit_items;
DROP POLICY IF EXISTS "Public anon stock_entries CRUD" ON public.stock_entries;
DROP POLICY IF EXISTS "Public anon stock_entry_items CRUD" ON public.stock_entry_items;

-- 4. Wallet integrity — remove client-side write paths
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users insert own transactions" ON public.wallet_transactions;

-- 5. Drop anon insert on provider ratings
DROP POLICY IF EXISTS "Anon insert ratings" ON public.provider_ratings;
