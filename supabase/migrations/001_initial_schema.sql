-- Glitch Markets Initial Schema Migration
-- This migration creates the core tables for user management and Polymarket integration

-- Users table
-- Extends Supabase Auth users with app-specific data
-- Uses UUID to reference auth.users.id directly
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,

  -- Server Wallet (Backend MPC Wallet) - for automated Polymarket trading
  server_wallet_address TEXT, -- Address of the server-controlled wallet
  server_wallet_id TEXT, -- Dynamic wallet ID
  encrypted_server_key_shares TEXT, -- Encrypted external key shares (JSON)
  server_wallet_public_key TEXT, -- Public key hex

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Polymarket credentials table
-- Stores encrypted CLOB API credentials for trading
-- User must exist in users table before Polymarket registration
CREATE TABLE IF NOT EXISTS public.polymarket_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL, -- Server wallet address
  proxy_wallet_address TEXT NOT NULL, -- Polymarket proxy wallet (CREATE2 derived)
  encrypted_api_key TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  encrypted_passphrase TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_server_wallet_address ON public.users(server_wallet_address);
CREATE INDEX IF NOT EXISTS idx_polymarket_credentials_user_id ON public.polymarket_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_polymarket_credentials_wallet_address ON public.polymarket_credentials(wallet_address);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE public.polymarket_credentials IS 'Encrypted Polymarket CLOB API credentials for automated trading';

COMMENT ON COLUMN public.users.id IS 'References auth.users.id (Supabase Auth UUID)';
COMMENT ON COLUMN public.users.server_wallet_address IS 'Address of the server-controlled MPC wallet';
COMMENT ON COLUMN public.users.encrypted_server_key_shares IS 'Encrypted external key shares stored as JSON';

COMMENT ON COLUMN public.polymarket_credentials.proxy_wallet_address IS 'Polymarket proxy wallet address (CREATE2 derived)';
COMMENT ON COLUMN public.polymarket_credentials.encrypted_api_key IS 'AES encrypted Polymarket API key';
COMMENT ON COLUMN public.polymarket_credentials.encrypted_secret IS 'AES encrypted Polymarket API secret';
COMMENT ON COLUMN public.polymarket_credentials.encrypted_passphrase IS 'AES encrypted Polymarket API passphrase';
