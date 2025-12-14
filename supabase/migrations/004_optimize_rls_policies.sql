-- Optimize RLS Policies for Performance
-- This migration fixes RLS policies to avoid re-evaluating auth.uid() for each row
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- USERS TABLE - Recreate policies with optimized auth function calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- POLYMARKET_CREDENTIALS TABLE - Recreate policies with optimized auth function calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own credentials" ON public.polymarket_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.polymarket_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.polymarket_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.polymarket_credentials;

CREATE POLICY "Users can view own credentials"
  ON public.polymarket_credentials
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own credentials"
  ON public.polymarket_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own credentials"
  ON public.polymarket_credentials
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own credentials"
  ON public.polymarket_credentials
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- WATCHLIST TABLE - Recreate policies with optimized auth function calls
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can insert own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can delete own watchlist" ON public.watchlist;

CREATE POLICY "Users can view own watchlist"
  ON public.watchlist
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own watchlist"
  ON public.watchlist
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own watchlist"
  ON public.watchlist
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS
  'Authenticated users can read their own profile data (optimized with subquery)';

COMMENT ON POLICY "Users can insert own profile" ON public.users IS
  'Authenticated users can create their own profile during registration (optimized with subquery)';

COMMENT ON POLICY "Users can update own profile" ON public.users IS
  'Authenticated users can update their own profile data (optimized with subquery)';

COMMENT ON POLICY "Users can view own credentials" ON public.polymarket_credentials IS
  'Authenticated users can read their own Polymarket credentials (optimized with subquery)';

COMMENT ON POLICY "Users can insert own credentials" ON public.polymarket_credentials IS
  'Authenticated users can insert their own Polymarket credentials (optimized with subquery)';

COMMENT ON POLICY "Users can update own credentials" ON public.polymarket_credentials IS
  'Authenticated users can update their own Polymarket credentials (optimized with subquery)';

COMMENT ON POLICY "Users can delete own credentials" ON public.polymarket_credentials IS
  'Authenticated users can delete their own Polymarket credentials to unlink account (optimized with subquery)';

COMMENT ON POLICY "Users can view own watchlist" ON public.watchlist IS
  'Authenticated users can read their own watchlist entries (optimized with subquery)';

COMMENT ON POLICY "Users can insert own watchlist" ON public.watchlist IS
  'Authenticated users can bookmark events (optimized with subquery)';

COMMENT ON POLICY "Users can delete own watchlist" ON public.watchlist IS
  'Authenticated users can remove bookmarks (optimized with subquery)';
