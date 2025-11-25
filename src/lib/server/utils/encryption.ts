/**
 * Encryption utilities for server wallet key shares
 * Uses AES-256-GCM for authenticated encryption with a dedicated key
 */

import { createEncryptor } from './encryption-base';
import { DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY } from '$env/static/private';

const { encrypt, decrypt } = createEncryptor(DYNAMIC_SERVER_WALLET_ENCRYPTION_KEY);

/**
 * Encrypt data using AES-256-GCM
 * Returns format: ${iv}:${authTag}:${encrypted}
 *
 * @param data - Plain text to encrypt
 * @returns Encrypted string with IV and auth tag
 */
export const encryptData = encrypt;

/**
 * Decrypt data encrypted with AES-256-GCM
 * Expects format: ${iv}:${authTag}:${encrypted}
 *
 * @param encrypted - Encrypted string from encryptData
 * @returns Decrypted plain text
 * @throws Error if decryption fails or authentication tag is invalid
 */
export const decryptData = decrypt;
