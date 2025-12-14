-- Reset Schema Migration
-- WARNING: This drops all existing tables and data
-- Only run this if you're okay losing all test data

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS public.watchlist CASCADE;
DROP TABLE IF EXISTS public.polymarket_credentials CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
