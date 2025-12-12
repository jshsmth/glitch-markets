-- Row Level Security (RLS) Policies
-- This migration enables RLS and creates policies to protect user data

-- Enable Row Level Security on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own data
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Users can insert their own data (during registration)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Users cannot delete their own data (optional - remove if you want users to be able to delete)
-- If you want to allow deletion, uncomment this:
-- CREATE POLICY "Users can delete own profile"
--   ON public.users
--   FOR DELETE
--   TO authenticated
--   USING (id = auth.uid());

-- ============================================================================
-- POLYMARKET_CREDENTIALS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.polymarket_credentials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own credentials (during Polymarket registration)
CREATE POLICY "Users can insert own credentials"
  ON public.polymarket_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON public.polymarket_credentials
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own credentials (if they want to unlink Polymarket)
CREATE POLICY "Users can delete own credentials"
  ON public.polymarket_credentials
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SERVICE ROLE BYPASS (for server-side operations)
-- ============================================================================

-- The service role (used by server-side code with the service_role key)
-- automatically bypasses RLS, so your server can still perform admin operations.
-- This is controlled by using the service_role key vs the anon key.

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS
  'Authenticated users can read their own profile data';

COMMENT ON POLICY "Users can insert own profile" ON public.users IS
  'Authenticated users can create their own profile during registration';

COMMENT ON POLICY "Users can update own profile" ON public.users IS
  'Authenticated users can update their own profile data';

COMMENT ON POLICY "Users can view own credentials" ON public.polymarket_credentials IS
  'Authenticated users can read their own Polymarket credentials';

COMMENT ON POLICY "Users can insert own credentials" ON public.polymarket_credentials IS
  'Authenticated users can insert their own Polymarket credentials';

COMMENT ON POLICY "Users can update own credentials" ON public.polymarket_credentials IS
  'Authenticated users can update their own Polymarket credentials';

COMMENT ON POLICY "Users can delete own credentials" ON public.polymarket_credentials IS
  'Authenticated users can delete their own Polymarket credentials to unlink account';
