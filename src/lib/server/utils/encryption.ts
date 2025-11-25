/**
 * Encryption utilities for server wallet key shares
 * Uses AES-256-GCM for authenticated encryption with a dedicated key
 */

import crypto from 'node:crypto';
import { DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY } from '$env/static/private';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY, 'hex');

/**
 * Encrypt data using AES-256-GCM
 * Returns format: ${iv}:${authTag}:${encrypted}
 *
 * @param data - Plain text to encrypt
 * @returns Encrypted string with IV and auth tag
 */
export function encryptData(data: string): string {
	// Generate random initialization vector
	const iv = crypto.randomBytes(16);

	// Create cipher
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

	// Encrypt
	let encrypted = cipher.update(data, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	// Get authentication tag
	const authTag = cipher.getAuthTag();

	// Return format: iv:authTag:encrypted
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * Expects format: ${iv}:${authTag}:${encrypted}
 *
 * @param encrypted - Encrypted string from encryptData
 * @returns Decrypted plain text
 * @throws Error if decryption fails or authentication tag is invalid
 */
export function decryptData(encrypted: string): string {
	const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

	if (!ivHex || !authTagHex || !encryptedText) {
		throw new Error('Invalid encrypted data format');
	}

	// Convert from hex
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');

	// Create decipher
	const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
	decipher.setAuthTag(authTag);

	// Decrypt
	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
