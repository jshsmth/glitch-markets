# Dynamic Wallet SDK Reference

**Purpose**: Comprehensive reference for Dynamic.xyz wallet integration with AI-optimized indexing and searchability.

**Last Updated**: 2025-11-24

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Methods](#authentication-methods)
3. [Wallet Management](#wallet-management)
4. [Embedded Wallets (MPC)](#embedded-wallets-mpc)
5. [Server Wallets](#server-wallets)
6. [SDK Reference](#sdk-reference)
7. [API Reference](#api-reference)

---

## Quick Start

### JavaScript SDK Overview
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/quickstart

**When to use**: Client-side integration, web applications, interactive wallet connections

**Key capabilities**:
- Install SDK: `npm install @dynamic-labs-sdk/client`
- Initialize with `DynamicContextProvider` wrapper component
- Test accounts available in Sandbox mode for quick testing
- Automatic UI rendering for authentication flows

**Search keywords**: `quickstart`, `getting started`, `initial setup`, `installation`, `SDK setup`

---

### Node SDK Overview
**URL**: https://www.dynamic.xyz/docs/node-sdk/quickstart

**When to use**: Server-side wallet operations, automated blockchain interactions, backend services

**Key capabilities**:
- Server-controlled non-custodial wallets via MPC
- Multi-chain support: Ethereum (EVM) and Solana (SVM)
- Multiple threshold schemes: 2-of-2, 2-of-3, 3-of-5
- Full TypeScript support

**Requirements**:
- Node.js 16+
- Environment variables: `DYNAMIC_AUTH_TOKEN`, `DYNAMIC_ENVIRONMENT_ID`
- Enable embedded wallets and networks in dashboard

**Search keywords**: `server-side`, `backend`, `MPC wallets`, `node.js`, `automated transactions`

---

## Authentication Methods

### Email Authentication
**URL**: https://www.dynamic.xyz/docs/authentication-methods/email

**When to use**: Password-less authentication, simple user onboarding, email-based access

**Setup**: Enable in dashboard → Log in & User Profile → Toggle "Email"

**Implementation options**:
- **React**: `useConnectWithOtp` hook → `connectWithEmail()`, `verifyOneTimePassword()`
- **React Native**: `dynamicClient.auth.email` → `sendOTP()`, `resendOTP()`, `verifyOTP()`
- **JavaScript**: Import `sendEmailOTP`, `verifyOTP` functions
- **Swift/Flutter**: Native SDK OTP methods

**Flow**:
1. User submits email
2. System sends OTP code
3. User enters code to verify

**Rate limiting**: 3 attempts per 10 minutes per email address

**Search keywords**: `email login`, `OTP`, `one-time password`, `passwordless`, `email auth`

---

### Social Authentication
**URL**: https://www.dynamic.xyz/docs/authentication-methods/social

**When to use**: Social login, OAuth providers, familiar authentication flows

**Supported providers**: Apple, Discord, Facebook, Farcaster, Github, Google, Telegram, Twitch, Twitter

**Setup**: Configure via dashboard → Social Providers → Toggle individual providers

**Implementation options**:
- **React**: `useSocialAccounts` hook → `signInWithSocialAccount()` (supports redirect vs popup)
- **React Native**: Requires deeplink URL configuration
- **JavaScript**: `authenticateWithSocial()` → redirect → `completeSocialAuthentication()`
- **Swift/Flutter**: Native implementations with provider enums

**Key feature**: Social provider email data auto-populates user object and enables email authentication

**Search keywords**: `social login`, `OAuth`, `Google login`, `Twitter auth`, `third-party auth`

---

### Passkey Authentication
**URL**: https://www.dynamic.xyz/docs/authentication-methods/passkey

**When to use**: WebAuthn-based authentication, biometric login, hardware security keys

**Prerequisites**: User must have signed in via another method first and registered a passkey

**Setup**: Enable in dashboard → Log in & User Profile → Toggle "Passkey"

**Implementation**:
- **React**:
  ```tsx
  const signInWithPasskey = useSignInWithPasskey();
  <button onClick={() => signInWithPasskey()}>Sign in</button>
  ```
- **JavaScript**: Import `signInWithPasskey()` function
- **React Native**: Supports primary sign-in, registration, MFA, cross-origin

**Security**: Uses WebAuthn cryptographic protocols, eliminates password vulnerabilities

**Search keywords**: `passkey`, `WebAuthn`, `biometric`, `hardware key`, `FIDO2`, `passwordless`

---

### Branded Wallets
**URL**: https://www.dynamic.xyz/docs/authentication-methods/branded-wallets

**When to use**: Crypto wallet connections, MetaMask/Phantom integration, blockchain-native auth

**Supported chains**: Ethereum, all EVM chains, Solana, Eclipse, Flow, Bitcoin, Algorand, Starknet, Cosmos Hub, Axelar, Noble, Osmosis, Sei, Sui

**Key features**:
- Multi-wallet support per account
- Wallet switching without re-authentication
- Smart labels: "Last Used", "Multichain", "Recommended"

**Setup steps**:
1. Enable chains and connectors via chains configuration
2. Configure RPC endpoints (default or custom)
3. Activate in dashboard → Log in & User Profile → Branded Wallets

**Customization**:
- Hide network switching UI
- WalletConnect configuration
- Wallet sorting/filtering
- Authentication modes: connect-and-sign vs connected-only

**Implementation**:
- **React**: `useWalletOptions` → fetch wallets, `WalletIcon` component, `selectWalletOption()`
- **JavaScript**: `connectAndVerifyWithWalletProvider()`

**Search keywords**: `MetaMask`, `Phantom`, `wallet connect`, `crypto wallet`, `blockchain auth`, `WalletConnect`

---

### Server-Side Verification
**URL**: https://www.dynamic.xyz/docs/authentication-methods/how-to-validate-users-on-the-backend

**When to use**: Backend authentication, API security, JWT validation, user verification

**JWT Details**:
- Signed with RS256 algorithm
- Unique private key per environment
- Verify with public key from JWKS endpoint

**Three implementation approaches**:

1. **NextAuth Integration**: Streamlined server-side verification for Next.js
2. **Passport.js**: Use `passport-dynamic` extension
3. **DIY Verification**:
   - Extract token: `getAuthToken()` (React), `auth.token` (React Native/Flutter), `user?.token` (Swift)
   - Send as Bearer token in headers
   - Install `node-jsonwebtoken` and `jwks-rsa`
   - Fetch public key from JWKS endpoint
   - Verify token signature

**Security best practices**:
- Verify signatures before trusting claims
- Check `requiresAdditionalAuth` scope for MFA
- Validate expiration: `ignoreExpiration: false`
- Cache public keys (10-minute TTL recommended)

**Search keywords**: `JWT`, `server validation`, `backend auth`, `token verification`, `JWKS`, `RS256`

---

## Wallet Management

### Available Wallets
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-available-wallets-to-connect

**Function**: `getAvailableWalletProvidersData()`

**Key concept**: Each chain + wallet = separate entity (e.g., MetaMask on EVM = `metamaskevm`, MetaMask on Solana = `metamasksol`)

**Useful fields**:
- `groupKey`: Group by wallet application
- `chain`: Filter by blockchain
- `metadata.displayName`: Human-readable name
- `key`: Identifier for connection

**Search keywords**: `list wallets`, `available connectors`, `wallet providers`, `supported wallets`

---

### Connect and Verify Wallets
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/connect-and-verify-wallet

**Three connection methods**:

1. **Connect and Verify Together**: Wallet only added after verification, linked to Dynamic user
2. **Connect Without Verification**: Immediate add to accounts list, temporary (local session only)
3. **Verify Previously Connected**: Verify unverified wallet, gains `verifiedCredentialId` and server persistence

**Key difference**: Verification determines Dynamic user association and server persistence

**Error handling**: Try-catch blocks for connection/verification failures

**Search keywords**: `connect wallet`, `verify wallet`, `wallet connection flow`, `MetaMask connect`

---

### Get Wallet Accounts
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-wallet-accounts

**Function**: `getWalletAccounts()`

**Returns**: Array of all connected wallet accounts

**Key concept**: Multiple accounts if same wallet connected to different chains (e.g., MetaMask on EVM + SOL = 2 accounts)

**Use cases**:
- Display connected accounts
- Retrieve balances
- Manage multi-network connections

**Search keywords**: `connected wallets`, `wallet list`, `active accounts`, `wallet accounts`

---

### Network Switching
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/switch-active-network

**Function**: `switchActiveNetwork()`

**When to use**: Change blockchain networks, multi-chain applications, network-specific operations

**Search keywords**: `switch network`, `change chain`, `network selection`, `multi-chain`

---

### Get Balance
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-balance

**Function**: `getBalance()`

**When to use**: Display wallet balance, check funds before transactions

**Search keywords**: `wallet balance`, `check balance`, `account funds`

---

### Sign Message
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/sign-message

**Function**: `signMessage()`

**When to use**: Message signing, authentication proofs, signature verification

**Search keywords**: `sign message`, `signature`, `message signing`, `wallet signature`

---

### Remove Wallet Account
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/remove-wallet-account

**Function**: `removeWalletAccount()`

**When to use**: Disconnect wallet, remove account, logout

**Search keywords**: `disconnect wallet`, `remove account`, `wallet logout`

---

## Embedded Wallets (MPC)

### Setup Overview
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/setup

**When to use**: User-controlled MPC wallets, embedded wallet infrastructure, non-custodial solutions

**Prerequisites**:
- Dynamic Dashboard → Developer → Enable Embedded Wallets
- Select supported blockchain networks

**SDK Requirements**:
- React SDK v4.20.0+ with chain-specific connectors
- Only install connectors for needed chains

**Security - CSP Configuration**:
- Whitelist `https://app.dynamicauth.com` in `frame-src` directive
- Configure via HTTP headers, meta tags, NGINX, or Vercel

**Implementation**:
1. Configure provider with wallet connectors (Ethereum, Solana, Sui)
2. Users auto-receive wallets upon authentication
3. Access via standard client methods
4. Advanced features via WaaS connector interface

**Platform support**: React, React Native (Swift/Flutter forthcoming)

**Search keywords**: `embedded wallet setup`, `MPC configuration`, `wallet infrastructure`, `CSP config`

---

### Creating Wallets
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/creating-wallets

**Automatic creation**:
- Enable "Create on Sign up" in dashboard
- Creates one wallet per enabled chain
- Optional: "Embedded Wallet for Third-Party Wallets" for users with MetaMask etc.

**Manual creation**:
- **React**:
  ```javascript
  const { createWalletAccount } = useDynamicWaas();
  await createWalletAccount([ChainEnum.Evm, ChainEnum.Sol]);
  ```
- **React Native**: `await dynamicClient.wallets.embedded.createWallet({ chain: 'Evm' })`
- **Swift/Flutter**: `createWalletAccount()`, `createWallet()`

**Check status**: Use `useDynamicWaas()` to verify existing wallets before creating

**SDK version**: 4.20.6 or later required

**Search keywords**: `create wallet`, `wallet creation`, `new wallet`, `initialize wallet`, `automatic wallet`

---

### Pre-generating Wallets
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/create-pregen-wallet

**When to use**: Create wallets before authentication, mass wallet creation, server-side preparation

**Use cases**:
- Establish wallets for prospective users
- Bulk wallet generation
- Link wallets to identifiers (email)
- Server-side processes

**Implementation**:
1. Get credentials: Environment ID + API key from dashboard
2. POST to wallet creation endpoint
3. Provide identifier (email), type, desired chains

**Response**: Wallet address, chain details, wallet ID, timestamp

**Key feature**: User auto-claims wallet on login with matching identifier

**Search keywords**: `pre-generate wallet`, `server wallet creation`, `bulk wallets`, `prepare wallets`

---

### Global Identity
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/global-identity

**When to use**: Personalized subdomains, ENS-like identities, user identifiers

**Feature**: Users claim subdomains tied to embedded wallets (format: `custom.domain.eth`)

**Setup**:
1. Dashboard → Embedded Wallets → Toggle "Personalized Subdomains"
2. Configure ENS domain (pre-populated or manual)
3. Verify ownership via Namestone (sign message)
4. Save settings

**Optional**: "Require Subdomains" toggle prompts users during signup

**User control**: View/modify subdomain in Profile section of DynamicWidget

**Search keywords**: `ENS subdomain`, `personalized identity`, `global identity`, `user subdomain`

---

### Transactions with Embedded Wallets
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/transactions

**Key concept**: MPC signing between user's key share + Dynamic's key share

**Custom UI implementation**:
- **EVM chains**: Sign messages, typed data, execute transactions, Wagmi integration, query balances
- **Solana**: Legacy transactions, versioned transactions

**Dynamic's UI**:
- Default transaction confirmation screen
- Customization: Toggle on/off, customize titles, enable simulation

**Transaction simulation**:
- Previews asset transfers before confirmation
- Example: SOL→USDC swap shows outgoing + incoming assets

**Search keywords**: `send transaction`, `sign transaction`, `embedded wallet transaction`, `MPC signing`

---

### Delegated Access - Triggering
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/triggering-delegation

**What it is**: Grant application permission to access user's embedded wallet

**Triggering methods**:
1. **Automatic**: Configured during setup, prompt on sign-in
2. **Manual (React)**: `useWalletDelegation` hook → check status, trigger UI
3. **Manual (JavaScript)**: `hasDelegatedAccess()` → `delegateWaasKeyShares()`
4. **User-initiated**: Widget → Settings → Security → Connected Apps → Wallets Delegated

**Verification**: Check `hasDelegatedAccess()` before operations

**Search keywords**: `delegate access`, `grant permission`, `wallet delegation`, `authorize app`

---

### Delegated Access - Receiving
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/receiving-delegation

**Webhook**: `wallet.delegation.created` event delivers encrypted materials

**Process**:
1. **Verify webhook signature** (ensure authenticity)
2. **Decrypt materials**: RSA-OAEP + AES-256-GCM hybrid encryption
3. **Store securely**: userId, walletId, decrypted secrets (use envelope encryption/KMS)

**Encryption structure**:
- `alg`: Algorithm specification
- `iv`: Initialization vector
- `ct`: Ciphertext
- `tag`: GCM authentication tag
- `ek`: Encrypted content-encryption key

**Decryption steps**:
1. RSA-OAEP decrypt the encrypted key (SHA-256 hash)
2. AES-GCM decrypt delegated materials

**Reliability**: Replay failed events from dashboard using `eventId` as idempotency key

**Search keywords**: `webhook delegation`, `decrypt delegation`, `receive delegation`, `delegation webhook`

---

### Delegated Access - Developer Actions
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/developer-actions

**What it enables**: Server-side wallet operations on behalf of users

**Available operations**:
- Message signing across blockchains
- Transaction execution
- Gas sponsorship (EVM)

**Security boundaries**:
- Actions scoped to specific wallet
- Requires `walletApiKey` + `keyShare`
- Server-side execution only
- User-revocable access

**Implementation**:
- **EVM**: `createDelegatedEvmWalletClient` → `delegatedSignMessage(walletId, apiKey, keyShare, message)`
- **SVM**: `createDelegatedSvmWalletClient` → similar pattern for Solana

**Search keywords**: `server-side signing`, `delegated operations`, `automated transactions`, `server wallet actions`

---

### Delegated Access - Revoking
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/delegated-access/revoking-delegation

**What it does**: Removes delegated server access, prevents further operations

**Who can revoke**: Users control revocation (individual wallets or all at once)

**Process**:
1. User initiates revocation
2. Dynamic performs reshare ceremony
3. Developer's external share becomes invalid
4. Operations immediately blocked

**Implementation**:
- **React**: `useWalletDelegation` → `revokeDelegation([wallets])`
- **JavaScript**: `revokeWaasDelegation()` for specific wallet, `hasDelegatedAccess()` to check

**Server requirements** (on `wallet.delegation.revoked` webhook):
- Invalidate cached materials
- Stop delegated jobs/agents
- Remove/rotate stored shares and keys
- Handle idempotently using event ID

**Search keywords**: `revoke delegation`, `remove access`, `cancel delegation`, `delegation revocation`

---

### Raw Signing
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/raw-signing

**When to use**: Custom protocols, non-standard data structures, specific encoding requirements, full hash control

**When NOT to use**: Standard message signing, well-established patterns (use standard methods instead)

**Supported formats**:
- **Hexadecimal**: Most common for blockchain (encoded as hex string)
- **UTF-8 Text**: Plain text without hex conversion

**Hash functions**:
- **Keccak256**: Standard for Ethereum/EVM chains
- **SHA256**: General-purpose cryptographic alternative

**Implementation**:
1. Instantiate `DynamicWaasEVMConnector` from wallet
2. Process message (encoding + hash function)
3. Call `signRawMessage(accountAddress, hashedMessage)`

**Platform support**: EVM chains only

**Search keywords**: `raw signing`, `custom signing`, `arbitrary data signing`, `message encoding`

---

### Sign Typed Data (EIP-712)
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/sign-typed-data

**What it is**: Signing structured, human-readable data per EIP-712 standard

**Use cases**:
- Permit transactions (gasless token approvals)
- Meta-transactions (abstracted gas payment)
- Complex multi-field authorization

**Required structure**:
1. **Domain**: App context (name, version, chainId, verifyingContract)
2. **Types**: Field definitions (including nested types)
3. **Message**: Actual data matching types
4. **Primary Type**: Which type definition message conforms to

**Implementation**:
```javascript
const walletClient = await getWalletClient();
const signature = await walletClient.signTypedData({
  domain, types, message, primaryType
});
```

**Search keywords**: `EIP-712`, `typed data`, `permit`, `meta-transaction`, `structured signing`

---

### How MPC Shares Work
**URL**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/how-shares-work

**Security model**: Threshold signature schemes, distributed cryptography, no complete private key

**Three phases**:

1. **Authentication**: User credentials → Dynamic verifies → retrieves encrypted server share
2. **Signing**: User + server shares collaborate via zero-knowledge proofs (no party learns other's share, complete key never reconstructed)
3. **Communication**: Encrypted channels via MPC relay (manages ceremony without storing data)

**Key advantages**:
- No single point of private key exposure
- Isolated, stateless signing operations
- Zero-knowledge proof security

**Important**: Users don't acquire shares, they authenticate with existing share + JWT

**Search keywords**: `MPC security`, `threshold signatures`, `key shares`, `zero-knowledge`, `distributed keys`

---

## Server Wallets

### Server Wallets Overview
**URL**: https://www.dynamic.xyz/docs/wallets/server-wallets/overview

**What they are**: Backend-controlled cryptocurrency wallets via MPC for automated operations

**Key differences from embedded wallets**:
- Backend operation vs user-facing
- No user authentication required
- Programmatic automation focus

**Use cases**:
- Automated transaction execution
- Contract interactions without user involvement
- Complex workflow orchestration
- Scalable enterprise wallet infrastructure

**Security model**: Threshold schemes (2-of-2, 2-of-3, 3-of-5), distributed key shares, optional backup to Dynamic

**Setup steps**:
1. Enable multiple embedded wallets per chain in dashboard
2. Generate API token
3. Install Node SDKs (EVM/SVM)
4. Create authenticated clients
5. Generate wallet accounts with threshold scheme
6. Use address for signing/transactions

**Search keywords**: `server wallets`, `automated wallets`, `backend wallets`, `programmatic transactions`

---

### Viem Wallet Client (Server Wallets)
**URL**: https://www.dynamic.xyz/docs/wallets/server-wallets/viem-wallet-client

**When to use**: EVM operations with server wallets, Viem integration, transaction automation

**Setup**:
```typescript
const evmClient = new DynamicEvmWalletClient({
  environmentId: 'your-id'
});
await evmClient.authenticateApiToken('your-token');

const walletClient = await evmClient.getWalletClient({
  accountAddress: '0x...',
  chainId: 11155111,
  rpcUrl: 'https://...'
});
```

**Configuration options**:
- Pass Viem chain object OR chainId + rpcUrl
- `password` for password-protected wallets
- `externalServerKeyShares` for externally-stored wallets

**Available operations**:
- Message signing: `walletClient.signMessage({ message })`
- Typed data: `walletClient.signTypedData({ domain, types, message })`
- Transactions: `walletClient.sendTransaction({ to, value })`

**Default**: Ethereum mainnet if no chain specified

**Search keywords**: `Viem server`, `server wallet client`, `EVM automation`, `Viem integration`

---

### Gas Sponsorship (EVM)
**URL**: https://www.dynamic.xyz/docs/wallets/server-wallets/gas-sponsorship

**What it is**: Server covers transaction fees using ZeroDev paymaster/bundler

**Setup requirements**:
1. ZeroDev project IDs + gas policies per network
2. Dashboard → "Sponsor Gas" → Add ZeroDev project IDs
3. Environment variables for credentials

**Note**: No extra server config beyond ZeroDev enablement and project IDs

**Implementation**:

**Node EVM (Server Wallets)**:
```javascript
// Create authenticated EVM client
// Create ZeroDev client with withSponsorship: true
// Send transaction via kernel client
```

**Delegated Access**:
```javascript
// Create delegated EVM client with wallet credentials
// Create kernel client with delegated params
// Send transaction
```

**Fallback**: If policy denies, retry with `withSponsorship: false`

**Search keywords**: `gas sponsorship EVM`, `gasless transactions`, `ZeroDev`, `paymaster`, `sponsored gas`

---

### Gas Sponsorship (Solana)
**URL**: https://www.dynamic.xyz/docs/wallets/server-wallets/gas-sponsorship-svm

**What it is**: Server pays SOL gas fees while user's delegated wallet signs instructions

**Requirements**:
- Funded Solana wallet (fee payer)
- Server API credentials
- `@dynamic-labs-wallet/node-svm` package
- Webhook infrastructure for delegation

**Key differences from EVM**:
- **Multi-signature approach**: Dual signatures required (delegated user signs instructions, fee payer signs complete transaction)
- **Credential management**: User delegation via webhooks, decrypt key shares
- **No account abstraction**: Explicit dual-signature model vs EVM contract-based delegation

**Implementation flow**:
1. Initialize delegated client with environment ID + API key
2. Decrypt delegation credentials (wallet ID, API key, key share)
3. Build transaction instructions
4. Set fee payer wallet
5. Use delegated signing for user signature
6. Add fee payer signature via `nacl.sign.detached()`
7. Verify both signatures before broadcast

**Search keywords**: `gas sponsorship Solana`, `SVM gasless`, `Solana fee payer`, `dual signature`

---

## SDK Reference

### Create Dynamic Client
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/client/create-dynamic-client

**Purpose**: Foundational setup for JavaScript SDK (required before all other methods)

**Installation**: `npm install @dynamic-labs-sdk/client`

**Configuration**:
```javascript
import { createDynamicClient } from '@dynamic-labs-sdk/client';

const dynamicClient = createDynamicClient({
  environmentId: 'YOUR_ENVIRONMENT_ID',
  metadata: {
    name: 'YOUR_APP_NAME',
    url: 'YOUR_APP_URL',
    iconUrl: 'YOUR_APP_ICON_URL',
  },
});
```

**Parameters**:
- `environmentId`: From Dynamic dashboard → Developer → API
- `metadata.name`: Application display name
- `metadata.url`: Application web address
- `metadata.iconUrl`: Logo URL

**Search keywords**: `create client`, `SDK initialization`, `Dynamic client`, `setup client`

---

### Initialize Dynamic Client
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/client/initialize-dynamic-client

**Modes**:
- **Automatic** (default): Initializes on creation
- **Manual**: Set `autoInitialize: false`, call `initializeClient()` manually

**When to use manual**: Delay setup for user auth, config loading, or component coordination

**Lifecycle states**:
1. Uninitialized
2. In-progress
3. Finished
4. Failed

**Monitoring**: Listen to `initStatusChanged` event for state transitions

**Best practices**:
- Monitor events for UI updates
- Handle "failed" state gracefully
- Use automatic for simplicity, manual for precise control

**Search keywords**: `initialize client`, `client lifecycle`, `initialization states`, `autoInitialize`

---

### User and Session Management
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/auth/user-and-session-management

**Authentication state**:
- `isSignedIn()`: Returns true if authenticated Dynamic user OR connected wallet exists

**Session tokens**:
- JWT access: `dynamicClient.token` (for non-cookie auth)

**User data**:
- User object: `dynamicClient.user`
- Incomplete onboarding: `user.missingFields` (array of required/optional fields)
- Refresh data: `refreshUser()` (fetches latest from server)

**User updates**:
- `updateUser()`: Modify user information
- Sensitive fields (email/phone): Returns `OTPVerification` object
- Verification: `sendEmailOTP()` → `verifyOTP()`

**Logout**:
- `logout()`: Clears session data, user object, connected wallets

**Search keywords**: `user session`, `authentication state`, `user data`, `logout`, `JWT token`

---

### EVM - Add Extensions
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/evm/adding-evm-extensions

**When to use**: Enable EVM-specific functionality, Ethereum integration

**Search keywords**: `EVM extensions`, `Ethereum extensions`, `add EVM support`

---

### EVM - Get Viem Wallet Client
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/evm/getting-viem-wallet-client

**Purpose**: Create Viem WalletClient for embedded wallets

**Setup**: `import { createWalletClientForWalletAccount } from '@dynamic-labs-sdk/evm/viem'`

**Usage**:
```javascript
const walletClient = await createWalletClientForWalletAccount({
  walletAccount,
});
```

**Operations**: Retrieve accounts, execute transactions, sign messages

**Example**:
```javascript
const result = await walletClient.sendTransaction(transaction);
```

**Search keywords**: `Viem client`, `embedded wallet client`, `EVM wallet operations`, `Viem integration`

---

### EVM - Get Viem Public Client
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/evm/getting-viem-public-client

**When to use**: Read-only blockchain operations, query data without wallet

**Search keywords**: `Viem public client`, `read-only client`, `query blockchain`, `public operations`

---

### WaaS - Check if Enabled
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/waas/checking-if-waas-is-enabled

**When to use**: Verify embedded wallet feature availability

**Search keywords**: `WaaS enabled`, `check embedded wallets`, `verify WaaS`

---

### WaaS - Check Account Type
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/waas/checking-waas-wallet-account-type

**When to use**: Determine if wallet is embedded vs external

**Search keywords**: `wallet type`, `account type`, `embedded vs external`, `WaaS account`

---

### WaaS - Create Wallet Accounts
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/waas/creating-waas-wallet-accounts

**Function**: `createWalletAccount()`

**When to use**: Programmatic wallet creation, custom creation logic

**See also**: Creating Wallets section above

**Search keywords**: `create WaaS wallet`, `programmatic wallet creation`

---

### WaaS - Export Private Key
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/waas/exporting-waas-private-key

**When to use**: Export embedded wallet private key, wallet migration, backup

**Security warning**: Exporting private keys increases security risk

**Search keywords**: `export private key`, `wallet export`, `key backup`, `WaaS export`

---

## API Reference

### API Overview
**URL**: https://www.dynamic.xyz/docs/api-reference/overview

**Purpose**: Secure dashboard data access, programmatic settings management

**Authentication methods**:

**Admin (Non-SDK)**:
- Generate API tokens via Developer Dashboard
- Format: `dyn_` prefix + 56 alphanumeric characters
- Header: `Authorization: Bearer <token>`

**User (SDK)**:
- Use JWTs from `getAuthToken()`
- Header: `Authorization: Bearer <jwt>`

**HTTP error codes**:
- **400**: Request format issues
- **401**: Missing credentials
- **403**: Insufficient permissions
- **404**: Resource not found

**Security considerations**:
- Tokens shown once only (cannot recover lost tokens)
- Scoped access permissions
- Rate limiting applies
- Proper request formatting required

**Search keywords**: `API authentication`, `API tokens`, `REST API`, `Dynamic API`, `admin API`

---

## Additional SDK Methods

### Get Connected Addresses
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-connected-addresses

**Function**: `getConnectedAddresses()`

**When to use**: List all connected wallet addresses

**Search keywords**: `connected addresses`, `wallet addresses`, `list addresses`

---

### Get Wallet Account from Address
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-wallet-account-from-address

**Function**: `getWalletAccountFromAddress(address)`

**When to use**: Retrieve specific wallet account by address

**Search keywords**: `find wallet`, `get wallet by address`, `wallet lookup`

---

### Get Networks Data
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-networks-data

**Function**: `getNetworksData()`

**When to use**: List available networks, network information

**Search keywords**: `available networks`, `network list`, `supported chains`

---

### Get Active Network
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-active-network

**Function**: `getActiveNetwork()`

**When to use**: Determine current active blockchain network

**Search keywords**: `active network`, `current chain`, `selected network`

---

### Get Multichain Balances
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/get-multichain-balances

**Function**: `getMultichainBalances()`

**When to use**: Retrieve balances across multiple chains

**Search keywords**: `multichain balance`, `cross-chain balance`, `total balance`

---

### Check Wallet Account Availability
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/check-wallet-account-availability

**Function**: `checkWalletAccountAvailability()`

**When to use**: Verify if wallet can be connected

**Search keywords**: `wallet availability`, `check wallet`, `wallet status`

---

### Wallet Provider Events
**URL**: https://www.dynamic.xyz/docs/javascript-sdk/wallets/wallet-provider-events

**When to use**: Listen to wallet events, react to connection changes, monitor account switches

**Search keywords**: `wallet events`, `provider events`, `wallet listeners`, `connection events`

---

## UI Customization

### Customizing UI
**URL**: https://www.dynamic.xyz/docs/using-our-ui/design-customizations/customizing-ui

**Three customization approaches**:

1. **Views**: Control signup/login options shown
2. **Translations**: Override text via translation keys (every text has corresponding key)
3. **CSS Design**:
   - **Themes**: Pre-built style overrides
   - **CSS Variables**: Target individual component styles
   - **Custom CSS**: Complete style replacement

**Depth levels**: Simple text adjustments → Complete visual redesigns

**Recommendation**: Explore all three CSS methods via Design Tutorial

**Search keywords**: `UI customization`, `theming`, `custom design`, `branding`, `CSS variables`, `translations`

---

## Implementation Checklist

### For Client-Side Integration
- [ ] Install JavaScript SDK: `@dynamic-labs-sdk/client`
- [ ] Get environment ID from dashboard
- [ ] Create Dynamic client with metadata
- [ ] Wrap app with `DynamicContextProvider` (React)
- [ ] Enable authentication methods in dashboard
- [ ] Configure chains and wallet connectors
- [ ] Implement authentication UI or use Dynamic's
- [ ] Handle wallet connection/verification
- [ ] Access user data and session tokens

### For Server-Side Integration
- [ ] Install Node SDK: `@dynamic-labs-wallet/node-evm` or `node-svm`
- [ ] Generate API token from dashboard
- [ ] Set environment variables: `DYNAMIC_AUTH_TOKEN`, `DYNAMIC_ENVIRONMENT_ID`
- [ ] Enable embedded wallets in dashboard
- [ ] Configure supported networks
- [ ] Implement JWT verification for API security
- [ ] Set up webhook handlers for delegation events
- [ ] Securely store decrypted key shares
- [ ] Implement server wallet operations

### For Embedded Wallets
- [ ] Enable embedded wallets in dashboard
- [ ] Configure CSP to whitelist `https://app.dynamicauth.com`
- [ ] Install chain-specific connectors
- [ ] Choose automatic vs manual wallet creation
- [ ] Set up delegation flow (if needed)
- [ ] Implement transaction confirmation UI
- [ ] Configure transaction simulation (optional)
- [ ] Test MPC signing operations

### For Gas Sponsorship
- [ ] Set up ZeroDev account (EVM) or funded fee payer (Solana)
- [ ] Configure project IDs in Dynamic dashboard
- [ ] Implement delegation webhooks (if using delegated access)
- [ ] Create kernel clients with sponsorship enabled
- [ ] Handle sponsorship policy rejections
- [ ] Test sponsored transactions

---

## Common Patterns

### Pattern: Email + Embedded Wallet
**Use case**: Simple onboarding with non-custodial wallet

1. Enable email auth in dashboard
2. Enable embedded wallets with "Create on Sign up"
3. User enters email → receives OTP
4. User verifies OTP → account created
5. Embedded wallet automatically created
6. User can transact immediately

**Search keywords**: `email onboarding`, `simple signup`, `embedded wallet signup`

---

### Pattern: Social + Branded Wallet + Embedded Wallet
**Use case**: Flexible authentication with wallet options

1. Enable social providers + branded wallets + embedded wallets
2. User chooses: Social login OR Wallet connection
3. If social: Account created, embedded wallet generated
4. If wallet: MetaMask/Phantom connected, optional embedded wallet
5. User can add additional authentication methods
6. Multi-wallet support enabled

**Search keywords**: `flexible auth`, `multi-wallet`, `social + wallet`

---

### Pattern: Passkey + Embedded Wallet
**Use case**: Biometric authentication with seamless transactions

1. User signs in via email/social first
2. Register passkey during onboarding
3. Future logins: Biometric authentication only
4. Embedded wallet available immediately
5. No passwords, high security

**Search keywords**: `biometric onboarding`, `passkey wallet`, `WebAuthn wallet`

---

### Pattern: Server Wallet Automation
**Use case**: Backend transaction processing, automated operations

1. Generate server wallet with Node SDK
2. Fund wallet with gas tokens
3. Monitor events/conditions
4. Execute transactions programmatically
5. No user interaction required

**Search keywords**: `automated transactions`, `server automation`, `backend wallet operations`

---

### Pattern: Delegated Access with Gas Sponsorship
**Use case**: User wallet control with app-sponsored transactions

1. User authenticates, embedded wallet created
2. User grants delegation to your app
3. Receive webhook with encrypted credentials
4. Decrypt and store securely
5. Execute transactions on user's behalf
6. Sponsor gas fees via ZeroDev (EVM) or fee payer (Solana)
7. User maintains control, can revoke anytime

**Search keywords**: `delegated sponsorship`, `gasless user transactions`, `sponsored delegation`

---

## Troubleshooting Index

### Authentication Issues
- **Token validation fails**: Check JWKS endpoint, verify RS256 signature, check expiration
- **Email OTP not received**: Check rate limits (3 per 10 min), verify email configuration
- **Social auth redirect fails**: Verify deeplink configuration (React Native), check callback URLs
- **Passkey registration fails**: Ensure prior authentication via another method

### Wallet Issues
- **Wallet not appearing**: Verify chain enabled in dashboard, check connector installation
- **Connection fails**: Check RPC endpoint, verify network configuration
- **Multiple accounts unexpected**: Remember each chain creates separate account
- **Balance not updating**: Call `refreshUser()` or re-fetch wallet data

### Embedded Wallet Issues
- **CSP errors**: Whitelist `https://app.dynamicauth.com` in frame-src
- **Wallet creation fails**: Check SDK version (4.20.6+), verify enabled networks
- **MPC signing timeout**: Check network connectivity, verify key shares not corrupted
- **Transaction fails**: Verify gas funds, check network status, validate transaction data

### Delegation Issues
- **Delegation webhook not received**: Check webhook configuration, verify endpoint reachability
- **Decryption fails**: Verify private key matches public key, check encryption format
- **Delegated operations fail**: Verify credentials not revoked, check stored key shares valid
- **Revocation not working**: Verify webhook handler invalidates credentials

### Gas Sponsorship Issues
- **EVM sponsorship fails**: Check ZeroDev project ID, verify gas policy, confirm bundler status
- **Solana sponsorship fails**: Verify fee payer funded, check dual signatures applied
- **Policy rejection**: Review ZeroDev policies, implement fallback without sponsorship

---

## Quick Command Reference

### JavaScript SDK Functions

```javascript
// Client
import { createDynamicClient } from '@dynamic-labs-sdk/client';
const dynamicClient = createDynamicClient({ environmentId, metadata });
await dynamicClient.initializeClient();

// Authentication
const isSignedIn = dynamicClient.isSignedIn();
const token = dynamicClient.token;
const user = dynamicClient.user;
await dynamicClient.logout();

// Email Auth
import { sendEmailOTP, verifyOTP } from '@dynamic-labs-sdk/client';
await sendEmailOTP(email);
await verifyOTP(email, code);

// Passkey
import { signInWithPasskey } from '@dynamic-labs-sdk/client';
await signInWithPasskey();

// Wallets
import {
  getAvailableWalletProvidersData,
  connectAndVerifyWithWalletProvider,
  getWalletAccounts,
  getBalance,
  signMessage
} from '@dynamic-labs-sdk/client';

const wallets = getAvailableWalletProvidersData();
await connectAndVerifyWithWalletProvider(walletKey);
const accounts = getWalletAccounts();
const balance = await getBalance(address);
const signature = await signMessage(message);

// Embedded Wallets
import { useDynamicWaas } from '@dynamic-labs-sdk/sdk-react-core';
const { createWalletAccount } = useDynamicWaas();
await createWalletAccount([ChainEnum.Evm]);

// Delegation
import { useWalletDelegation } from '@dynamic-labs-sdk/sdk-react-core';
const { hasDelegatedAccess, revokeDelegation } = useWalletDelegation();

// Viem
import { createWalletClientForWalletAccount } from '@dynamic-labs-sdk/evm/viem';
const walletClient = await createWalletClientForWalletAccount({ walletAccount });
await walletClient.sendTransaction({ to, value });
```

### Node SDK Functions

```javascript
// EVM Server Wallets
import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';
const evmClient = new DynamicEvmWalletClient({ environmentId });
await evmClient.authenticateApiToken(token);
const walletClient = await evmClient.getWalletClient({ accountAddress, chainId, rpcUrl });

// SVM Server Wallets
import { DynamicSvmWalletClient } from '@dynamic-labs-wallet/node-svm';
const svmClient = new DynamicSvmWalletClient({ environmentId });
await svmClient.authenticateApiToken(token);

// Delegated Access
import { createDelegatedEvmWalletClient } from '@dynamic-labs-wallet/node-evm';
const delegatedClient = createDelegatedEvmWalletClient({ environmentId });
await delegatedClient.delegatedSignMessage({ walletId, walletApiKey, keyShare, message });
```

---

## Index: Search by Use Case

**I want to...**

- **Add email login**: See Email Authentication
- **Add social login**: See Social Authentication
- **Add passkey/biometric login**: See Passkey Authentication
- **Connect MetaMask/Phantom**: See Branded Wallets
- **Create embedded wallets automatically**: See Creating Wallets → Automatic creation
- **Create wallets programmatically**: See Creating Wallets → Manual creation
- **Create wallets before user signup**: See Pre-generating Wallets
- **Let users control wallets while I automate**: See Delegated Access sections
- **Sponsor transaction fees for users**: See Gas Sponsorship (EVM/Solana)
- **Automate transactions without users**: See Server Wallets
- **Verify users on my backend**: See Server-Side Verification
- **Sign arbitrary data**: See Raw Signing
- **Sign structured data (EIP-712)**: See Sign Typed Data
- **Customize the UI**: See UI Customization
- **Get wallet balances**: See Get Balance, Get Multichain Balances
- **Switch networks**: See Network Switching
- **List connected wallets**: See Get Wallet Accounts
- **Remove a wallet**: See Remove Wallet Account
- **Use Viem with embedded wallets**: See EVM - Get Viem Wallet Client
- **Use Viem with server wallets**: See Viem Wallet Client (Server Wallets)
- **Understand MPC security**: See How MPC Shares Work

---

## Additional Resources

### Official Documentation
- Main docs: https://www.dynamic.xyz/docs
- API reference: https://www.dynamic.xyz/docs/api-reference/overview
- Dashboard: https://app.dynamic.xyz/dashboard

### Development Tools
- Dynamic Dashboard: Environment configuration, API tokens, webhook management
- Test Accounts: Available in Sandbox mode for quick testing

### Support Channels
- Check official documentation for support options
- Review API reference for endpoint details
- Consult dashboard for configuration guidance

---

## Document Metadata

**AI Optimization Notes**:
- Each section includes URL, use case, keywords for search
- Structured with clear headers for navigation
- Technical details preserved for implementation
- Cross-references included for related topics
- Common patterns documented for quick starts
- Troubleshooting index for problem-solving
- Quick command reference for copy-paste usage

**Coverage**: All 35+ provided URLs documented with summaries, implementation details, and searchable keywords

**Last Updated**: 2025-11-24
**Version**: 1.0
**Maintained for**: Claude Code AI Assistant
