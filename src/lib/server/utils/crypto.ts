/**
 * Cryptographic utilities for encrypting/decrypting Polymarket credentials
 * Uses AES-256-GCM for authenticated encryption
 */

import { createEncryptor } from './encryption-base';
import { POLYMARKET_ENCRYPTION_KEY } from '$env/static/private';

// Create encryptor instance with Polymarket encryption key
const { encrypt, decrypt } = createEncryptor(POLYMARKET_ENCRYPTION_KEY);

/**
 * Encrypt text using AES-256-GCM
 * Returns format: ${iv}:${authTag}:${encrypted}
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string with IV and auth tag
 */
export const encryptWithAES = encrypt;

/**
 * Decrypt text encrypted with AES-256-GCM
 * Expects format: ${iv}:${authTag}:${encrypted}
 *
 * @param encrypted - Encrypted string from encryptWithAES
 * @returns Decrypted plain text
 * @throws Error if decryption fails or authentication tag is invalid
 */
export const decryptWithAES = decrypt;
