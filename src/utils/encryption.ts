import CryptoJS from 'crypto-js';

export interface EncryptionOptions {
  iterations?: number;
  keySize?: number;
  ivSize?: number;
}

const DEFAULT_OPTIONS: Required<EncryptionOptions> = {
  iterations: 10000,
  keySize: 256 / 32,
  ivSize: 128 / 32,
};

/**
 * Derives a key from a password using PBKDF2
 */
function deriveKey(password: string, salt: CryptoJS.lib.WordArray, options: Required<EncryptionOptions>): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: options.keySize,
    iterations: options.iterations,
  });
}

/**
 * Encrypts data with AES-256-CBC using a password
 * Uses PBKDF2 for key derivation and random IV
 */
export function encryptData(data: string, password: string, options: EncryptionOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Generate random salt and IV
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  
  // Derive key from password
  const key = deriveKey(password, salt, opts);
  
  // Encrypt the data
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  
  // Combine salt, iv, and encrypted data
  const result = salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
  
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(result));
}

/**
 * Decrypts data encrypted with encryptData
 */
export function decryptData(encryptedData: string, password: string, options: EncryptionOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Decode from base64
    const decoded = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedData));
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = CryptoJS.enc.Hex.parse(parts[0]);
    const iv = CryptoJS.enc.Hex.parse(parts[1]);
    const encrypted = parts[2];
    
    // Derive key from password
    const key = deriveKey(password, salt, opts);
    
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!result) {
      throw new Error('Invalid password or corrupted data');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a strong random password
 */
export function generatePassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomValues = CryptoJS.lib.WordArray.random(length);
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const byte = (randomValues.words[Math.floor(i / 4)] >>> (24 - (i % 4) * 8)) & 0xFF;
    password += charset[byte % charset.length];
  }
  
  return password;
}

/**
 * Validates if a string is a valid encrypted data format
 */
export function isValidEncryptedData(data: string): boolean {
  try {
    const decoded = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(data));
    const parts = decoded.split(':');
    return parts.length === 3 && parts.every(part => part.length > 0);
  } catch {
    return false;
  }
}

/**
 * Creates a hash of a password for verification (without storing the password)
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Verifies a password against its hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}