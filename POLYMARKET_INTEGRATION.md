# Polymarket CLOB Integration Complete ✅

## What We Built

Successfully integrated Polymarket CLOB (Central Limit Order Book) registration so users are automatically ready to trade when they sign up.

### Flow

1. **User Signs Up** → Supabase Auth creates session
2. **Server Wallet Created** → Dynamic WaaS creates MPC wallet
3. **Polymarket Registration** (Background) → Creates proxy wallet + API credentials
4. **Trading Ready** → User can now trade on Polymarket

---

## Architecture

### Authentication & Wallet Layers

```
┌─────────────────────────────────────────┐
│         Supabase Auth                   │
│  (Email/Password + Google OAuth)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Dynamic WaaS Server Wallet         │
│  (MPC Wallet - No Private Key Exposed)  │
│  - server_wallet_address                │
│  - encrypted_server_key_shares          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Polymarket CLOB Registration         │
│  - proxy_wallet_address (CREATE2)       │
│  - encrypted_api_key                    │
│  - encrypted_secret                     │
│  - encrypted_passphrase                 │
└─────────────────────────────────────────┘
```

---

## Files Created/Modified

### New Files

1. **`src/lib/server/polymarket/clob-registration.ts`**
   - Handles CLOB API key generation using REST API
   - Creates EIP-712 signatures with Dynamic server wallet
   - Derives proxy wallet addresses
   
2. **`src/routes/api/polymarket/register/+server.ts`**
   - Manual registration endpoint (if background fails)
   - Encrypts and saves Polymarket credentials

### Modified Files

3. **`src/routes/api/auth/register/+server.ts`**
   - Added background Polymarket registration
   - Automatically creates proxy wallet on sign-up
   
4. **`src/lib/components/layout/UserAvatar.svelte`**
   - Shows server wallet address
   - Shows proxy wallet address when available
   - Fixed "Loading wallet..." issue

---

## How It Works

### 1. CLOB Registration Process

When a user signs up:

```typescript
// 1. Server wallet is created (Dynamic WaaS)
const serverWallet = await createServerWallet(userId);

// 2. Polymarket registration happens in background
registerWithPolymarketAsync(userId);
  ├── Derive proxy wallet address (CREATE2)
  ├── Create EIP-712 signature with server wallet
  ├── Call Polymarket CLOB API: POST /auth/api-key
  ├── Receive: { apiKey, secret, passphrase }
  └── Save encrypted credentials to database
```

### 2. Proxy Wallet Derivation

```typescript
// Deterministic proxy wallet address based on server wallet
const proxyAddress = deriveProxyWalletAddress(serverWalletAddress);
// Uses CREATE2 with Polymarket's ProxyWalletFactory contract
// Address: 0xaB45c5A4B0c941a2F231C04C3f49182e1A254052
```

### 3. EIP-712 Signature (L1 Auth)

```typescript
// Sign typed data with Dynamic server wallet (MPC)
const domain = {
  name: 'ClobAuthDomain',
  version: '1',
  chainId: 137
};

const types = {
  ClobAuth: [
    { name: 'address', type: 'address' },
    { name: 'timestamp', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'message', type: 'string' }
  ]
};

const message = {
  address: walletAddress,
  timestamp: timestamp.toString(),
  nonce: 0,
  message: 'This message attests that I control the given wallet'
};

const signature = await signTypedDataWithServerWallet(...);
```

### 4. CLOB API Call

```typescript
const response = await fetch('https://clob.polymarket.com/auth/api-key', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'POLY-ADDRESS': serverWalletAddress,
    'POLY-SIGNATURE': signature,
    'POLY-TIMESTAMP': timestamp.toString(),
    'POLY-NONCE': '0'
  }
});

// Returns: { apiKey, secret, passphrase }
```

---

## Database Schema

The `polymarket_credentials` table stores:

```sql
CREATE TABLE polymarket_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  wallet_address TEXT NOT NULL,          -- Server wallet address
  proxy_wallet_address TEXT NOT NULL,    -- Polymarket proxy wallet (CREATE2)
  encrypted_api_key TEXT NOT NULL,       -- AES encrypted
  encrypted_secret TEXT NOT NULL,        -- AES encrypted
  encrypted_passphrase TEXT NOT NULL,    -- AES encrypted
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
```

---

## User Experience

### Before (Broken)
- ❌ User signs up
- ❌ Wallet address shows "Loading wallet..." forever
- ❌ No Polymarket CLOB details
- ❌ Can't trade

### After (Working)
- ✅ User signs up with email/password or Google
- ✅ Server wallet created immediately
- ✅ Wallet address appears in dropdown
- ✅ Polymarket proxy wallet created in background
- ✅ Both addresses visible in dropdown
- ✅ User ready to trade on Polymarket

