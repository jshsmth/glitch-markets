-- Add deployment tracking to polymarket_credentials
-- This tracks when the proxy wallet was actually deployed on-chain

ALTER TABLE public.polymarket_credentials
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deployment_tx_hash TEXT;

-- Add index for querying deployed wallets
CREATE INDEX IF NOT EXISTS idx_polymarket_credentials_deployed_at
ON public.polymarket_credentials(deployed_at);

-- Add comments
COMMENT ON COLUMN public.polymarket_credentials.deployed_at
IS 'Timestamp when the proxy wallet was deployed on-chain via relayer';

COMMENT ON COLUMN public.polymarket_credentials.deployment_tx_hash
IS 'Transaction hash of the deployment transaction';
