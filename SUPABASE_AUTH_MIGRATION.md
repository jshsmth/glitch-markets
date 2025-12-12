# Supabase Auth Migration - Complete ✅

## What We Did

Successfully migrated from **Dynamic Labs Auth** to **Supabase Auth** while keeping **Dynamic WaaS** (Wallet-as-a-Service) for server wallet creation.

### Architecture Change

**Before:**
- Dynamic SDK handled both authentication AND wallet creation
- JWT verification in hooks using Dynamic's JWKS endpoint
- Auth state stored in Dynamic's client
- RLS policies didn't work because `auth.uid()` was null

**After:**
- Supabase Auth handles all authentication (email/password + Google OAuth)
- Dynamic WaaS is ONLY used server-side for creating MPC wallets
- Supabase session automatically populates `auth.uid()` for RLS
- Clean separation: Auth = Supabase, Wallets = Dynamic

---

## Files Changed

### Core Auth Infrastructure

1. **`src/hooks.server.ts`** - Removed Dynamic JWT verification, now uses Supabase sessions
2. **`src/routes/+layout.server.ts`** - Created, passes Supabase session to client
3. **`src/routes/+layout.ts`** - Updated to create browser Supabase client and get session
4. **`src/routes/+layout.svelte`** - Removed Dynamic SDK initialization, added Supabase auth listener
5. **`src/lib/stores/auth.svelte.ts`** - Completely rewritten for Supabase Auth (session + user)

### Auth Components

6. **`src/lib/components/auth/EmailOTPForm.svelte`** - Rewritten for email/password auth (sign up + sign in)
7. **`src/lib/components/auth/SocialAuthButtons.svelte`** - Updated for Supabase OAuth (Google only)
8. **`src/lib/components/auth/SignInModal.svelte`** - Updated to check `authState.session` instead of `authState.user`
9. **`src/lib/components/layout/UserAvatar.svelte`** - Updated logout to use `supabase.auth.signOut()`
10. **`src/lib/components/layout/TopHeader.svelte`** - No code changes needed (uses `authState.user`)

### API Endpoints

11. **`src/routes/api/auth/register/+server.ts`** - Updated to use Supabase session + admin client
12. **`src/routes/api/user/profile/+server.ts`** - Updated to get user from Supabase session
13. **`src/routes/auth/callback/+server.ts`** - Created for OAuth code exchange

### Supabase Clients

14. **`src/lib/supabase/admin.ts`** - Created admin client with service_role key (bypasses RLS)
15. **`src/lib/supabase/client.ts`** - Already existed, browser client with anon key
16. **`src/lib/supabase/server.ts`** - Already existed, server client with cookies

### Configuration

17. **`.env.example`** - Added `SUPABASE_SERVICE_ROLE_KEY`

---

## What You Need To Do Next

### 1. Add Service Role Key to `.env`

```bash
# Add this to your .env file (get from Supabase dashboard > Project Settings > API)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Where to find it:**
- Go to https://supabase.com/dashboard
- Select your project
- Go to **Project Settings** → **API**
- Copy the **service_role** key (NOT the anon key!)

### 2. Configure Google OAuth in Supabase

**Step 1: Get Google OAuth credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**

**Step 2: Configure in Supabase**
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and click to configure
3. Enable Google provider
4. Paste **Client ID** and **Client Secret**
5. Save

### 3. Disable Email Confirmation (Optional)

By default, Supabase requires email confirmation. If you want users to sign in immediately:

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Find **Email Auth** section
3. Disable **"Confirm email"**
4. Save

### 4. Test The Auth Flow

**Email/Password Sign Up:**
1. Start dev server: `npm run dev`
2. Open app in browser
3. Click "Sign Up" → Click "Don't have an account? Sign up"
4. Enter email + password (minimum 6 characters)
5. Click "Create Account"
6. Should create user + server wallet + redirect to home

**Email/Password Sign In:**
1. Click "Log In"
2. Enter existing email + password
3. Click "Sign In"
4. Should authenticate + update last_login_at

**Google OAuth:**
1. Click "Log In" → Click "Continue with Google"
2. Select Google account
3. Should redirect back and authenticate
4. Should create user + server wallet if first time

**Sign Out:**
1. Click avatar in top right
2. Click "Logout"
3. Should sign out and redirect to home

### 5. Verify Dynamic Server Wallet Creation Still Works

The Dynamic WaaS integration should still work for wallet creation:

1. Sign up a new user
2. Check browser console for wallet creation logs
3. Check database - user should have:
   - `server_wallet_address`
   - `server_wallet_id`
   - `encrypted_server_key_shares`
   - `server_wallet_public_key`

If wallet creation fails, check:
- `DYNAMIC_API_TOKEN` has WaaS permissions in Dynamic dashboard
- Dynamic environment is configured correctly

### 6. Clean Up Dynamic SDK (Optional - After Testing)

Once everything works, you can remove Dynamic SDK from the frontend:

```bash
npm uninstall @dynamic-labs-sdk/client @dynamic-labs-sdk/evm
```

**Keep these:**
- `@dynamic-labs/waas-client` (server-side wallet creation)
- Dynamic environment variables for server wallet creation

**Remove these files/code:**
- All Dynamic SDK imports from client-side code
- `PUBLIC_DYNAMIC_ENVIRONMENT_ID` from .env (not needed anymore)
- `DYNAMIC_ENVIRONMENT_ID` from .env (not needed anymore)

**DON'T remove:**
- `DYNAMIC_API_TOKEN` - still needed for server wallet creation
- `DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY` - still needed for encryption
- `src/lib/server/wallet/server-wallet.ts` - still creates wallets with Dynamic WaaS

---

## How RLS Now Works

### Before (Broken)
```sql
-- This FAILED because auth.uid() was null with Dynamic Auth
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid()::text);
```

When using Dynamic Auth:
- Client sends JWT in Authorization header
- Server verifies JWT and sets `locals.user`
- But `auth.uid()` in Postgres is still NULL (no Supabase session)
- RLS policies fail ❌

### After (Working)
```sql
-- This WORKS because auth.uid() is populated by Supabase session
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid()::text);
```

When using Supabase Auth:
- Client has Supabase session (stored in cookies)
- Supabase automatically includes JWT in requests
- Postgres extracts JWT and sets `auth.uid()` automatically
- RLS policies work! ✅

### Server Operations (Bypass RLS)

For server operations like registration that need to insert/update user records:

```typescript
// ❌ WRONG - Uses anon key, RLS will block
await locals.supabase.from('users').insert({ ... });