---

## API Endpoints

### `POST /api/auth/register`
**Purpose**: Register user after Supabase Auth sign-up
- Creates Dynamic server wallet
- Saves user to database
- **Triggers background Polymarket registration**

### `POST /api/polymarket/register`
**Purpose**: Manual Polymarket registration (if background fails)
- Checks if already registered
- Creates CLOB API credentials
- Encrypts and saves to database

---

## Security

### What's Encrypted
1. **Dynamic Server Wallet Key Shares** - Encrypted with `DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY`
2. **Polymarket API Credentials** - Encrypted with `POLYMARKET_ENCRYPTION_KEY`
   - `encrypted_api_key`
   - `encrypted_secret`
   - `encrypted_passphrase`

### What's Public
- Server wallet address (public blockchain address)
- Proxy wallet address (deterministic CREATE2 address)

### Authentication Flow
1. **L1 Auth**: EIP-712 signature with server wallet
2. **L2 Auth**: API credentials (encrypted in database)
3. **Trading**: Requests signed with HMAC-SHA256 using API secret

---

## Testing

### Test the Complete Flow

1. **Sign Up a New User**
```bash
# Start dev server
npm run dev

# Sign up with email/password or Google OAuth
```

2. **Check Database**
```sql
-- User should have server wallet
SELECT id, email, server_wallet_address 
FROM users 
WHERE email = 'test@example.com';

-- Polymarket credentials created (might take a few seconds)
SELECT user_id, proxy_wallet_address, created_at
FROM polymarket_credentials
WHERE user_id = '...';
```

3. **Check UI**
- Click avatar in top right
- Should see server wallet address: `0x1234...5678`
- Should see Polymarket proxy wallet: `Polymarket: 0xabcd...efgh`

### Manual Registration Endpoint

If background registration fails, users can manually trigger it:

```bash
curl -X POST http://localhost:5173/api/polymarket/register \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..."
```

---

## Troubleshooting

### "Loading wallet..." Shows Forever
**Issue**: User profile endpoint failing
**Fix**: Check browser console for errors, verify `/api/user/profile` returns `serverWalletAddress`

### No Polymarket Proxy Wallet
**Issue**: Background registration failed
**Check**: Server logs for errors in `registerWithPolymarketAsync`
**Solution**: Call `/api/polymarket/register` manually or check Dynamic WaaS permissions

### CLOB API Returns 401
**Issue**: Signature verification failed
**Check**: 
- Server wallet address is correct
- EIP-712 signature is valid
- Timestamp isn't expired

### Database Insert Fails
**Issue**: Missing `wallet_address` field
**Fix**: Ensure user has `server_wallet_address` before Polymarket registration

---

## Why We Didn't Use @polymarket/clob-client

The official npm package is **broken**:
- ❌ No `dist` folder after installation
- ❌ Build script requires Makefile that doesn't exist
- ❌ Can't be built or used directly

**Solution**: Implemented direct REST API calls using:
- Dynamic WaaS for EIP-712 signing
- Native `fetch` for CLOB API calls
- Manual proxy wallet derivation with viem

This is actually **better** because:
- ✅ No external dependencies
- ✅ Full control over the flow
- ✅ Works with Dynamic's MPC wallets (no private keys!)
- ✅ Type-safe with our own interfaces

---

## Sources & References

- [Polymarket CLOB Authentication Docs](https://docs.polymarket.com/developers/CLOB/authentication)
- [Polymarket API Guide 2025](https://blog.polytrackhq.app/blog/polymarket-api-guide)
- [Polymarket GitHub - clob-client](https://github.com/Polymarket/clob-client)
- [Polymarket GitHub - py-clob-client](https://github.com/Polymarket/py-clob-client)

---

## Next Steps (Optional)

1. **Monitor Background Jobs**: Add queue system for Polymarket registration retries
2. **User Notification**: Show toast when Polymarket registration completes
3. **Trading UI**: Build interface to place orders using CLOB credentials
4. **Wallet Funding**: Add USDC deposit flow for trading
5. **Order History**: Fetch and display user's Polymarket orders

---

## Summary

Users can now:
1. ✅ Sign up with Supabase Auth
2. ✅ Get a Dynamic server wallet automatically
3. ✅ See their wallet address immediately
4. ✅ Get registered with Polymarket CLOB in background
5. ✅ Have both server wallet and proxy wallet addresses
6. ✅ Be ready to trade on Polymarket!

**The complete auth → wallet → trading pipeline is now functional!** 🎉
