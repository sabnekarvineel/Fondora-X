/**
 * End-to-End Encryption Utility using AES-256-GCM
 * Keys are stored locally on the device, never on the server
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

// Generate a random encryption key for a conversation
export const generateConversationKey = async () => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
  return key;
};

// Export key to storable format (base64)
export const exportKey = async (key) => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
};

// Import key from stored format
export const importKey = async (keyString) => {
  const keyBuffer = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt a message using AES-256-GCM
export const encryptMessage = async (message, key) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Generate random IV for each encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV + encrypted data for storage
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt a message using AES-256-GCM
export const decryptMessage = async (encryptedData, key) => {
  try {
    // Guard: validate inputs
    if (!encryptedData || !key) {
      console.warn('Decryption failed: missing encryptedData or key');
      return '[Encrypted message]';
    }

    const combined = base64ToArrayBuffer(encryptedData);
    const combinedArray = new Uint8Array(combined);
    
    // Guard: validate data length
    if (combinedArray.byteLength < IV_LENGTH) {
      console.warn('Decryption failed: invalid encrypted data format');
      return '[Encrypted message]';
    }
    
    // Extract IV and encrypted data
    const iv = combinedArray.slice(0, IV_LENGTH);
    const encrypted = combinedArray.slice(IV_LENGTH);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error.message || error);
    // Return user-friendly fallback without exposing crypto errors
    return '[Encrypted message]';
  }
};

// Derive a shared key from user password (for key backup/recovery)
export const deriveKeyFromPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
};

// Generate a salt for key derivation
export const generateSalt = () => {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

// Helper: ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper: Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Key storage management (local only - never sent to server)
const KEY_STORAGE_PREFIX = 'e2e_key_';

export const storeConversationKey = async (conversationId, key) => {
  const exportedKey = await exportKey(key);
  localStorage.setItem(`${KEY_STORAGE_PREFIX}${conversationId}`, exportedKey);
};

export const getStoredConversationKey = async (conversationId) => {
  const stored = localStorage.getItem(`${KEY_STORAGE_PREFIX}${conversationId}`);
  if (!stored) return null;
  return await importKey(stored);
};

export const hasStoredKey = (conversationId) => {
  return localStorage.getItem(`${KEY_STORAGE_PREFIX}${conversationId}`) !== null;
};

// Get or create a conversation key
export const getOrCreateConversationKey = async (conversationId) => {
  let key = await getStoredConversationKey(conversationId);
  if (!key) {
    key = await generateConversationKey();
    await storeConversationKey(conversationId, key);
  }
  return key;
};

// Export all keys for backup (encrypted with user password)
export const exportAllKeys = async (password) => {
  const keys = {};
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey.startsWith(KEY_STORAGE_PREFIX)) {
      const conversationId = storageKey.replace(KEY_STORAGE_PREFIX, '');
      keys[conversationId] = localStorage.getItem(storageKey);
    }
  }
  
  const salt = generateSalt();
  const encryptionKey = await deriveKeyFromPassword(password, salt);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(keys));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    encryptionKey,
    data
  );
  
  return {
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(encrypted),
  };
};

// Import keys from backup
export const importAllKeys = async (backup, password) => {
  const salt = new Uint8Array(base64ToArrayBuffer(backup.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(backup.iv));
  const encrypted = base64ToArrayBuffer(backup.data);
  
  const decryptionKey = await deriveKeyFromPassword(password, salt);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    decryptionKey,
    encrypted
  );
  
  const decoder = new TextDecoder();
  const keys = JSON.parse(decoder.decode(decrypted));
  
  for (const [conversationId, keyData] of Object.entries(keys)) {
    localStorage.setItem(`${KEY_STORAGE_PREFIX}${conversationId}`, keyData);
  }
};

export default {
  generateConversationKey,
  encryptMessage,
  decryptMessage,
  storeConversationKey,
  getStoredConversationKey,
  getOrCreateConversationKey,
  hasStoredKey,
  exportAllKeys,
  importAllKeys,
};
