/**
 * Database schema for Glitch Markets
 * Uses Drizzle ORM with PostgreSQL
 */

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table
 * Stores user accounts from Dynamic authentication
 */
export const users = pgTable('users', {
	id: text('id').primaryKey(), // Dynamic user ID
	email: text('email'),

	// Server Wallet (Backend MPC Wallet) - for automated Polymarket trading
	serverWalletAddress: text('server_wallet_address'), // Address of the server-controlled wallet
	serverWalletId: text('server_wallet_id'), // Dynamic wallet ID
	encryptedServerKeyShares: text('encrypted_server_key_shares'), // Encrypted external key shares (JSON)
	serverWalletPublicKey: text('server_wallet_public_key'), // Public key hex

	createdAt: timestamp('created_at').notNull().defaultNow(),
	lastLoginAt: timestamp('last_login_at').notNull().defaultNow()
});

/**
 * Polymarket credentials table
 * Stores encrypted CLOB API credentials for trading
 * User must exist in users table before Polymarket registration
 */
export const polymarketCredentials = pgTable('polymarket_credentials', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id),
	walletAddress: text('wallet_address').notNull(), // Server wallet address
	proxyWalletAddress: text('proxy_wallet_address').notNull(), // Polymarket proxy wallet (CREATE2 derived)
	encryptedApiKey: text('encrypted_api_key').notNull(),
	encryptedSecret: text('encrypted_secret').notNull(),
	encryptedPassphrase: text('encrypted_passphrase').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	lastUsedAt: timestamp('last_used_at')
});
