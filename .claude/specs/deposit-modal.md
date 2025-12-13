╔══════════════════════════════════════════════╗
║ 📋 DEPOSIT MODAL - SPECIFICATION             ║
║ Created: 2025-12-13 15:00                    ║
╚══════════════════════════════════════════════╝

┌──────────────────────────────────────────────┐
│ 📍 SPECIFICATION PROGRESS                    │
├──────────────────────────────────────────────┤
│ ✅ Requirements [████████████] APPROVED      │
│ ✅ Design       [████████████] APPROVED      │
│ ✅ Tasks        [████████████] COMPLETE      │
└──────────────────────────────────────────────┘

═══════════════════════════════════════════════
📋 PHASE 1: REQUIREMENTS
═══════════════════════════════════════════════

## 1. Overview

**Feature Name:** Deposit Modal
**Purpose:** Enable users to deposit funds from external wallets by displaying chain-specific deposit addresses with QR codes
**Business Value:** Simplifies the deposit flow for users, reducing friction in funding their Glitch Markets accounts and enabling trading
**Target Users:** All authenticated users who want to add funds to their Glitch Markets wallet
**Success Metrics:**
• 80% of users successfully view deposit address without errors
• 50% of users who open modal complete at least one copy action
• Average time to copy address < 5 seconds from modal open
• < 1% error rate on API calls

## 2. User Stories

### 2.1 View Supported Deposit Assets (Must Have) 🔥

As a user with funds on various chains, I want to see all supported deposit chains and tokens, So that I can choose the most convenient option for my deposit.

**Acceptance Criteria:**
✓ Given I open the deposit modal
✓ When the supported assets API loads
✓ Then I see a list of all supported chains (e.g., Ethereum, Polygon, Bitcoin)
✓ And each chain shows its native token symbol (e.g., ETH, MATIC, BTC)
✓ And minimum deposit amounts are clearly displayed

**Edge Cases:**
• API returns no supported assets (show error state)
• API call fails or times out (show retry option)
• Very long list of assets (implement scrolling)
• Asset names/symbols are very long (truncate with ellipsis)

**Priority:** Must Have
**Effort Estimate:** M (3-4h)

### 2.2 Select Chain and Get Deposit Address (Must Have) 🔥

As a user, I want to select a specific chain/token, So that I can receive a unique deposit address for that chain.

**Acceptance Criteria:**
✓ Given I'm viewing the supported assets list
✓ When I click/tap on a specific asset
✓ Then a deposit address API call is made with my user address
✓ And I see a loading state while the address is being generated
✓ And the deposit address is displayed when the API responds
✓ And the selected asset is visually highlighted
✓ And I see the minimum deposit amount for the selected asset

