import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives a key from the encryption secret
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Gets the encryption secret from environment or throws error
 */
function getEncryptionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required for encryption');
  }
  return secret;
}

/**
 * Encrypts a string value
 * @param text - The text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encrypted
 */
export function encrypt(text: string): string {
  const secret = getEncryptionSecret();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from secret and salt
  const key = deriveKey(secret, salt);

  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const tag = cipher.getAuthTag();

  // Combine salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string
 * @param encryptedText - The encrypted text in format: salt:iv:tag:encrypted
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string): string {
  const secret = getEncryptionSecret();

  // Split the encrypted text
  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }

  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];

  // Derive key from secret and salt
  const key = deriveKey(secret, salt);

  // Create decipher and decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masks an API key for display (shows only last 4 characters)
 * @param apiKey - The API key to mask
 * @returns Masked API key string
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****';
  }
  const last4 = apiKey.slice(-4);
  return `${'*'.repeat(apiKey.length - 4)}${last4}`;
}
