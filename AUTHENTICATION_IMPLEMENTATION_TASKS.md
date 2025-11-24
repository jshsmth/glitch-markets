# Authentication System - Implementation Tasks

**Document Status:** Ready for Implementation
**Last Updated:** 2025-11-25 00:00
**Architecture Reference:** [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md)
**Feature:** Dynamic Wallet SDK + Polymarket CLOB Authentication

---

## ✅ Documentation Verification Complete

All tasks have been verified against official Dynamic.xyz documentation. Key findings:

### Packages Required (Task #1)
- ✅ `@dynamic-labs-sdk/client` - Main SDK for authentication
- ✅ `@dynamic-labs-sdk/evm` - Viem wallet client integration
- ✅ `jose` - JWT verification (modern alternative to jsonwebtoken)
- ❌ **NO Node SDK packages needed** - Not using server wallets or delegation

### Dashboard Configuration
- **Email Auth:** Navigate to `https://app.dynamic.xyz/dashboard/log-in-user-profile`
- **Embedded Wallets:** Enable "Create on Sign up" toggle for automatic wallet creation
- **CSP Headers:** Must whitelist `https://app.dynamicauth.com` in `frame-src` directive

### JWT Verification (Task #16)
- **JWKS Endpoint:** `https://app.dynamic.xyz/api/v0/sdk/${ENV_ID}/.well-known/jwks`
- **Algorithm:** RS256 (asymmetric)
- **Library:** Using `jose` (more modern than jsonwebtoken + jwks-rsa)

### Key Documentation Links Added
- Task #1: [JavaScript SDK Quickstart](https://www.dynamic.xyz/docs/javascript-sdk/quickstart)
- Task #5: [Creating Wallets](https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/creating-wallets)
- Task #6: [Email Auth](https://www.dynamic.xyz/docs/authentication-methods/email), [Social Auth](https://www.dynamic.xyz/docs/authentication-methods/social)
- Task #7: [MPC Setup (CSP)](https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/setup)
- Task #10: [Viem Wallet Client](https://www.dynamic.xyz/docs/javascript-sdk/evm/getting-viem-wallet-client)
- Task #16: [Backend Validation](https://www.dynamic.xyz/docs/authentication-methods/how-to-validate-users-on-the-backend)

---

## Progress Overview

📊 **Overall Progress:** ░░░░░░░░░░ 0% (0/29 tasks completed)