**Edge Cases:**
• User is not authenticated (shouldn't happen, but show error)
• API fails to generate deposit address (show error with retry)
• User rapidly clicks multiple assets (debounce or disable during loading)
• User's wallet address is invalid (API validation error handling)
• Multiple chain types returned (evm, svm, btc) - show the relevant one

**Priority:** Must Have
**Effort Estimate:** M (3-4h)

### 2.3 Copy Deposit Address to Clipboard (Must Have) 🔥

As a user, I want to easily copy the deposit address to my clipboard, So that I can paste it into my external wallet without typing errors.

**Acceptance Criteria:**
✓ Given I'm viewing a deposit address
✓ When I click the copy button
✓ Then the full address is copied to my clipboard
✓ And I see a visual confirmation (toast, button state change, or checkmark)
✓ And the confirmation disappears after 2-3 seconds
✓ And I can copy multiple times without issues

**Edge Cases:**
• Clipboard API not available (fallback to select-all or show manual copy instructions)
• Copy fails due to permissions (show error and fallback instructions)
• User clicks copy very rapidly (prevent multiple toasts)
• Address is empty or null (disable copy button)

**Priority:** Must Have
**Effort Estimate:** S (1-2h)

### 2.4 View Deposit Address as QR Code (Should Have) 💡

As a mobile user, I want to see the deposit address as a QR code, So that I can scan it with my mobile wallet instead of manually copying.

**Acceptance Criteria:**
✓ Given I'm viewing a deposit address
✓ When the address is displayed
✓ Then I also see a QR code representation of that address
✓ And the QR code is sized appropriately for easy scanning (minimum 200x200px)
✓ And the QR code updates when I select a different asset
✓ And I can still access the text address and copy button

**Edge Cases:**
• QR code library fails to load (show address only, no QR)
• Very long addresses cause QR density issues (adjust error correction level)
• User is on desktop (QR still useful for mobile wallet apps)
• Screen is very small (ensure QR doesn't dominate entire modal)

**Priority:** Should Have
**Effort Estimate:** S (1-2h)

## 3. Non-Functional Requirements

### 3.1 Performance

• Modal open animation: < 200ms
• Supported assets API call: < 1s (already has 5min cache)
• Deposit address API call: < 2s
• QR code generation: < 500ms
• Copy to clipboard: < 100ms perceived latency

### 3.2 Security

• User address validation: Ensure authenticated user's address is used
• API endpoints: Already secured on backend (BridgeService)
• No sensitive data logged: Don't log full user addresses in console
• HTTPS only: All API calls over secure connection (SvelteKit default)

### 3.3 Accessibility

• WCAG Level: AA compliance
• Screen reader: All interactive elements have aria-labels
• Keyboard navigation: Tab through assets, Enter to select, Escape to close
• Focus management: Focus trap within modal, return focus on close
• Color contrast: All text meets 4.5:1 ratio minimum
• Touch targets: Minimum 44x44px (matches existing Button component)

### 3.4 Compatibility

• Platforms: Web (PWA-first, desktop-ready)
• Browsers: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
• Screen sizes: 320px (iPhone SE) to 4K desktop
• Mobile: Touch-optimized, iOS safe area support
• Clipboard API: Modern browsers (with fallback for older browsers)

### 3.5 User Experience

• Loading states: Show skeleton/spinner for all async operations
• Error states: Clear error messages with retry actions
• Empty states: Handle case where no assets are supported
• Responsive design: Mobile-first, scale up to desktop gracefully
• Animation: Smooth transitions (respects prefers-reduced-motion)
• Modal position: BottomSheet on mobile, centered Modal on desktop

## 4. Out of Scope

**Explicitly excluded:**
• Actual deposit transaction processing (handled by external wallets and Porto backend)
• Deposit history or transaction tracking (separate feature)
• Multi-signature wallet support (future enhancement)
• Deposit amount input or validation (users send from external wallets)
• Fiat on-ramp integration (future consideration)
• Email/SMS notifications when deposit is received (future enhancement)
• Estimated deposit arrival time display (depends on chain congestion)

**Future Considerations:**
• Show deposit status (pending, confirmed) after user initiates transfer
• Integration with wallet providers to pre-fill deposit amount
• Support for ERC-20 tokens beyond native chain tokens
• Deposit limits and warnings for amounts outside min/max range
• Recent deposit addresses list (for convenience)

## 5. Dependencies & Constraints

**Technical Dependencies:**
• API: `/api/bridge/supported-assets` (GET) - Already implemented, returns supported chains/tokens
• API: `/api/bridge/deposit` (POST) - Already implemented, accepts user address, returns deposit addresses
• Authentication: User must be logged in (authState.user must exist)
• Wallet: User's wallet address available from auth context or profile
• QR Library: Need to install a QR code generation library (e.g., qrcode, qr-code-styling)

**Business Constraints:**
• Timeline: Part of deposit/withdrawal feature set, medium priority
• Resources: Frontend developer with Svelte 5 experience
• Design: Must follow existing design system (electric cyan, CSS variables)

**External Dependencies:**
• Porto Bridge API: Underlying service for deposit address generation
• User's External Wallet: Users must have funds in supported chains
• Blockchain Networks: Subject to network congestion and fees (not in our control)

## 6. Design Constraints

**Must Follow Existing Patterns:**
• Modal: Use existing Modal.svelte or BottomSheet.svelte components
• Buttons: Use Button.svelte with variant/size props
• State Management: Use Svelte 5 runes ($state, $derived, $effect)
• Global Modal State: Follow pattern from modal.svelte.ts (depositModalState)
• Copy Functionality: Follow pattern from UserAvatar.svelte (handleCopyAddress)
• Colors: Use CSS variables from design system (--primary, --bg-*, --text-*)
• Icons: Create new icons in src/lib/components/icons/ if needed
• Error Handling: Show user-friendly error messages, log technical details

**PWA-First Approach:**
• Mobile web is primary target
• Touch-friendly interactions (44px minimum touch targets)
• Bottom sheet preferred on mobile for better reachability
• Responsive layouts that scale to desktop without complexity
• Offline consideration: Cache supported assets, but deposit addresses require connection

═══════════════════════════════════════════════
🏗️ PHASE 2: DESIGN
═══════════════════════════════════════════════

## 1. Architecture Overview

**Pattern:** Feature-based component architecture with centralized modal state management
**State Management:** Svelte 5 runes ($state, $derived, $effect) with global modal state pattern
**Data Flow:** User action → API call → Local state update → UI re-render

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TopHeader.svelte / BottomNav.svelte                   │ │
│  │  ┌──────────────────────────────────┐                 │ │
│  │  │ Button: "Deposit"                │                 │ │
│  │  │ onclick={openDepositModal()}     │                 │ │
│  │  └──────────────────────────────────┘                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  modal.svelte.ts (Global State Store)                 │ │
│  │  depositModalState = { isOpen: boolean }              │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  +layout.svelte (Root Layout)                         │ │
│  │  <DepositModal                                        │ │
│  │    isOpen={depositModalState.isOpen}                 │ │
│  │    onClose={closeDepositModal} />                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   DepositModal Component                     │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  Modal/          │  │  Local State Management        │  │
│  │  BottomSheet     │  │  - supportedAssets: $state     │  │
│  │  (Wrapper)       │  │  - selectedAsset: $state       │  │
│  │                  │  │  - depositAddress: $state      │  │
│  │  Handles:        │  │  - loading states: $state      │  │
│  │  - Backdrop      │  │  - error states: $state        │  │
│  │  - Focus trap    │  │  - userAddress: $derived       │  │
│  │  - Esc/click     │  │                                 │  │
│  └──────────────────┘  └────────────────────────────────┘  │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Content: AssetSelector                               │ │
│  │  - Fetches /api/bridge/supported-assets              │ │
│  │  - Displays list of chains/tokens                    │ │
│  │  - Handles asset selection                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓ (on selection)                   │
│  └════════════════════════════════════════════════════════┐ │
│  ║  Content: DepositAddressDisplay                       ║ │
│  ║  - Fetches /api/bridge/deposit                       ║ │
│  ║  - Shows QR code (QRCodeDisplay)                     ║ │
│  ║  - Shows text address with copy button               ║ │
│  ║  - Shows minimum deposit amount                      ║ │
│  ╚════════════════════════════════════════════════════════┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  /api/bridge/supported-assets (GET)                         │
│  /api/bridge/deposit (POST) { address: string }             │
└─────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

• **Decision 1: Single Modal Component vs Separate Components**
  - **What:** Keep all deposit modal logic in one DepositModal.svelte component with child sections
  - **Rationale:** Simpler state management, clearer data flow, easier to maintain
  - **Alternatives:** Split into AssetSelectorModal + AddressDisplayModal (rejected: adds complexity)
  - **Trade-offs:** Larger single file but better state cohesion vs smaller distributed files

• **Decision 2: Global Modal State Pattern**
  - **What:** Use global store (modal.svelte.ts) following SignInModal pattern
  - **Rationale:** Consistency with existing codebase, can trigger from anywhere
  - **Alternatives:** Props-based modal (rejected: harder to trigger from multiple locations)
  - **Trade-offs:** Global state is more flexible but requires careful cleanup

• **Decision 3: Mobile-First Modal Strategy**
  - **What:** Use responsive approach - BottomSheet on mobile (<768px), Modal on desktop
  - **Rationale:** Better mobile UX, follows PWA-first principle, matches existing patterns
  - **Alternatives:** Single modal style for all sizes (rejected: poor mobile UX)
  - **Trade-offs:** Slightly more complex responsive logic but better user experience

• **Decision 4: QR Code Library Selection**
  - **What:** Use 'qrcode' npm package (lightweight, no dependencies)
  - **Rationale:** Simple API, small bundle size (~10KB), widely used, canvas-based rendering
  - **Alternatives:** qr-code-styling (rejected: heavier), manual implementation (rejected: complexity)
  - **Trade-offs:** External dependency but saves significant development time

## 2. Component Design

### Component Hierarchy

```
DepositModal.svelte
├── Modal.svelte (desktop) / BottomSheet.svelte (mobile)
│   └── Modal content wrapper
│       ├── AssetSelector section
│       │   ├── Loading state (skeleton/spinner)
│       │   ├── Error state (with retry button)
│       │   ├── Empty state (no assets available)
│       │   └── Asset list
│       │       └── AssetListItem (x N assets)
│       │           ├── Chain icon (optional)
│       │           ├── Chain name + token symbol
│       │           └── Minimum deposit amount
│       │
│       └── DepositAddressDisplay section (shown after selection)
│           ├── Selected asset info
│           │   ├── Chain name + token
│           │   └── Minimum deposit warning
│           ├── QRCodeDisplay
│           │   ├── Canvas element (QR code)
│           │   └── Loading/error states
│           ├── AddressDisplay
│           │   ├── Address text (monospace font)
│           │   ├── Copy button (CopyIcon)
│           │   └── Copy success indicator
│           └── Action buttons
│               ├── "Back to Assets" button
│               └── "Done" button
```

### Key Components

#### 2.1 DepositModal.svelte

**Addresses:** Requirements 2.1, 2.2, 2.3, 2.4
**File:** `src/lib/components/wallet/DepositModal.svelte`
**Purpose:** Main modal container orchestrating the deposit flow

**Props Interface:**
```typescript
interface DepositModalProps {
  isOpen: boolean;        // Controls modal visibility
  onClose: () => void;    // Callback to close modal
}
```

**State Management:**
```typescript
// Supported assets
let supportedAssets = $state<SupportedAsset[]>([]);
let assetsLoading = $state<boolean>(true);
let assetsError = $state<string | null>(null);

// Asset selection
let selectedAsset = $state<SupportedAsset | null>(null);

// Deposit address
let depositAddress = $state<string | null>(null);
let addressLoading = $state<boolean>(false);
let addressError = $state<string | null>(null);

// Copy state
let copySuccess = $state<boolean>(false);
let copyTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

// User wallet address (from auth/profile)
let userWalletAddress = $state<string | null>(null);

// Derived states
let isDesktop = $derived(windowWidth >= 768);
let showAssetSelector = $derived(!selectedAsset);
let showAddressDisplay = $derived(!!selectedAsset && !!depositAddress);
```

**Side Effects:**
```typescript
// Effect 1: Fetch supported assets on modal open
$effect(() => {
  if (isOpen) {
    fetchSupportedAssets();
    fetchUserWalletAddress();
  }
});

// Effect 2: Reset state on modal close
$effect(() => {
  if (!isOpen) {
    resetModalState();
  }
});

// Effect 3: Fetch deposit address when asset selected
$effect(() => {
  if (selectedAsset && userWalletAddress) {
    fetchDepositAddress(selectedAsset, userWalletAddress);
  }
});
```

**Children:** Renders either Modal or BottomSheet wrapper based on screen size

#### 2.2 AssetListItem

**Addresses:** Requirement 2.1
**File:** Inline component within DepositModal.svelte (not separate file)
**Purpose:** Display individual asset option in the selector list

**Props:**
```typescript
interface AssetListItemProps {
  asset: SupportedAsset;
  isSelected: boolean;
  onSelect: (asset: SupportedAsset) => void;
}
```

**State:** None (stateless component)

**Rendering:**
```svelte
<button 
  class="asset-item" 
  class:selected={isSelected}
  onclick={() => onSelect(asset)}
>
  <div class="asset-info">
    <div class="asset-name">{asset.chainName}</div>
    <div class="asset-token">{asset.token.symbol}</div>
  </div>
  <div class="asset-minimum">
    Min: ${asset.minCheckoutUsd.toFixed(2)}
  </div>
</button>
```

#### 2.3 QRCodeDisplay

**Addresses:** Requirement 2.4
**File:** Inline component within DepositModal.svelte
**Purpose:** Generate and display QR code for deposit address

**Props:**
```typescript
interface QRCodeDisplayProps {
  address: string;
  size?: number; // Default: 240px
}
```

**State:**
```typescript
let qrCanvas = $state<HTMLCanvasElement | null>(null);
let qrError = $state<boolean>(false);
```

**Side Effects:**
```typescript
$effect(() => {
  if (address && qrCanvas) {
    try {
      // Using 'qrcode' library
      QRCode.toCanvas(qrCanvas, address, {
        width: size,
        margin: 2,
        color: {
          dark: 'var(--text-0)',
          light: 'var(--bg-0)'
        },
        errorCorrectionLevel: 'M'
      });
      qrError = false;
    } catch (err) {
      console.error('QR code generation failed:', err);
      qrError = true;
    }
  }
});
```

**Rendering:**
```svelte
<div class="qr-code-container">
  {#if qrError}
    <div class="qr-error">QR code unavailable</div>
  {:else}
    <canvas bind:this={qrCanvas} class="qr-canvas"></canvas>
  {/if}
</div>
```

## 3. Data Models

### 3.1 SupportedAsset

**Addresses:** Requirements 2.1, 2.2
**File:** `src/lib/types/bridge.ts` (new file)

```typescript
/**
 * Token information for a supported bridge asset
 */
interface BridgeToken {
  name: string;      // "Ether", "Matic", "Bitcoin"
  symbol: string;    // "ETH", "MATIC", "BTC"
  address: string;   // Token contract address (0x... for EVM)
  decimals: number;  // 18 for ETH, 8 for BTC, etc.
}

/**
 * A single supported asset for bridging from a specific chain
 */
interface SupportedAsset {
  chainId: string;        // "1", "137", "bitcoin"
  chainName: string;      // "Ethereum", "Polygon", "Bitcoin"
  token: BridgeToken;     // Token details
  minCheckoutUsd: number; // Minimum deposit in USD (e.g., 10.00)
}

/**
 * Response from GET /supported-assets endpoint
 */
interface SupportedAssetsResponse {
  supportedAssets: SupportedAsset[];
}
```

**Validation Rules:**
- chainId: Non-empty string
- chainName: Non-empty string
- token.symbol: 2-10 characters
- minCheckoutUsd: Positive number >= 0

**Related Models:**
- DepositAddressResponse: Used after asset selection

### 3.2 DepositAddressResponse

**Addresses:** Requirement 2.2
**File:** `src/lib/types/bridge.ts`

```typescript
/**
 * Deposit addresses grouped by chain type
 */
interface DepositAddressMap {
  evm?: string;  // EVM chains (Ethereum, Polygon, etc.)
  svm?: string;  // Solana Virtual Machine
  btc?: string;  // Bitcoin
}

/**
 * Response from POST /deposit endpoint
 */
interface DepositAddressResponse {
  address: DepositAddressMap;
  note?: string; // Optional note from API
}
```

**Validation Rules:**
- At least one of evm, svm, or btc must be present
- Addresses must match expected format (0x... for EVM, base58 for Solana, etc.)

**Usage Notes:**
- Need to determine which address to show based on selected asset's chainId
- EVM chains (chainId "1", "137", etc.) → use address.evm
- Solana → use address.svm
- Bitcoin → use address.btc

### 3.3 DepositModalState (Global)

**Addresses:** Design Decision 2 (Global modal state)
**File:** `src/lib/stores/modal.svelte.ts` (existing file, extend)

```typescript
/**
 * Deposit modal state
 */
export const depositModalState = $state({
  isOpen: false
});

/**
 * Opens the deposit modal
 */
export function openDepositModal() {
  depositModalState.isOpen = true;
}

/**
 * Closes the deposit modal
 */
export function closeDepositModal() {
  depositModalState.isOpen = false;
}
```

## 4. API Design

### 4.1 Endpoints

**GET /api/bridge/supported-assets**
• **Purpose:** Fetch all supported chains and tokens for deposits
• **Addresses:** Requirement 2.1
• **Auth:** Not required (public endpoint, but typically called by authenticated users)
• **Request:** None (no parameters)
• **Response:**
```typescript
{
  supportedAssets: [
    {
      chainId: "1",
      chainName: "Ethereum",
      token: {
        name: "Ether",
        symbol: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18
      },
      minCheckoutUsd: 10.0
    },
    // ... more assets
  ]
}
```
• **Error Cases:**
  - 500: Server error (show retry button)
  - Network timeout (show retry button)
  - Empty response (show "No assets available" message)

**POST /api/bridge/deposit**
• **Purpose:** Generate unique deposit addresses for a user's wallet
• **Addresses:** Requirement 2.2
• **Auth:** Not strictly required, but user must provide their wallet address
• **Request Body:**
```typescript
{
  address: string  // User's wallet address (e.g., "0x123...")
}
```
• **Response:**
```typescript
{
  address: {
    evm?: string,  // EVM deposit address
    svm?: string,  // Solana deposit address
    btc?: string   // Bitcoin deposit address
  },
  note?: string    // Optional note
}
```
• **Error Cases:**
  - 400: Invalid address format (show error: "Invalid wallet address")
  - 401: Unauthorized (shouldn't happen, but show "Please log in")
  - 500: Server error (show retry button)
  - Network error (show retry button)

### 4.2 API Integration Pattern

**Fetch Supported Assets:**
```typescript
async function fetchSupportedAssets() {
  assetsLoading = true;
  assetsError = null;
  
  try {
    const response = await fetch('/api/bridge/supported-assets');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    supportedAssets = data.supportedAssets || [];
  } catch (err) {
    console.error('Failed to fetch supported assets:', err);
    assetsError = err instanceof Error ? err.message : 'Failed to load assets';
  } finally {
    assetsLoading = false;
  }
}
```

**Fetch Deposit Address:**
```typescript
async function fetchDepositAddress(asset: SupportedAsset, userAddress: string) {
  addressLoading = true;
  addressError = null;
  depositAddress = null;
  
  try {
    const response = await fetch('/api/bridge/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: userAddress })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Determine which address to use based on chain type
    const addressMap = data.address;
    const chainType = determineChainType(asset.chainId);
    
    depositAddress = addressMap[chainType] || null;
    
    if (!depositAddress) {
      throw new Error('No deposit address available for this chain');
    }
  } catch (err) {
    console.error('Failed to fetch deposit address:', err);
    addressError = err instanceof Error ? err.message : 'Failed to generate address';
  } finally {
    addressLoading = false;
  }
}

function determineChainType(chainId: string): 'evm' | 'svm' | 'btc' {
  if (chainId === 'bitcoin') return 'btc';
  if (chainId === 'solana') return 'svm';
  return 'evm'; // Default to EVM for Ethereum, Polygon, etc.
}
```

**Get User Wallet Address:**
```typescript
async function fetchUserWalletAddress() {
  try {
    // Fetch from profile endpoint (already implemented)
    const response = await fetch('/api/user/profile');
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await response.json();
    userWalletAddress = profile.serverWalletAddress || null;
  } catch (err) {
    console.error('Failed to fetch user wallet address:', err);
    // Don't set error state - just log it
    // User might not be logged in, which is handled elsewhere
  }
}
```

## 5. State Management

**Global State (modal.svelte.ts):**
• depositModalState.isOpen: Controls modal visibility
• Why global: Allows opening modal from multiple locations (TopHeader, BottomNav, future wallet section)

**Component-Level State (DepositModal.svelte):**
• supportedAssets: List of available chains/tokens
• assetsLoading: Loading state for assets fetch
• assetsError: Error message for assets fetch
• selectedAsset: Currently selected asset (null = showing selector)
• depositAddress: Generated deposit address for selected asset
• addressLoading: Loading state for address generation
• addressError: Error message for address generation
• userWalletAddress: User's wallet address from profile
• copySuccess: Temporary state for copy confirmation (2s timeout)

**Derived State:**
• isDesktop: Computed from window width (>=768px)
• showAssetSelector: Show asset list when no asset selected
• showAddressDisplay: Show address/QR when asset selected AND address generated

**State Transitions:**
```
[Modal Closed]
    ↓ (openDepositModal)
[Modal Opening] → assetsLoading = true
    ↓ (fetch success)
[Showing Assets] → supportedAssets populated
    ↓ (user selects asset)
[Generating Address] → addressLoading = true, selectedAsset set
    ↓ (fetch success)
[Showing Address] → depositAddress set, QR generated
    ↓ (user clicks copy)
[Copy Success] → copySuccess = true (2s)
    ↓ (user clicks back)
[Showing Assets] → selectedAsset = null, depositAddress = null
    ↓ (user closes modal)
[Modal Closed] → all state reset
```

**Query Cache Strategy:**
• Supported assets: Cached on server (5 min TTL via BridgeService)
• Deposit addresses: Never cached (each request generates unique addresses)
• User profile: Fetched once on modal open

**Optimistic Updates:**
• Copy action: Immediately show success state, don't wait for clipboard API
• Asset selection: Immediately show loading state while fetching address

## 6. Error Handling Strategy

**Error Boundaries:**
• Location: DepositModal.svelte component level
• Fallback UI: Error message with retry button, doesn't crash whole app

**User-Facing Errors:**

**Network Errors:**
```typescript
if (assetsError) {
  return (
    <div class="error-state">
      <p>Failed to load supported assets</p>
      <p class="error-message">{assetsError}</p>
      <Button onclick={retryFetchAssets}>Retry</Button>
    </div>
  );
}
```

**Validation Errors:**
```typescript
if (addressError) {
  return (
    <div class="error-banner">
      <WarningIcon />
      <p>{addressError}</p>
      <Button variant="tertiary" onclick={retryFetchAddress}>
        Try Again
      </Button>
    </div>
  );
}
```

**Empty States:**
```typescript
if (!assetsLoading && supportedAssets.length === 0) {
  return (
    <div class="empty-state">
      <p>No deposit options available at this time</p>
      <p class="empty-subtext">Please try again later</p>
    </div>
  );
}
```

**Clipboard Errors:**
```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copySuccess = true;
    copyTimeout = setTimeout(() => { copySuccess = false; }, 2000);
  } catch (err) {
    // Fallback: Select text for manual copy
    console.error('Clipboard API failed:', err);
    // Show manual copy instructions
    showManualCopyInstructions(text);
  }
}
```

**Developer Errors:**
• Logging: Use console.error for all errors with context
• Monitoring: Log API errors, user actions, and state transitions
• Example: `console.error('Failed to fetch deposit address:', { asset, userAddress, error })`

**Error Recovery:**
• Retry buttons for all network errors
• Back button to return to asset selector if address fetch fails
• Clear error states when user tries again
• Don't auto-close modal on errors (user might want to retry)

## 7. UI/UX Design

### 7.1 Mobile Layout (< 768px) - BottomSheet

```
┌─────────────────────────────────────────┐
│ [Backdrop - semi-transparent dark]      │
│                                          │
│                                          │
│  ╔══════════════════════════════════╗  │
│  ║ Deposit Funds          [X Close] ║  │ ← Header
│  ╠══════════════════════════════════╣  │
│  ║                                  ║  │
│  ║ Select Network                   ║  │ ← Section title
│  ║                                  ║  │
│  ║ ┌──────────────────────────────┐ ║  │
│  ║ │ Ethereum                 ETH │ ║  │ ← Asset item
│  ║ │ Min: $10.00                  │ ║  │
│  ║ └──────────────────────────────┘ ║  │
│  ║ ┌──────────────────────────────┐ ║  │
│  ║ │ Polygon                MATIC │ ║  │
│  ║ │ Min: $5.00                   │ ║  │
│  ║ └──────────────────────────────┘ ║  │
│  ║ ┌──────────────────────────────┐ ║  │
│  ║ │ Bitcoin                  BTC │ ║  │
│  ║ │ Min: $20.00                  │ ║  │
│  ║ └──────────────────────────────┘ ║  │
│  ║                                  ║  │
│  ╚══════════════════════════════════╝  │
└─────────────────────────────────────────┘
```

After asset selection:

```
┌─────────────────────────────────────────┐
│ [Backdrop]                               │
│  ╔══════════════════════════════════╗  │
│  ║ Deposit Ethereum       [X Close] ║  │
│  ╠══════════════════════════════════╣  │
│  ║                                  ║  │
│  ║ ┌────────────────────────────┐   ║  │
│  ║ │                            │   ║  │ ← QR Code
│  ║ │     [QR CODE 240x240]      │   ║  │
│  ║ │                            │   ║  │
│  ║ └────────────────────────────┘   ║  │
│  ║                                  ║  │
│  ║ Deposit Address:                 ║  │
│  ║ ┌──────────────────────────────┐ ║  │
│  ║ │ 0x1234...5678   [Copy Icon] │ ║  │ ← Address + copy
│  ║ └──────────────────────────────┘ ║  │
│  ║                                  ║  │
│  ║ ⚠️  Minimum deposit: $10.00      ║  │ ← Warning
│  ║                                  ║  │
│  ║ ┌──────────────────────────────┐ ║  │
│  ║ │ ← Back to Networks           │ ║  │ ← Actions
│  ║ └──────────────────────────────┘ ║  │
│  ║ ┌──────────────────────────────┐ ║  │
│  ║ │        Done                  │ ║  │
│  ║ └──────────────────────────────┘ ║  │
│  ╚══════════════════════════════════╝  │
└─────────────────────────────────────────┘
```

### 7.2 Desktop Layout (>= 768px) - Centered Modal

```
                [Backdrop blur + dark overlay]
                          
        ╔═════════════════════════════════════════╗
        ║ Deposit Funds              [X Close]    ║
        ╠═════════════════════════════════════════╣
        ║                                         ║
        ║  Select Network to Deposit From:        ║
        ║                                         ║
        ║  ┌─────────────────────────────────┐   ║
        ║  │ Ethereum - ETH   Min: $10.00    │   ║
        ║  ├─────────────────────────────────┤   ║
        ║  │ Polygon - MATIC  Min: $5.00     │   ║
        ║  ├─────────────────────────────────┤   ║
        ║  │ Bitcoin - BTC    Min: $20.00    │   ║
        ║  └─────────────────────────────────┘   ║
        ║                                         ║
        ╚═════════════════════════════════════════╝
```

After selection (desktop):

```
        ╔═════════════════════════════════════════╗
        ║ Deposit Ethereum           [X Close]    ║
        ╠═════════════════════════════════════════╣
        ║                                         ║
        ║  ┌──────────────┐  Deposit Address:    ║
        ║  │              │  ┌──────────────────┐ ║
        ║  │  [QR CODE]   │  │ 0x1234...   📋  │ ║
        ║  │  240x240px   │  └──────────────────┘ ║
        ║  │              │                       ║
        ║  └──────────────┘  Full address:        ║
        ║                    0x1234567890abcdef... ║
        ║                                         ║
        ║  ⚠️  Minimum deposit: $10.00 USD         ║
        ║                                         ║
        ║  ┌───────────────┐  ┌────────────────┐ ║
        ║  │ ← Back        │  │     Done       │ ║
        ║  └───────────────┘  └────────────────┘ ║
        ║                                         ║
        ╚═════════════════════════════════════════╝
```

### 7.3 Loading States

**Assets Loading:**
```
┌─────────────────────────────────┐
│ Deposit Funds       [X Close]   │
├─────────────────────────────────┤
│                                 │
│ Loading supported networks...   │
│                                 │
│ ┌─────────────────────────────┐ │ ← Skeleton
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Address Loading:**
```
┌─────────────────────────────────┐
│ Deposit Ethereum    [X Close]   │
├─────────────────────────────────┤
│                                 │
│ Generating deposit address...   │
│                                 │
│        [Spinner animation]      │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### 7.4 Color & Style Guidelines

**From Design System:**
```css
/* Backgrounds */
--modal-bg: var(--bg-1);
--asset-item-bg: var(--bg-2);
--asset-item-hover: var(--primary-hover-bg);
--asset-item-selected: var(--bg-3);

/* Borders */
--modal-border: var(--bg-4);
--asset-item-border: var(--bg-4);
--address-border: var(--bg-4);

/* Text */
--title-color: var(--text-0);
--body-color: var(--text-1);
--subtle-color: var(--text-2);
--minimum-color: var(--text-3);

/* Primary actions */
--copy-button-hover: var(--primary-hover-bg);
--copy-button-active: var(--primary-hover-bg-medium);

/* States */
--error-color: var(--danger);
--error-bg: color-mix(in srgb, var(--danger) 10%, transparent);
--warning-color: var(--warning);
--success-color: var(--success);

/* Spacing */
--modal-padding: var(--space-md); /* 24px */
--item-gap: var(--space-sm); /* 16px */
--section-gap: var(--space-lg); /* 32px */
```

**Typography:**
- Modal title: 20px, font-weight: 700
- Section headers: 14px, font-weight: 600, color: text-2
- Asset names: 16px, font-weight: 500
- Asset tokens: 14px, font-weight: 400, color: text-2
- Minimum amounts: 13px, color: text-3
- Address text: 14px, monospace font

**Spacing:**
- Modal padding: 24px
- Asset items gap: 12px
- Asset item padding: 16px
- Section margins: 24px
- QR code margin: 16px

**Animations:**
- Modal fade in: 200ms ease
- BottomSheet slide up: 250ms ease-out
- Asset hover: 150ms ease
- Copy success: 200ms ease (fade in/out)
- Respect prefers-reduced-motion

## 8. Correctness Properties

**Requirement → Design Mapping:**

| Requirement | Design Element | Correctness Property | How to Verify |
|-------------|----------------|---------------------|---------------|
| 2.1: View Supported Assets | AssetSelector + fetch | All supported chains are displayed | Check supportedAssets.length > 0 after fetch |
| 2.1: Show min deposit | AssetListItem display | Each asset shows minCheckoutUsd | Verify asset.minCheckoutUsd is rendered |
| 2.2: Select chain | Asset click handler | selectedAsset is set correctly | Check selectedAsset === clicked asset |
| 2.2: Generate address | fetchDepositAddress() | Correct address type returned | Verify determineChainType() logic |
| 2.2: Show loading | addressLoading state | Loading indicator shows during fetch | Test loading state rendering |
| 2.3: Copy address | copyToClipboard() | Full address copied to clipboard | Test clipboard.writeText() is called |
| 2.3: Copy confirmation | copySuccess state | Success indicator shows for 2s | Test timeout clears after 2000ms |
| 2.4: QR code display | QRCodeDisplay component | QR contains correct address | Verify QRCode.toCanvas() receives address |
| 2.4: QR size | QR canvas dimensions | Minimum 200x200px on mobile | Test canvas width/height >= 200 |
| NFR: Accessibility | aria-labels, focus trap | All interactive elements labeled | Run axe-core accessibility tests |
| NFR: Keyboard nav | Tab/Enter/Esc handlers | Can navigate without mouse | Test keyboard-only interaction |
| NFR: Error recovery | Retry buttons | Errors don't crash modal | Test error states + retry |

## 9. Security Considerations

**Input Validation:**
• Client-side: Validate user wallet address format before sending to API
• Server-side: Already implemented in BridgeService (validateEthereumAddress)

**Authentication Flow:**
• Modal assumes user is authenticated (authState.user exists)
• User wallet address fetched from secure /api/user/profile endpoint
• No direct user input of addresses (reduces phishing risk)

**Authorization:**
• Deposit API doesn't require strict auth (users provide their own addresses)
• Generated deposit addresses are user-specific (from their wallet address)

**Data Privacy:**
• PII handling: User wallet addresses are semi-public (on blockchain)
• Logging: Don't log full addresses in console (use truncated format)
• Example: Log `address.slice(0, 6) + '...' + address.slice(-4)` instead of full address

**XSS Prevention:**
• All user data (addresses) rendered through Svelte's auto-escaping
• QR code library uses canvas (not innerHTML), safe from XSS

**API Security:**
• HTTPS enforced by SvelteKit
• CORS headers already configured on backend
• Rate limiting on backend (if not already, should add)


═══════════════════════════════════════════════
📝 PHASE 3: TASKS BREAKDOWN
═══════════════════════════════════════════════

## Implementation Plan

📊 **Total Tasks:** 15
⏱️ **Estimated Time:** 12-16 hours
📦 **Phases:** 4 (Foundation → Core → Polish → Testing)

## Task Dependency Graph

### Rules for Dependencies

Task depends on another if it requires:
1. **Types/Interfaces** from other task
2. **Components/Services** from other task
3. **Data/Infrastructure** from other task
4. **Features/Functionality** from other task

No dependency if: Different parts, don't share types/components, can test independently.

### Visualization

```
Task #1 (Package) ────────────────────────────┐
                                               │
Task #2 (Types) ──────┬───────────────────────┤
                      │                       │
Task #3 (Modal State) ┤                       │
                      │                       │
                      ├──> Task #4 (Icons) ───┤
                      │                       │
                      └──> Task #5 (Main Component) ──┬──> Task #9 (Asset Selector) ──┬──> Task #13 (Integration)
                                                       │                                │
                                                       ├──> Task #6 (User Address) ────┤
                                                       │                                │
                                                       ├──> Task #7 (Supported Assets) ┤
                                                       │                                │
                                                       ├──> Task #8 (Deposit API) ──────┤
                                                       │                                │
                                                       └──> Task #10 (QR Code) ─────────┤
                                                            │                           │
                                                            └──> Task #11 (Copy) ───────┘
                                                                 │
                                                                 └──> Task #12 (Styling) ──> Task #13 (Integration)
                                                                                               │
                                                                                               └──> Task #14 (Error Handling)
                                                                                                    │
                                                                                                    └──> Task #15 (Accessibility)

```

**Critical Path:** #1 → #2 → #5 → #7 → #9 → #13 → #14 → #15 (Est: 9h)
**Parallel Opportunities:** 
- Tasks #2, #3, #4 can start after #1
- Tasks #6, #7, #8 can run parallel after #5
- Tasks #10, #11, #12 can run parallel after #5

## Progress Overview

📊 **Overall:** ░░░░░░░░░░░░ 0% (0/15 completed)
⏱️ **Last Updated:** 2025-12-13 15:00

### Phase Breakdown
┌──────────────────────────────────────────────┐
│ Foundation    [░░░░░░░░░░] 0% (0/4)  2.5h   │
│ Core Features [░░░░░░░░░░] 0% (0/6)  6.5h   │
│ Polish & UX   [░░░░░░░░░░] 0% (0/3)  2.5h   │
│ Testing       [░░░░░░░░░░] 0% (0/2)  1.5h   │
└──────────────────────────────────────────────┘

═══════════════════════════════════════════════
🏗️ PHASE 1: FOUNDATION
═══════════════════════════════════════════════

Tasks establishing foundational dependencies, types, and infrastructure.

┌──────────────────────────────────────────────┐
│ Task #1: Install QR Code Package             │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 0.5 hours                       │
│ 🎯 Addresses: Req 2.4, Design 1 (Decision 4) │
│ 🔗 Dependencies: None                        │
│ 📂 Files: package.json                       │
│                                              │
│ **Description:**                             │
│ Install the 'qrcode' npm package for QR     │
│ code generation. This is a lightweight,     │
│ dependency-free package that renders QR     │
│ codes to canvas elements.                   │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Run: npm install qrcode               │
│ • [ ] Run: npm install --save-dev @types/qrcode │
│ • [ ] Verify package.json includes both     │
│ • [ ] TypeScript compiles without errors    │
│ • [ ] Can import QRCode in .ts files        │
│                                              │
│ **Correctness Property:**                    │
│ Import statement works: import QRCode from  │
│ 'qrcode' without TypeScript errors          │
│                                              │
│ **Implementation Notes:**                    │
│ • Package size: ~10KB (minified + gzipped)  │
│ • API: QRCode.toCanvas(canvas, text, opts)  │
│ • No need for configuration files           │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #2: Create Bridge Type Definitions      │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: Design Section 3 (Data Models) │
│ 🔗 Dependencies: None                        │
│ 📂 Files: src/lib/types/bridge.ts (new)     │
│                                              │
│ **Description:**                             │
│ Create TypeScript interfaces for bridge     │
│ API requests and responses. These types     │
│ will be used throughout the modal component │
│ for type safety.                            │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create src/lib/types/bridge.ts        │
│ • [ ] Define BridgeToken interface          │
│ • [ ] Define SupportedAsset interface       │
│ • [ ] Define SupportedAssetsResponse        │
│ • [ ] Define DepositAddressMap interface    │
│ • [ ] Define DepositAddressResponse         │
│ • [ ] Export all interfaces                 │
│ • [ ] TypeScript compiles without errors    │
│ • [ ] Add JSDoc comments to all interfaces  │
│                                              │
│ **Correctness Property:**                    │
│ All API response shapes match actual        │
│ responses from /api/bridge/* endpoints      │
│                                              │
│ **Implementation Notes:**                    │
│ • Reference existing types in               │
│   polymarket-client.ts for consistency      │
│ • Make fields optional (?) where API might  │
│   not always return them                    │
│ • Use descriptive JSDoc for each field      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #3: Add Deposit Modal Global State      │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 0.5 hours                       │
│ 🎯 Addresses: Design Section 5 (State Mgmt)  │
│ 🔗 Dependencies: None                        │
│ 📂 Files: src/lib/stores/modal.svelte.ts    │
│                                              │
│ **Description:**                             │
│ Extend the existing modal state store to    │
│ include deposit modal state and helper      │
│ functions, following the pattern used for   │
│ signInModalState.                           │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Add depositModalState = $state({      │
│       isOpen: false })                      │
│ • [ ] Add openDepositModal() function       │
│ • [ ] Add closeDepositModal() function      │
│ • [ ] Export all three                      │
│ • [ ] TypeScript compiles without errors    │
│ • [ ] Matches pattern of signInModalState   │
│                                              │
│ **Correctness Property:**                    │
│ Calling openDepositModal() sets isOpen to   │
│ true; closeDepositModal() sets it to false  │
│                                              │
│ **Implementation Notes:**                    │
│ • File already exists, just add 3 exports   │
│ • Keep consistent naming with SignInModal   │
│ • No complex logic needed                   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #4: Create Wallet/Money Icon (Optional) │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 0.5 hours                       │
│ 🎯 Addresses: Design Section 2.1             │
│ 🔗 Dependencies: None                        │
│ 📂 Files: src/lib/components/icons/         │
│           WalletIcon.svelte (new)           │
│                                              │
│ **Description:**                             │
│ Create a Wallet or Money icon component for │
│ the deposit button (if not using existing   │
│ MoneyIcon.svelte). Follow existing icon     │
│ component patterns.                         │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create WalletIcon.svelte OR decide    │
│       to use existing MoneyIcon.svelte      │
│ • [ ] If creating: Match existing icon      │
│       component structure (Props interface) │
│ • [ ] Accept size and color props           │
│ • [ ] SVG viewBox is 0 0 24 24              │
│ • [ ] Test renders at different sizes       │
│ • [ ] Accessible (has aria-hidden="true")   │
│                                              │
│ **Correctness Property:**                    │
│ Icon renders correctly at 16px, 20px, 24px  │
│ sizes and adapts to color prop              │
│                                              │
│ **Implementation Notes:**                    │
│ • MoneyIcon already exists, can reuse it    │
│ • Or use DollarCircleIcon.svelte            │
│ • If creating new: find SVG from iconsax    │
└──────────────────────────────────────────────┘

═══════════════════════════════════════════════
⚙️ PHASE 2: CORE FEATURES
═══════════════════════════════════════════════

Core modal functionality: component structure, API integration, user flows.

┌──────────────────────────────────────────────┐
│ Task #5: Create DepositModal Component Shell │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1.5 hours                       │
│ 🎯 Addresses: Design Section 2.1             │
│ 🔗 Dependencies: #2 (types), #3 (state)     │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte (new)         │
│                                              │
│ **Description:**                             │
│ Create the main DepositModal component with │
│ props, state variables, responsive wrapper  │
│ logic (Modal vs BottomSheet), and basic     │
│ structure. No API calls yet, just the shell.│
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create DepositModal.svelte            │
│ • [ ] Define Props interface (isOpen,       │
│       onClose)                              │
│ • [ ] Initialize all state variables        │
│       ($state declarations)                 │
│ • [ ] Add windowWidth tracking for          │
│       responsive logic                      │
│ • [ ] Implement isDesktop $derived          │
│ • [ ] Render Modal (desktop) or BottomSheet │
│       (mobile) based on isDesktop           │
│ • [ ] Add modal title and close button      │
│ • [ ] Import types from bridge.ts           │
│ • [ ] Component compiles without errors     │
│                                              │
│ **Subtasks:**                                │
│   5.1 [ ] Set up component file structure   │
│   5.2 [ ] Define all props and state vars   │
│   5.3 [ ] Add window resize listener        │
│   5.4 [ ] Implement responsive wrapper      │
│                                              │
│ **Correctness Property:**                    │
│ Modal shows on desktop (width >= 768px),    │
│ BottomSheet shows on mobile (< 768px)       │
│                                              │
│ **Implementation Notes:**                    │
│ • Reference SignInModal.svelte for patterns │
│ • Use existing Modal.svelte and             │
│   BottomSheet.svelte components             │
│ • Window width pattern from UserAvatar      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #6: Implement User Wallet Address Fetch │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: Design Section 4.2             │
│ 🔗 Dependencies: #5 (component shell)       │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Add function to fetch user's wallet address │
│ from /api/user/profile when modal opens.    │
│ Store in userWalletAddress state variable.  │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create fetchUserWalletAddress() async │
│       function                              │
│ • [ ] Call fetch('/api/user/profile')       │
│ • [ ] Extract serverWalletAddress from      │
│       response                              │
│ • [ ] Set userWalletAddress state           │
│ • [ ] Handle errors gracefully (log only)   │
│ • [ ] Add $effect to call on modal open     │
│ • [ ] Test with authenticated user          │
│ • [ ] Test with unauthenticated user        │
│                                              │
│ **Correctness Property:**                    │
│ userWalletAddress is populated when modal   │
│ opens for authenticated users               │
│                                              │
│ **Implementation Notes:**                    │
│ • Pattern from UserAvatar.svelte profile    │
│   fetch                                     │
│ • Don't show error to user if fetch fails   │
│ • Will need this address for deposit API    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #7: Implement Supported Assets Fetch    │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1.5 hours                       │
│ 🎯 Addresses: Req 2.1, Design Section 4.2    │
│ 🔗 Dependencies: #5 (component shell)       │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Implement the fetchSupportedAssets()        │
│ function to call GET /api/bridge/supported- │
│ assets and populate the supportedAssets     │
│ state array with proper error handling.     │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create fetchSupportedAssets() async   │
│       function                              │
│ • [ ] Set assetsLoading = true at start     │
│ • [ ] Call fetch('/api/bridge/supported-    │
│       assets')                              │
│ • [ ] Parse JSON response                   │
│ • [ ] Set supportedAssets from response     │
│ • [ ] Handle HTTP errors (show assetsError) │
│ • [ ] Handle network errors (retry option)  │
│ • [ ] Set assetsLoading = false in finally  │
│ • [ ] Add $effect to call on modal open     │
│ • [ ] Test with network success             │
│ • [ ] Test with network error               │
│                                              │
│ **Correctness Property:**                    │
│ supportedAssets array is populated with     │
│ valid SupportedAsset objects on success     │
│                                              │
│ **Implementation Notes:**                    │
│ • API already returns cached data (5min)    │
│ • Reference Design Section 4.2 for pattern  │
│ • Use try/catch for error handling          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #8: Implement Deposit Address API Call  │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1.5 hours                       │
│ 🎯 Addresses: Req 2.2, Design Section 4.2    │
│ 🔗 Dependencies: #5 (component shell)       │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Implement fetchDepositAddress() to call     │
│ POST /api/bridge/deposit with user's wallet │
│ address and extract the correct deposit     │
│ address based on selected asset's chain.    │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create fetchDepositAddress(asset,     │
│       userAddress) async function           │
│ • [ ] Set addressLoading = true at start    │
│ • [ ] POST to /api/bridge/deposit with      │
│       { address: userAddress }              │
│ • [ ] Parse response.address map            │
│ • [ ] Create determineChainType() helper    │
│ • [ ] Extract correct address (evm/svm/btc) │
│ • [ ] Set depositAddress state              │
│ • [ ] Handle errors (show addressError)     │
│ • [ ] Set addressLoading = false in finally │
│ • [ ] Add $effect to call when asset        │
│       selected                              │
│ • [ ] Test with EVM chain selection         │
│ • [ ] Test with error response              │
│                                              │
│ **Subtasks:**                                │
│   8.1 [ ] Implement determineChainType()    │
│   8.2 [ ] Implement fetchDepositAddress()   │
│   8.3 [ ] Add $effect for auto-trigger      │
│                                              │
│ **Correctness Property:**                    │
│ Correct address type (evm/svm/btc) is       │
│ extracted based on asset.chainId            │
│                                              │
│ **Implementation Notes:**                    │
│ • determineChainType: "bitcoin" → btc,      │
│   "solana" → svm, else → evm                │
│ • Reference Design Section 4.2              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #9: Build Asset Selector UI             │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1.5 hours                       │
│ 🎯 Addresses: Req 2.1, Design Section 7.1    │
│ 🔗 Dependencies: #5, #7 (component + fetch)  │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Build the asset selector section that       │
│ displays the list of supported chains/      │
│ tokens with loading, error, and empty       │
│ states. Handle asset selection.             │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create asset selector section in      │
│       markup                                │
│ • [ ] Show loading skeleton while           │
│       assetsLoading is true                 │
│ • [ ] Show error message + retry button     │
│       when assetsError exists               │
│ • [ ] Show empty state when no assets       │
│ • [ ] Render asset list items when loaded   │
│ • [ ] Each item shows: chainName, token     │
│       symbol, minCheckoutUsd                │
│ • [ ] Implement handleAssetSelect(asset)    │
│ • [ ] Visual feedback on selection          │
│ • [ ] Retry button calls                    │
│       fetchSupportedAssets()                │
│ • [ ] Test all states (loading, error,      │
│       empty, success)                       │
│                                              │
│ **Subtasks:**                                │
│   9.1 [ ] Create loading skeleton           │
│   9.2 [ ] Create error state with retry     │
│   9.3 [ ] Create empty state                │
│   9.4 [ ] Create asset list items           │
│   9.5 [ ] Implement selection handler       │
│                                              │
│ **Correctness Property:**                    │
│ All supported assets are displayed; clicking│
│ an asset sets selectedAsset state           │
│                                              │
│ **Implementation Notes:**                    │
│ • Reference Design Section 7.1 wireframes   │
│ • Use Button component for retry            │
│ • Skeleton can be simple shimmer divs       │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #10: Implement QR Code Generation       │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: Req 2.4, Design Section 2.3    │
│ 🔗 Dependencies: #1 (qrcode pkg), #5 (shell)│
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Create inline QRCodeDisplay component that  │
│ generates and renders a QR code for the     │
│ deposit address using the 'qrcode' library. │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Import QRCode from 'qrcode'           │
│ • [ ] Create qrCanvas state variable        │
│ • [ ] Create qrError state variable         │
│ • [ ] Add <canvas> element with bind:this   │
│ • [ ] Add $effect to generate QR when       │
│       depositAddress changes                │
│ • [ ] Call QRCode.toCanvas() with options   │
│ • [ ] Set QR size to 240px                  │
│ • [ ] Use CSS variables for colors          │
│ • [ ] Handle generation errors gracefully   │
│ • [ ] Show error message if QR fails        │
│ • [ ] Test QR code scans correctly          │
│                                              │
│ **Correctness Property:**                    │
│ QR code contains the exact depositAddress   │
│ string and is scannable by wallet apps      │
│                                              │
│ **Implementation Notes:**                    │
│ • QRCode.toCanvas(canvas, text, {           │
│     width: 240, margin: 2,                  │
│     color: { dark: 'var(--text-0)',         │
│              light: 'var(--bg-0)' },        │
│     errorCorrectionLevel: 'M' })            │
│ • Test with phone camera QR scanner         │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #11: Implement Copy to Clipboard        │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: Req 2.3, Design Section 6      │
│ 🔗 Dependencies: #5 (component shell)       │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Implement copy-to-clipboard functionality   │
│ with visual feedback, following the pattern │
│ from UserAvatar.svelte's copy handler.      │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Create handleCopyAddress() async      │
│       function                              │
│ • [ ] Use navigator.clipboard.writeText()   │
│ • [ ] Set copySuccess = true on success     │
│ • [ ] Show success indicator (2s timeout)   │
│ • [ ] Reset copySuccess after 2 seconds     │
│ • [ ] Handle clipboard permission errors    │
│ • [ ] Implement fallback for unsupported    │
│       browsers (manual copy instructions)   │
│ • [ ] Add copy button with CopyIcon         │
│ • [ ] Show checkmark when copySuccess       │
│ • [ ] Clean up timeout on component unmount │
│ • [ ] Test copy functionality works         │
│                                              │
│ **Correctness Property:**                    │
│ Clipboard contains exact depositAddress     │
│ after successful copy operation             │
│                                              │
│ **Implementation Notes:**                    │
│ • Reference UserAvatar handleCopyAddress    │
│ • Use CopyIcon component (already exists)   │
│ • Consider CheckCircleIcon for success      │
└──────────────────────────────────────────────┘

═══════════════════════════════════════════════
✨ PHASE 3: POLISH & UX
═══════════════════════════════════════════════

Styling, responsive design, loading states, and user experience refinements.

┌──────────────────────────────────────────────┐
│ Task #12: Style Components with Design System│
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 2 hours                         │
│ 🎯 Addresses: Design Section 7.4             │
│ 🔗 Dependencies: #5, #9, #10, #11 (all UI)  │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Apply comprehensive styling using CSS       │
│ variables from the design system. Implement │
│ responsive layouts for mobile and desktop.  │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Use CSS variables (--bg-*, --text-*,  │
│       --primary-*, etc.)                    │
│ • [ ] Style asset selector section          │
│ • [ ] Style asset list items with hover     │
│ • [ ] Style selected asset highlight        │
│ • [ ] Style deposit address display section │
│ • [ ] Style QR code container               │
│ • [ ] Style address text (monospace font)   │
│ • [ ] Style copy button with hover/active   │
│ • [ ] Add animations (fade, slide)          │
│ • [ ] Respect prefers-reduced-motion        │
│ • [ ] Ensure 44px minimum touch targets     │
│ • [ ] Test responsive layouts (mobile/      │
│       desktop)                              │
│ • [ ] Verify WCAG AA color contrast         │
│                                              │
│ **Subtasks:**                                │
│   12.1 [ ] Style asset selector section     │
│   12.2 [ ] Style deposit display section    │
│   12.3 [ ] Add animations and transitions   │
│   12.4 [ ] Test responsive breakpoints      │
│                                              │
│ **Correctness Property:**                    │
│ All colors use CSS variables; contrast      │
│ ratios meet WCAG AA (4.5:1 for text)        │
│                                              │
│ **Implementation Notes:**                    │
│ • Reference brand-colors.md for variables   │
│ • Reference existing Modal/BottomSheet      │
│   styles                                    │
│ • Use design system spacing (--space-*)     │
│ • Mobile: bottom sheet slides up            │
│ • Desktop: modal fades in with backdrop     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #13: Integrate with Application Layout  │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 0.5 hours                       │
│ 🎯 Addresses: Design Section 1               │
│ 🔗 Dependencies: #5 (component complete)    │
│ 📂 Files: src/routes/+layout.svelte,        │
│           src/lib/components/layout/        │
│           TopHeader.svelte OR BottomNav     │
│                                              │
│ **Description:**                             │
│ Add DepositModal to root layout and add a   │
│ "Deposit" button to TopHeader or BottomNav  │
│ that opens the modal.                       │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Import DepositModal in +layout.svelte │
│ • [ ] Import depositModalState,             │
│       closeDepositModal from stores         │
│ • [ ] Render <DepositModal isOpen={...}     │
│       onClose={...} />                      │
│ • [ ] Decide placement: TopHeader or        │
│       BottomNav (or both)                   │
│ • [ ] Import openDepositModal in chosen     │
│       component                             │
│ • [ ] Add Button with "Deposit" text/icon   │
│ • [ ] Set onclick={openDepositModal}        │
│ • [ ] Test modal opens when button clicked  │
│ • [ ] Test modal closes with X button       │
│                                              │
│ **Correctness Property:**                    │
│ Clicking Deposit button opens modal;        │
│ clicking close/backdrop closes it           │
│                                              │
│ **Implementation Notes:**                    │
│ • Follow SignInModal integration pattern    │
│ • +layout.svelte likely has SignInModal,    │
│   add DepositModal similarly                │
│ • Suggest: TopHeader for desktop, BottomNav │
│   for mobile (or both)                      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #14: Implement Error Handling & States  │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: Design Section 6               │
│ 🔗 Dependencies: #7, #8, #9 (API calls)     │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Enhance error handling with user-friendly   │
│ error messages, retry mechanisms, and       │
│ fallback states for all possible failures.  │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Add user-friendly error messages for  │
│       network failures                      │
│ • [ ] Add retry buttons for all API errors  │
│ • [ ] Implement retryFetchAssets() helper   │
│ • [ ] Implement retryFetchAddress() helper  │
│ • [ ] Add "Back to Assets" button when      │
│       address fetch fails                   │
│ • [ ] Handle clipboard API not available    │
│       (show manual copy instructions)       │
│ • [ ] Handle no user wallet address         │
│       (shouldn't happen but show error)     │
│ • [ ] Test all error scenarios              │
│ • [ ] Ensure errors don't crash modal       │
│                                              │
│ **Correctness Property:**                    │
│ All error states are recoverable; user can  │
│ retry or navigate back without closing modal│
│                                              │
│ **Implementation Notes:**                    │
│ • Reference Design Section 6 for error      │
│   handling patterns                         │
│ • Don't auto-close modal on errors          │
│ • Show specific messages, not generic       │
└──────────────────────────────────────────────┘

═══════════════════════════════════════════════
🧪 PHASE 4: TESTING & ACCESSIBILITY
═══════════════════════════════════════════════

Ensure quality, accessibility, and proper functionality.

┌──────────────────────────────────────────────┐
│ Task #15: Add Accessibility Features         │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: Design Section 8, NFR 3.3      │
│ 🔗 Dependencies: #5, #9, #10, #11 (all UI)  │
│ 📂 Files: src/lib/components/wallet/        │
│           DepositModal.svelte               │
│                                              │
│ **Description:**                             │
│ Add ARIA labels, keyboard navigation, focus │
│ management, and screen reader support to    │
│ ensure WCAG AA compliance.                  │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Add aria-label to all buttons         │
│ • [ ] Add aria-live for loading states      │
│ • [ ] Add aria-describedby for error msgs   │
│ • [ ] Ensure Tab navigation works through   │
│       asset list                            │
│ • [ ] Enter key selects asset               │
│ • [ ] Escape key closes modal (already in   │
│       Modal/BottomSheet)                    │
│ • [ ] Focus trap works (handled by Modal)   │
│ • [ ] Return focus to trigger on close      │
│ • [ ] QR code has alt text or aria-label    │
│ • [ ] Address text is selectable for manual │
│       copy                                  │
│ • [ ] Test with keyboard only (no mouse)    │
│ • [ ] Test with screen reader (VoiceOver/   │
│       NVDA)                                 │
│                                              │
│ **Subtasks:**                                │
│   15.1 [ ] Add all ARIA labels              │
│   15.2 [ ] Test keyboard navigation         │
│   15.3 [ ] Test screen reader compatibility │
│                                              │
│ **Correctness Property:**                    │
│ Can complete entire deposit flow (view      │
│ assets, select, copy) using only keyboard   │
│                                              │
│ **Implementation Notes:**                    │
│ • Modal/BottomSheet already handle focus    │
│   trap and Esc key                          │
│ • Add role="listbox" to asset list          │
│ • Add role="option" to asset items          │
│ • Use aria-selected for selected asset      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Task #16: End-to-End Testing & QA            │
├──────────────────────────────────────────────┤
│ ⏳ Status: PENDING                           │
│ ⏱️ Estimate: 1 hour                          │
│ 🎯 Addresses: All requirements               │
│ 🔗 Dependencies: All previous tasks         │
│ 📂 Files: All components                    │
│                                              │
│ **Description:**                             │
│ Comprehensive end-to-end testing of the     │
│ entire deposit modal flow across different  │
│ scenarios, devices, and edge cases.         │
│                                              │
│ **Completion Criteria:**                     │
│ • [ ] Test happy path: open → select → copy│
│ • [ ] Test on mobile viewport (<768px)     │
│ • [ ] Test on desktop viewport (>=768px)   │
│ • [ ] Test with real QR scanner app         │
│ • [ ] Test network error scenarios          │
│ • [ ] Test with no supported assets         │
│ • [ ] Test copy with different browsers     │
│ • [ ] Test clipboard permission denied      │
│ • [ ] Test rapid asset switching            │
│ • [ ] Test "Back to Assets" navigation      │
│ • [ ] Test modal close and reopen           │
│ • [ ] Verify no console errors              │
│ • [ ] Verify no memory leaks (timeouts      │
│       cleaned up)                           │
│ • [ ] Cross-browser testing (Chrome,        │
│       Safari, Firefox)                      │
│                                              │
│ **Subtasks:**                                │
│   16.1 [ ] Test happy path flows            │
│   16.2 [ ] Test error scenarios             │
│   16.3 [ ] Test responsive layouts          │
│   16.4 [ ] Cross-browser testing            │
│                                              │
│ **Correctness Property:**                    │
│ All user stories complete successfully; no  │
│ errors in console; QR codes scan correctly  │
│                                              │
│ **Implementation Notes:**                    │
│ • Use actual wallet app to scan QR codes    │
│ • Test in Chrome DevTools device mode       │
│ • Test clipboard API in different browsers  │
│ • Verify iOS safe area insets               │
└──────────────────────────────────────────────┘

## Change Log

### 2025-12-13 15:00
- Initial task breakdown created
- 16 tasks across 4 phases (Foundation, Core, Polish, Testing)
- Total estimated time: 13-17 hours
- Dependencies mapped
- Critical path identified: #1 → #2 → #5 → #7 → #9 → #13 → #14 → #15 (9h)

## Implementation Notes & Discoveries

<!-- This section will be populated during implementation:
     - Actual time taken vs estimates
     - Decisions made during development
     - Deviations from the plan
     - New tasks discovered
     - Blockers and resolutions
     - API quirks or surprises
-->

