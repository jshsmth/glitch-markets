-- Watchlist Feature Migration
-- This migration creates the watchlist table for user bookmarks

-- ============================================================================
-- WATCHLIST TABLE
-- ============================================================================

-- Watchlist/Bookmarks Table
-- Stores user bookmarks for prediction market events
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Ensure a user can't bookmark the same event twice
  CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fetching user's bookmarks
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);

-- Index for checking if event is bookmarked
CREATE INDEX IF NOT EXISTS idx_watchlist_event_id ON public.watchlist(event_id);

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON public.watchlist(created_at DESC);

-- Composite index for the primary query pattern (user's bookmarks ordered by date)
CREATE INDEX IF NOT EXISTS idx_watchlist_user_created ON public.watchlist(user_id, created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.watchlist IS 'User watchlist/bookmarks for prediction market events';
COMMENT ON COLUMN public.watchlist.event_id IS 'Polymarket event ID (stored as TEXT to match Event type)';
COMMENT ON COLUMN public.watchlist.created_at IS 'When the bookmark was created (for ordering)';
COMMENT ON CONSTRAINT unique_user_event ON public.watchlist IS 'Prevents duplicate bookmarks for the same event';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bookmarks
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can add to their own watchlist
CREATE POLICY "Users can insert own watchlist"
  ON public.watchlist
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can remove from their own watchlist
CREATE POLICY "Users can delete own watchlist"
  ON public.watchlist
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- No update policy needed - bookmarks are immutable (only add/remove)

COMMENT ON POLICY "Users can view own watchlist" ON public.watchlist IS
  'Authenticated users can read their own watchlist entries';

COMMENT ON POLICY "Users can insert own watchlist" ON public.watchlist IS
  'Authenticated users can bookmark events';

COMMENT ON POLICY "Users can delete own watchlist" ON public.watchlist IS
  'Authenticated users can remove bookmarks';