📍 **Current Phase:** Not Started
⏱️ **Last Updated:** 2025-11-25 00:00
🎯 **Next Milestone:** Complete Phase 1 Setup (Tasks #1-7)

### Phase Breakdown

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Setup           [░░░░░░░░░░░░] 0% (0/7)      │
│ Phase 2: Frontend        [░░░░░░░░░░░░] 0% (0/6)      │
│ Phase 3: Backend         [░░░░░░░░░░░░] 0% (0/7)      │
│ Phase 4: Integration     [░░░░░░░░░░░░] 0% (0/5)      │
│ Phase 5: Testing         [░░░░░░░░░░░░] 0% (0/4)      │
└─────────────────────────────────────────────────────────┘
```

---

## Task Dependency Graph

```
Phase 1: Setup
Task #1 (Install Packages) ──┬──> Task #5 (Enable Embedded Wallets)
Task #2 (Dynamic Account)────┤
Task #3 (Env Variables)──────┤
Task #4 (Encryption Key)─────┘

Phase 2: Frontend
Task #5 ──> Task #8 (Dynamic Client) ──> Task #9 (Auth UI) ──> Task #10 (Polymarket Component)
Task #6 (Dashboard Config) ──┘                                      │
Task #7 (CSP Headers)                                               │
                                                                     │
Phase 3: Backend                                                    │
Task #3 ──> Task #14 (DB Schema) ──> Task #15 (Migrations) ──> Task #16 (JWT Verification)
                                                  │                  │
                                                  └──> Task #17 ──────┤
                                                  └──> Task #18 ──────┤
                                                                     │
Phase 4: Integration                                                │
Task #10 ───> Task #23 (Wire Frontend) ──────────────────────────> Task #24 (E2E Test)
Task #18 ───┘                                                       │
Task #22 ──────────────────────────────────────────────────────────┘

Phase 5: Testing
Task #24 ──> Task #26 (Fix Issues) ──> Task #27 (Production Config)
```

---

## Tasks

### 🏗️ Phase 1: Setup & Configuration

**Objective:** Set up all prerequisites, accounts, and environment configuration before writing any code.

---

- [ ] **Task #1:** Install required npm packages ⏱️ 15min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Key Implementation Steps #1"
  - **Dependencies:** None
  - **Reference:** https://www.dynamic.xyz/docs/javascript-sdk/quickstart
  - **Commands:**
    ```bash
    npm install @dynamic-labs-sdk/client @dynamic-labs-sdk/evm jose
    # viem already installed (package.json line 59)
    ```
  - **Completion Criteria:**
    - [ ] `@dynamic-labs-sdk/client` installed (main SDK)
    - [ ] `@dynamic-labs-sdk/evm` installed (for Viem integration)
    - [ ] `jose` installed (JWT verification)
    - [ ] `package.json` updated
    - [ ] No dependency conflicts
  - **Verification:** Run `npm list @dynamic-labs-sdk/client @dynamic-labs-sdk/evm jose` to confirm installation
  - **Files Modified:** `package.json`, `package-lock.json`
  - **Note:** Only frontend packages needed - NO Node SDK required for this architecture

---

- [ ] **Task #2:** Create Dynamic.xyz account and get environment ID ⏱️ 20min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 1"
  - **Dependencies:** None
  - **Steps:**
    1. Visit https://app.dynamic.xyz/
    2. Sign up for account
    3. Create new environment (name: "Glitch Markets")
    4. Navigate to Dashboard → Developer → API
    5. Copy environment ID
  - **Completion Criteria:**
    - [ ] Dynamic account created
    - [ ] Environment created
    - [ ] Environment ID copied
    - [ ] Can access Dynamic dashboard
  - **Notes:** Save environment ID for Task #3

---

- [ ] **Task #3:** Configure environment variables ⏱️ 10min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Environment Variables"
  - **Dependencies:** Task #2 (Dynamic account), Task #4 (encryption key)
  - **Files:** `.env` (create/update)
  - **Variables to Add:**
    ```bash
    # Dynamic Configuration (Client)
    PUBLIC_DYNAMIC_ENVIRONMENT_ID="<from-task-2>"

    # Dynamic Configuration (Server)
    DYNAMIC_ENVIRONMENT_ID="<from-task-2>"

    # Encryption Keys (from Task #4)
    POLYMARKET_ENCRYPTION_KEY="<from-task-4>"

    # Polymarket Configuration
    POLYMARKET_CLOB_URL="https://clob.polymarket.com"
    POLYMARKET_GAMMA_API_URL="https://gamma-api.polymarket.com"
    ```
  - **Completion Criteria:**
    - [ ] `.env` file created/updated
    - [ ] All variables added
    - [ ] `.env.example` updated with placeholders
    - [ ] `.env` in `.gitignore`
  - **Verification:** Run `node -e "console.log(process.env.PUBLIC_DYNAMIC_ENVIRONMENT_ID)"` to test
  - **Files Modified:** `.env`, `.env.example`

---

- [ ] **Task #4:** Generate encryption key for credential storage ⏱️ 5min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Security Considerations #1"
  - **Dependencies:** None
  - **Command:**
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - **Completion Criteria:**
    - [ ] 32-byte hex key generated
    - [ ] Key saved securely (password manager recommended)
    - [ ] Key ready for Task #3
  - **Security Warning:** This key encrypts ALL Polymarket credentials. Never commit to git. Store in secure location.
  - **Notes:** Keep this key safe - losing it means losing access to all encrypted credentials

---

- [ ] **Task #5:** Enable embedded wallets in Dynamic dashboard ⏱️ 15min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 1"
  - **Dependencies:** Task #2 (Dynamic account)
  - **Reference:** https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/creating-wallets
  - **Steps:**
    1. Login to Dynamic dashboard (https://app.dynamic.xyz/dashboard)
    2. Navigate to Embedded Wallets configuration
    3. Toggle "Enable Embedded Wallets" ON
    4. **Enable "Create on Sign up" toggle** - this automatically creates wallets for users during authentication
    5. Configure supported networks:
       - Enable Polygon (for Polymarket)
       - Enable Polygon Mainnet
    6. Save settings
  - **Completion Criteria:**
    - [ ] Embedded wallets enabled
    - [ ] "Create on Sign up" toggle enabled (wallets auto-created)
    - [ ] Polygon network configured
    - [ ] Settings saved
  - **Verification:** Dashboard should show "Embedded Wallets: Active" and users should get wallets automatically on sign-up
  - **Note:** With "Create on Sign up" enabled, NO manual wallet creation code needed in frontend

---

- [ ] **Task #6:** Configure authentication methods in Dynamic dashboard ⏱️ 15min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 2"
  - **Dependencies:** Task #2 (Dynamic account)
  - **References:**
    - Email: https://www.dynamic.xyz/docs/authentication-methods/email
    - Social: https://www.dynamic.xyz/docs/authentication-methods/social
    - Branded Wallets: https://www.dynamic.xyz/docs/authentication-methods/branded-wallets
  - **Steps:**
    1. Navigate to https://app.dynamic.xyz/dashboard/log-in-user-profile
    2. **Enable Email Authentication:**
       - Toggle "Email" ON
       - No additional configuration needed (default OTP settings work)
       - Rate limiting: 3 attempts per 10 minutes per email (automatic)
    3. **Enable Social Authentication:**
       - Navigate to Social Providers section
       - Toggle "Google" ON
       - Toggle "Twitter" ON
       - (Optional) Enable Discord
    4. **Disable Branded Wallets (for now):**
       - Navigate to Branded Wallets section
       - Ensure MetaMask, Phantom, etc. are toggled OFF
    5. Save all settings
  - **Completion Criteria:**
    - [ ] Email authentication enabled in dashboard
    - [ ] Google social login enabled
    - [ ] Twitter social login enabled
    - [ ] Branded wallets disabled (can re-enable later)
    - [ ] Settings saved
    - [ ] All methods appear in Dynamic widget
  - **Verification:** Open Dynamic widget - should see Email and Social options, no wallet connectors
  - **Notes:** Branded wallets can be re-enabled later per Architecture doc

---

- [ ] **Task #7:** Configure CSP headers for Dynamic iframe ⏱️ 10min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Security Considerations #3"
  - **Dependencies:** None
  - **Reference:** https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/setup
  - **Files:** `src/hooks.server.ts`
  - **Implementation:**
    ```typescript
    // Add to hooks.server.ts handle function
    event.setHeaders({
      'Content-Security-Policy':
        "default-src 'self'; frame-src https://app.dynamicauth.com 'self';"
    });
    ```
  - **Completion Criteria:**
    - [ ] CSP `frame-src` directive configured in `hooks.server.ts`
    - [ ] `https://app.dynamicauth.com` whitelisted
    - [ ] `'self'` included to allow same-origin frames
    - [ ] Other CSP directives don't conflict
  - **Verification:** Check browser console for CSP errors when loading Dynamic widget - should see no iframe blocking errors
  - **Files Modified:** `src/hooks.server.ts`
  - **Note:** If you already have CSP configured, APPEND to existing `frame-src` directive rather than replace

---

### ⚙️ Phase 2: Frontend Implementation

**Objective:** Build the frontend authentication UI and integrate Dynamic SDK.

---

- [ ] **Task #8:** Create Dynamic client wrapper in +layout.svelte ⏱️ 30min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Frontend Setup #2"
  - **Dependencies:** Task #1 (packages installed), Task #3 (env vars)
  - **Files:** `src/routes/+layout.svelte`
  - **Implementation:** See Architecture doc lines 299-325
  - **Completion Criteria:**
    - [ ] Dynamic client created with environment ID
    - [ ] Metadata configured (name, url, iconUrl)
    - [ ] Browser-only initialization (`if (browser)`)
    - [ ] DynamicProvider wraps slot
    - [ ] No TypeScript errors
  - **Verification:** Dynamic widget should appear when navigating to any page
  - **Files Created/Modified:** `src/routes/+layout.svelte`
  - **Notes:** May need to install additional packages if using React components

---

- [ ] **Task #9:** Create authentication UI component ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Frontend Components"
  - **Dependencies:** Task #8 (Dynamic client setup)
  - **Files:** `src/lib/components/Auth/AuthButton.svelte`
  - **Features:**
    - Login button with Dynamic widget
    - Display user info when signed in
    - Logout functionality
    - Email + Social login options
  - **Completion Criteria:**
    - [ ] Component created with Svelte 5 syntax
    - [ ] `dynamicClient.isSignedIn()` checked
    - [ ] User data displayed (`dynamicClient.user`)
    - [ ] Logout button calls `dynamicClient.logout()`
    - [ ] Styled with CSS variables from brand-colors.md
  - **Verification:** Should be able to sign in with email/OTP or social login
  - **Files Created:** `src/lib/components/Auth/AuthButton.svelte`

---

- [ ] **Task #10:** Create Polymarket authorization component ⏱️ 1h
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Frontend Components - Polymarket Authorization Component"
  - **Dependencies:** Task #1 (@dynamic-labs-sdk/evm installed), Task #9 (Auth UI)
  - **Reference:** https://www.dynamic.xyz/docs/javascript-sdk/evm/getting-viem-wallet-client
  - **Files:** `src/lib/components/PolymarketAuth.svelte`
  - **Implementation:** See Architecture doc lines 478-608
  - **Key Import:**
    ```typescript
    import { createWalletClientForWalletAccount } from '@dynamic-labs-sdk/evm/viem';
    ```
  - **Completion Criteria:**
    - [ ] Component scaffolding complete
    - [ ] `createWalletClientForWalletAccount` imported from `@dynamic-labs-sdk/evm/viem` (correct package)
    - [ ] Get wallet account from `dynamicClient.getWalletAccounts()`
    - [ ] Create Viem wallet client with `createWalletClientForWalletAccount({ walletAccount })`
    - [ ] `registerWithPolymarket()` function implemented
    - [ ] Message signing flow: `walletClient.signMessage({ message })`
    - [ ] Registration status checking (`checkRegistration()`)
    - [ ] Error handling with user-friendly messages
    - [ ] Loading states (isRegistering)
    - [ ] Success/error display
  - **Verification:** Should be able to click "Enable Trading" and see signature request from wallet
  - **Files Created:** `src/lib/components/PolymarketAuth.svelte`

---

- [ ] **Task #11:** Create auth store for client state management ⏱️ 30min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture diagram "Client State Management"
  - **Dependencies:** Task #8 (Dynamic client)
  - **Files:** `src/lib/stores/auth.ts`
  - **Implementation:**
    ```typescript
    import { writable, derived } from 'svelte/store';
    import type { DynamicClient } from '@dynamic-labs-sdk/client';

    export const dynamicClient = writable<DynamicClient | null>(null);
    export const isAuthenticated = derived(
      dynamicClient,
      $client => $client?.isSignedIn() ?? false
    );
    export const user = derived(
      dynamicClient,
      $client => $client?.user ?? null
    );
    ```
  - **Completion Criteria:**
    - [ ] Store created with TypeScript types
    - [ ] `dynamicClient` store exports client instance
    - [ ] Derived stores for `isAuthenticated` and `user`
    - [ ] No TypeScript errors
  - **Files Created:** `src/lib/stores/auth.ts`

---

- [ ] **Task #12:** Enable HTTPS for local development ⏱️ 20min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Security Considerations #3"
  - **Dependencies:** None (vite-plugin-mkcert already installed)
  - **Files:** `vite.config.ts`
  - **Implementation:**
    ```typescript
    import { defineConfig } from 'vite';
    import { sveltekit } from '@sveltejs/kit/vite';
    import mkcert from 'vite-plugin-mkcert';

    export default defineConfig({
      plugins: [sveltekit(), mkcert()],
      server: {
        https: true
      }
    });
    ```
  - **Completion Criteria:**
    - [ ] `mkcert` plugin added to vite.config.ts
    - [ ] HTTPS enabled for dev server
    - [ ] Local certificate generated
    - [ ] Dev server starts on https://localhost:5173
  - **Verification:** Visit https://localhost:5173 and verify SSL certificate
  - **Files Modified:** `vite.config.ts`

---

- [ ] **Task #13:** Create user registration flow component ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture diagram "User Registration in YOUR Database"
  - **Dependencies:** Task #9 (Auth UI), Task #17 (register endpoint created)
  - **Files:** `src/lib/components/Auth/UserRegistration.svelte`
  - **Implementation:**
    - Call `/api/auth/register` after Dynamic authentication
    - Send JWT in Authorization header
    - Handle success/error states
    - Show registration confirmation
  - **Completion Criteria:**
    - [ ] Component created
    - [ ] POST to `/api/auth/register` on mount if authenticated
    - [ ] JWT sent in Authorization header
    - [ ] Error handling implemented
    - [ ] Loading state displayed
  - **Verification:** User should be created in database after Dynamic login
  - **Files Created:** `src/lib/components/Auth/UserRegistration.svelte`

---

### 🔧 Phase 3: Backend Implementation

**Objective:** Build the backend authentication infrastructure, database schema, and API endpoints.

---

- [ ] **Task #14:** Create database schema for users and credentials ⏱️ 30min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Database Schema"
  - **Dependencies:** Task #3 (env vars with DATABASE_URL)
  - **Files:** `src/lib/server/db/schema.ts`
  - **Implementation:** See Architecture doc lines 839-861
  - **Schema:**
    - `users` table: id, email, walletAddress, createdAt, lastLoginAt
    - `polymarketCredentials` table: id, userId (FK), walletAddress, encryptedApiKey, encryptedSecret, encryptedPassphrase, createdAt, lastUsedAt
  - **Completion Criteria:**
    - [ ] `users` table defined with Drizzle
    - [ ] `polymarketCredentials` table defined with Drizzle
    - [ ] Foreign key relationship configured
    - [ ] All fields properly typed
    - [ ] No TypeScript errors
  - **Files Modified:** `src/lib/server/db/schema.ts`

---

- [ ] **Task #15:** Generate and run database migrations ⏱️ 15min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Database Schema"
  - **Dependencies:** Task #14 (schema created)
  - **Commands:**
    ```bash
    npm run db:generate
    npm run db:push
    ```
  - **Completion Criteria:**
    - [ ] Migration files generated in `drizzle/` directory
    - [ ] Migrations applied to database
    - [ ] `users` table exists in database
    - [ ] `polymarket_credentials` table exists in database
    - [ ] Foreign key constraint created
  - **Verification:** Check database with `npm run db:studio` or PostgreSQL client
  - **Files Created:** Migration files in `drizzle/`

---

- [ ] **Task #16:** Implement JWT verification in hooks.server.ts ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Backend Setup - JWT Verification"
  - **Dependencies:** Task #1 (jose installed), Task #2 (environment ID), Task #7 (CSP headers)
  - **Reference:** https://www.dynamic.xyz/docs/authentication-methods/how-to-validate-users-on-the-backend
  - **Files:** `src/hooks.server.ts`
  - **Implementation:** See Architecture doc lines 331-364
  - **JWKS Endpoint:** `https://app.dynamic.xyz/api/v0/sdk/${YOUR_DYNAMIC_ENV_ID}/.well-known/jwks`
  - **Important Notes:**
    - Dynamic uses **RS256 algorithm** (asymmetric signing)
    - Using `jose` library (modern alternative to jsonwebtoken + jwks-rsa)
    - JWKS endpoint auto-fetches and caches public keys
  - **Completion Criteria:**
    - [ ] `jose` library imported (`jwtVerify`, `createRemoteJWKSet`)
    - [ ] JWKS client created with correct Dynamic endpoint URL
    - [ ] JWT extracted from Authorization header
    - [ ] JWT verified with RS256 algorithm
    - [ ] User info stored in `event.locals.user` (userId, walletAddress, email)
    - [ ] Error handling for invalid/expired tokens (don't crash on auth failure)
    - [ ] No errors logged on valid JWT
  - **Verification:** Send test request with JWT in Authorization header, check `event.locals.user` populated
  - **Files Modified:** `src/hooks.server.ts`
  - **Performance Note:** This runs on EVERY request - jose handles caching efficiently

---

- [ ] **Task #17:** Create user registration endpoint ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Backend Setup - User Registration Endpoint"
  - **Dependencies:** Task #14 (schema), Task #15 (migrations), Task #16 (JWT verification)
  - **Files:** `src/routes/api/auth/register/+server.ts`
  - **Implementation:** See Architecture doc lines 372-409
  - **Completion Criteria:**
    - [ ] POST endpoint created
    - [ ] Checks `locals.user` for authentication
    - [ ] Returns 401 if not authenticated
    - [ ] Creates new user if doesn't exist
    - [ ] Updates lastLoginAt if user exists
    - [ ] Returns success response with user data
    - [ ] Error handling for database errors
  - **Verification:** Test with `curl` or Postman using valid JWT
  - **Files Created:** `src/routes/api/auth/register/+server.ts`

---

- [ ] **Task #18:** Create Polymarket registration endpoint ⏱️ 1h
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Backend Setup - Polymarket Registration Endpoint"
  - **Dependencies:** Task #17 (user registration), Task #19 (crypto utils)
  - **Files:** `src/routes/api/polymarket/register/+server.ts`
  - **Implementation:** See Architecture doc lines 416-470
  - **Completion Criteria:**
    - [ ] POST endpoint created
    - [ ] Requires authentication (`locals.user`)
    - [ ] Receives signature and walletAddress from request
    - [ ] Checks if user already registered with Polymarket
    - [ ] Calls Polymarket CLOB API `/auth/api-key`
    - [ ] Receives apiKey, secret, passphrase
    - [ ] Encrypts credentials with AES-256-GCM
    - [ ] Stores in `polymarket_credentials` table
    - [ ] Returns success response
    - [ ] Error handling for API failures
  - **Verification:** Test complete flow: auth → register user → sign message → register Polymarket
  - **Files Created:** `src/routes/api/polymarket/register/+server.ts`

---

- [ ] **Task #19:** Create encryption utilities ⏱️ 30min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Backend Components - Encryption Utilities"
  - **Dependencies:** Task #4 (encryption key generated)
  - **Files:** `src/lib/server/utils/crypto.ts`
  - **Implementation:** See Architecture doc lines 799-830
  - **Functions:**
    - `encryptWithAES(text: string): string`
    - `decryptWithAES(encrypted: string): string`
  - **Completion Criteria:**
    - [ ] AES-256-GCM algorithm used
    - [ ] Random IV generated for each encryption
    - [ ] Auth tag included in output
    - [ ] Format: `${iv}:${authTag}:${encrypted}`
    - [ ] Decryption reverses process correctly
    - [ ] Unit tests written and passing
  - **Verification:** Test encrypt → decrypt round-trip
  - **Files Created:** `src/lib/server/utils/crypto.ts`
  - **Security:** This is CRITICAL - any bugs here compromise all credentials

---

- [ ] **Task #20:** Create Polymarket status check endpoint ⏱️ 20min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture component - PolymarketAuth `checkRegistration()`
  - **Dependencies:** Task #14 (schema), Task #16 (JWT verification)
  - **Files:** `src/routes/api/polymarket/status/+server.ts`
  - **Implementation:**
    ```typescript
    export async function GET({ locals }) {
      if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const creds = await db.query.polymarketCredentials.findFirst({
        where: eq(polymarketCredentials.userId, locals.user.userId)
      });

      return json({ registered: !!creds });
    }
    ```
  - **Completion Criteria:**
    - [ ] GET endpoint created
    - [ ] Requires authentication
    - [ ] Checks if credentials exist for user
    - [ ] Returns `{ registered: boolean }`
  - **Verification:** Call endpoint after registration, should return `{ registered: true }`
  - **Files Created:** `src/routes/api/polymarket/status/+server.ts`

---

### 🔗 Phase 4: Integration & Wiring

**Objective:** Connect frontend and backend, wire up the complete authentication flow.

---

- [ ] **Task #21:** Wire up frontend authentication flow ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture diagram steps 1-2
  - **Dependencies:** Task #9 (Auth UI), Task #10 (Polymarket component), Task #13 (Registration flow)
  - **Integration Points:**
    1. User clicks login → Dynamic widget appears
    2. User authenticates (email or social)
    3. Dynamic creates embedded wallet automatically
    4. Call `/api/auth/register` to create user in YOUR database
    5. Show "Enable Trading" button
  - **Completion Criteria:**
    - [ ] Auth flow works end-to-end
    - [ ] User created in database after Dynamic login
    - [ ] JWT stored and accessible
    - [ ] Wallet address displayed
    - [ ] "Enable Trading" button appears after registration
  - **Verification:** Complete login flow, check database for user record
  - **Files Modified:** Various component files

---

- [ ] **Task #22:** Wire up Polymarket authorization flow ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture diagram step 3
  - **Dependencies:** Task #10 (Polymarket component), Task #18 (registration endpoint)
  - **Integration Points:**
    1. User clicks "Enable Trading"
    2. Get wallet client from Dynamic
    3. Sign authorization message
    4. POST to `/api/polymarket/register` with signature
    5. Backend calls Polymarket CLOB API
    6. Backend stores encrypted credentials
    7. Show success message
  - **Completion Criteria:**
    - [ ] "Enable Trading" button triggers flow
    - [ ] Message signing works correctly
    - [ ] Signature sent to backend
    - [ ] Credentials stored in database (encrypted)
    - [ ] Success state displayed
    - [ ] Error handling for all steps
  - **Verification:** Complete flow, check `polymarket_credentials` table for encrypted data
  - **Files Modified:** `src/lib/components/PolymarketAuth.svelte`

---

- [ ] **Task #23:** Test complete authentication flow end-to-end ⏱️ 1h
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 6"
  - **Dependencies:** Task #21 (frontend wiring), Task #22 (Polymarket wiring)
  - **Test Scenarios:**
    1. **New User Email Authentication:**
       - Visit app
       - Click login
       - Enter email
       - Verify OTP
       - Check user created in database
       - Check embedded wallet created
       - Click "Enable Trading"
       - Sign message
       - Check credentials stored
    2. **New User Social Authentication:**
       - Login with Google
       - Same checks as above
    3. **Returning User:**
       - Login again
       - Check lastLoginAt updated
       - Check "Enable Trading" button hidden (already registered)
  - **Completion Criteria:**
    - [ ] Email authentication works end-to-end
    - [ ] Social authentication works end-to-end
    - [ ] User created in database
    - [ ] Embedded wallet auto-created
    - [ ] Polymarket credentials stored encrypted
    - [ ] Returning users handled correctly
    - [ ] All error states handled gracefully
  - **Verification:** Manual testing with real Dynamic account
  - **Blockers:** None

---

- [ ] **Task #24:** Add loading states and error handling ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Security Considerations #7"
  - **Dependencies:** Task #23 (E2E testing reveals edge cases)
  - **Components to Update:**
    - `AuthButton.svelte` - loading spinner during auth
    - `PolymarketAuth.svelte` - loading during signature
    - All API endpoints - consistent error responses
  - **Error Scenarios:**
    - JWT expired or invalid
    - User registration fails
    - Polymarket API unreachable
    - Signature verification fails
    - Encryption/decryption fails
  - **Completion Criteria:**
    - [ ] Loading spinners on all async operations
    - [ ] User-friendly error messages (no sensitive data)
    - [ ] Toast notifications for success/error
    - [ ] Retry logic for transient failures
    - [ ] Error boundaries in components
  - **Verification:** Test error scenarios, verify graceful degradation
  - **Files Modified:** Multiple component and endpoint files

---

- [ ] **Task #25:** Implement rate limiting for auth endpoints ⏱️ 30min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Security Considerations #5"
  - **Dependencies:** Task #16 (hooks.server.ts)
  - **Files:** `src/hooks.server.ts`
  - **Implementation:**
    - Add rate limiting to `/api/auth/register` (60 req/min per IP)
    - Add rate limiting to `/api/polymarket/register` (10 req/min per IP)
    - Use existing rate limiting infrastructure (already in project)
  - **Completion Criteria:**
    - [ ] Rate limits configured for auth endpoints
    - [ ] 429 status returned when exceeded
    - [ ] Headers include rate limit info
  - **Verification:** Make repeated requests, verify rate limiting kicks in
  - **Files Modified:** `src/hooks.server.ts`

---

### 🧪 Phase 5: Testing, Security & Deployment Prep

**Objective:** Ensure security, write tests, and prepare for production deployment.

---

- [ ] **Task #26:** Write unit tests for crypto utilities ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 6"
  - **Dependencies:** Task #19 (crypto utils created)
  - **Files:** `src/lib/server/utils/crypto.test.ts`
  - **Test Cases:**
    - Encrypt then decrypt returns original text
    - Different encryptions of same text produce different outputs (random IV)
    - Tampering with encrypted data throws on decrypt
    - Invalid auth tag throws on decrypt
    - Empty string encryption/decryption
    - Unicode characters handled correctly
  - **Completion Criteria:**
    - [ ] Test file created with Vitest
    - [ ] All test cases implemented
    - [ ] All tests passing
    - [ ] Code coverage > 90%
  - **Verification:** Run `npm test crypto.test.ts`
  - **Files Created:** `src/lib/server/utils/crypto.test.ts`

---

- [ ] **Task #27:** Write integration tests for auth endpoints ⏱️ 1h
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 6"
  - **Dependencies:** Task #17 (register endpoint), Task #18 (Polymarket endpoint)
  - **Files:** `src/routes/api/auth/register/+server.test.ts`, `src/routes/api/polymarket/register/+server.test.ts`
  - **Test Cases:**
    - `/api/auth/register`:
      - Returns 401 without JWT
      - Creates new user with valid JWT
      - Updates existing user lastLoginAt
    - `/api/polymarket/register`:
      - Returns 401 without JWT
      - Returns 400 if already registered
      - Successfully registers with Polymarket
      - Stores encrypted credentials
  - **Completion Criteria:**
    - [ ] Test files created
    - [ ] Mock JWT tokens generated for tests
    - [ ] Mock Polymarket API responses
    - [ ] All tests passing
  - **Files Created:** Test files for endpoints

---

- [ ] **Task #28:** Security audit and hardening ⏱️ 1h
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Security Considerations"
  - **Dependencies:** All previous tasks complete
  - **Checklist:**
    - [ ] All credentials encrypted at rest (verify in database)
    - [ ] JWT verification uses JWKS (not hardcoded keys)
    - [ ] CSP headers configured correctly
    - [ ] HTTPS enforced in production
    - [ ] No sensitive data in error messages
    - [ ] No sensitive data in logs
    - [ ] Environment variables not committed to git
    - [ ] Rate limiting active on all endpoints
    - [ ] SQL injection protected (Drizzle parameterized queries)
    - [ ] XSS protected (Svelte auto-escapes)
  - **Completion Criteria:**
    - [ ] All checklist items verified
    - [ ] Security review document created
    - [ ] No high/critical vulnerabilities found
  - **Verification:** Run `npm audit`, review code for security issues
  - **Files Created:** `SECURITY_REVIEW.md` (optional)

---

- [ ] **Task #29:** Prepare production configuration ⏱️ 45min
  - **Status:** ⏳ PENDING
  - **Addresses:** Architecture Section "Implementation Checklist Phase 7"
  - **Dependencies:** All previous tasks complete
  - **Production Checklist:**
    - [ ] Production environment variables documented
    - [ ] Database connection pooling configured
    - [ ] HTTPS certificate configured (or using Vercel/CloudFlare)
    - [ ] Error logging/monitoring set up (Sentry, LogRocket, etc.)
    - [ ] Production Dynamic environment created
    - [ ] Production encryption key generated (separate from dev)
    - [ ] CORS configured if needed
    - [ ] Rate limits adjusted for production load
  - **Completion Criteria:**
    - [ ] Production deployment guide created
    - [ ] All production config documented
    - [ ] Smoke test plan created
  - **Verification:** Follow deployment guide on staging environment
  - **Files Created:** `DEPLOYMENT_GUIDE.md` (optional)

---

## Change Log

### 2025-11-25 (Update 2)
- Removed Task #21 (Polymarket Trading Service) - not part of auth flow
- Updated task count: 30 → 29 tasks
- Renumbered all subsequent tasks (22→21, 23→22, etc.)
- Updated Phase 3 count: 8 → 7 tasks

### 2025-11-25 (Update 1)
- Added documentation verification summary
- Updated Task #1: Added `@dynamic-labs-sdk/evm` package
- Updated Task #5: Confirmed "Create on Sign up" toggle
- Updated Task #6: Added exact dashboard URLs and references
- Updated Task #7: Fixed CSP directive to include `'self'`
- Updated Task #10: Added correct import package for Viem wallet client
- Updated Task #16: Added correct JWKS endpoint URL format
- Added official Dynamic documentation links to all relevant tasks

### 2025-11-25 00:00
- Initial task breakdown created
- 29 tasks identified across 5 phases
- Task dependencies mapped
- Referenced AUTHENTICATION_ARCHITECTURE.md

<!-- Updates will be added here as tasks progress -->

---

## Notes & Discoveries

<!-- Add implementation notes, discoveries, and decisions made during development -->

### Important Considerations

1. **Polymarket Trading Service** has been removed from this task list - it's for future trading features, not required for authentication to work. Reference the Architecture doc for implementation details when needed.

2. **HTTPS Local Development (Task #12)** is critical - Dynamic embedded wallets require HTTPS even in development.

3. **Encryption Key (Task #4)** must be kept secure - losing this key means losing access to all stored Polymarket credentials.

4. **Phase Dependencies:**
   - Phase 2 (Frontend) can start after Phase 1 Tasks #1-6 complete
   - Phase 3 (Backend) can start after Phase 1 Tasks #3-4 complete
   - Phase 4 (Integration) requires Phases 2 & 3 complete
   - Phase 5 (Testing) requires Phase 4 complete

5. **Parallel Work Possible:**
   - Frontend tasks (Phase 2) and Backend tasks (Phase 3) can be worked on simultaneously after Phase 1 setup completes

---

## Quick Reference Links

- **Architecture Doc:** [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md)
- **Dynamic SDK Docs:** [.claude/dynamic-wallet-reference.md](./.claude/dynamic-wallet-reference.md)
- **Polymarket API:** [.claude/polymarket-api-reference.md](./.claude/polymarket-api-reference.md)
- **Code Style Guide:** [.claude/code-style.md](./.claude/code-style.md)
- **Brand Colors:** [.claude/brand-colors.md](./.claude/brand-colors.md)

---

## Status Icons Reference

- `[ ]` or `⏳` = Pending (not started)
- `[⚡]` or `🔄` = In Progress (currently working)
- `[x]` or `✅` = Completed (done)
- `[⚠️]` or `⛔` = Blocked (waiting on dependency)
- `[💡]` = Discovery (new task found during implementation)
- `[🔥]` = High Priority
- `[📌]` = Pinned (important reference)
- `[⏭️]` = Skipped (deferred to later)

---

## Next Steps

When ready to begin implementation:

1. Review this task document with the team
2. Start with Phase 1 Setup tasks (#1-7)
3. Use TodoWrite tool for in-session tracking
4. Update this document after completing each task
5. Update progress bars and timestamps
6. Add notes and discoveries as you go