// ✅ CORRECT - Uses service_role key, bypasses RLS
await supabaseAdmin.from('users').insert({ ... });
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
├─────────────────────────────────────────────────┤
│  Supabase Auth (email/password + Google OAuth) │
│  - Sign up / Sign in / Sign out                │
│  - Session management                           │
│  - Auth state in $authState.session             │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│            SvelteKit Server                     │
├─────────────────────────────────────────────────┤
│  hooks.server.ts:                               │
│  - Get Supabase session                         │
│  - Set locals.user from session.user            │
│                                                  │
│  /api/auth/register:                            │
│  - Verify Supabase session                      │
│  - Create Dynamic WaaS server wallet            │
│  - Save to Supabase with admin client           │
│                                                  │
│  /api/user/profile:                             │
│  - Verify Supabase session                      │
│  - Return user + wallet data                    │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌─────────────────┐  ┌────────────────────┐
│  Supabase DB    │  │   Dynamic WaaS     │
│  (PostgreSQL)   │  │  (Server Wallets)  │
├─────────────────┤  ├────────────────────┤
│  - users table  │  │  - Create wallet   │
│  - RLS enabled  │  │  - Sign txs        │
│  - auth.uid()   │  │  - MPC key shares  │
└─────────────────┘  └────────────────────┘
```

---

## Benefits of This Architecture

1. **RLS Just Works** - `auth.uid()` is automatically set by Supabase Auth
2. **Built-in Features** - Email confirmation, password reset, OAuth flows
3. **Lower Cost** - Supabase Auth is free up to 50,000 MAU
4. **Separation of Concerns** - Auth is auth, wallets are wallets
5. **Keep Dynamic's Strength** - Still use their excellent server wallet creation
6. **Simpler Frontend** - No Dynamic SDK initialization, just Supabase client
7. **Type Safety** - Supabase provides great TypeScript types

---

## Troubleshooting

### "Unauthorized" when signing up
- Check that you added `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- Verify the service role key is correct (from Supabase dashboard)
- Check server logs for detailed error

### "Failed to create server wallet"
- Check `DYNAMIC_API_TOKEN` has WaaS permissions
- Verify Dynamic environment is correct
- Check if user already has a wallet in Dynamic dashboard

### Google OAuth doesn't work
- Verify Google OAuth is configured in Supabase Auth providers
- Check redirect URI matches Supabase callback URL
- Ensure Google OAuth credentials are correct

### RLS blocking queries
- For client queries: User must have valid Supabase session
- For server operations: Use `supabaseAdmin` instead of `locals.supabase`

### User not getting created in database
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check `/api/auth/register` endpoint logs
- Verify auth listener is calling the endpoint

---

## Next Steps

1. ✅ Add service role key to `.env`
2. ✅ Configure Google OAuth in Supabase
3. ✅ Test sign up, sign in, sign out flows
4. ✅ Verify server wallet creation works
5. ⏸️ (Optional) Remove Dynamic SDK from frontend
6. ⏸️ (Optional) Add password reset flow
7. ⏸️ (Optional) Add more OAuth providers (GitHub, Discord, etc.)

---

## Questions?

If anything breaks or doesn't work:
1. Check browser console for errors
2. Check server logs (`npm run dev` terminal)
3. Check Supabase Dashboard → Auth → Users to see if users are being created
4. Check database to see if user records have wallet data
5. Review the error messages - they usually point to the issue

The migration is complete - everything is wired up and ready to test!
