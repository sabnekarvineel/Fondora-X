/**
 * Shared Key Encryption Management
 * Handles per-conversation encryption keys that are shared across all user devices
 */

const KEY_STORAGE_PREFIX = 'e2e_shared_key_';

/**
 * Store shared conversation key locally
 */
export const storeSharedKey = async (conversationId, keyString) => {
  try {
    if (!conversationId || !keyString) {
      throw new Error('Missing conversationId or keyString');
    }
    
    if (typeof keyString !== 'string' || keyString.trim().length === 0) {
      throw new Error('keyString must be a non-empty string');
    }
    
    // Validate the key string is valid base64 before storing
    let keyBuffer;
    try {
      keyBuffer = base64ToArrayBuffer(keyString);
    } catch (decodeError) {
      throw new Error(`Invalid key format (not valid base64): ${decodeError.message}`);
    }
    
    // Validate key length (should be 32 bytes for AES-256)
    if (keyBuffer.byteLength !== 32) {
      throw new Error(`Invalid key length: expected 32 bytes, got ${keyBuffer.byteLength}`);
    }
    
    // Validate the key can be imported
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Re-export and store
    const exported = await window.crypto.subtle.exportKey('raw', key);
    localStorage.setItem(
      `${KEY_STORAGE_PREFIX}${conversationId}`,
      arrayBufferToBase64(exported)
    );
    
    console.log(`Shared key stored for conversation ${conversationId}`);
  } catch (error) {
    console.error('Failed to store shared key:', error);
    throw error;
  }
};

/**
 * Get shared conversation key from localStorage
 */
export const getSharedKey = async (conversationId) => {
  try {
    const stored = localStorage.getItem(`${KEY_STORAGE_PREFIX}${conversationId}`);
    
    if (!stored) {
      console.log(`No shared key found for conversation ${conversationId}`);
      return null;
    }
    
    // Import the key
    const keyBuffer = base64ToArrayBuffer(stored);
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    return key;
  } catch (error) {
    console.error('Failed to get shared key:', error);
    return null;
  }
};

/**
 * Check if shared key exists for conversation
 */
export const hasSharedKey = (conversationId) => {
  try {
    return localStorage.getItem(`${KEY_STORAGE_PREFIX}${conversationId}`) !== null;
  } catch (error) {
    console.error('Error checking shared key:', error);
    return false;
  }
};

/**
 * Initialize shared key for conversation on server
 * First device to message calls this with generated key
 */
export const initializeSharedKeyOnServer = async (conversationId, sharedKeyString, token, apiUrl) => {
  try {
    const response = await fetch(`${apiUrl}/api/encryption/conversation-key/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId,
        sharedKey: sharedKeyString,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Shared key initialized on server:', result);
    return result.data;
  } catch (error) {
    console.error('Failed to initialize shared key on server:', error);
    throw error;
  }
};

/**
 * Retrieve shared key from server for conversation
 */
export const getSharedKeyFromServer = async (conversationId, token, apiUrl) => {
  try {
    const response = await fetch(`${apiUrl}/api/encryption/conversation-key/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Server returned ${response.status} when fetching shared key:`, errorData.message || errorData);
      // 404 means conversation doesn't exist yet, 400 means no key initialized - both are ok, just return null
      if (response.status === 404 || response.status === 400) {
        return null;
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Shared key retrieved from server:', result);
    return result.data.sharedKey;
  } catch (error) {
    console.error('Failed to get shared key from server:', error);
    return null;
  }
};

/**
 * Get or create shared key for conversation
 * Checks local storage first, then server, then generates new
 */
export const getOrCreateSharedKey = async (conversationId, token, apiUrl) => {
  try {
    // Guard: validate inputs
    if (!conversationId || !token || !apiUrl) {
      throw new Error('Missing required parameters: conversationId, token, apiUrl');
    }

    // Check local storage first
    const localKey = await getSharedKey(conversationId);
    if (localKey) {
      console.log(`Using local shared key for conversation ${conversationId}`);
      return localKey;
    }

    // Try to get from server
    const serverKeyString = await getSharedKeyFromServer(conversationId, token, apiUrl);
    if (serverKeyString) {
      // Store locally and return
      await storeSharedKey(conversationId, serverKeyString);
      console.log(`Retrieved and stored shared key from server for conversation ${conversationId}`);
      const key = await getSharedKey(conversationId);
      return key;
    }

    // Generate new key
    console.log(`Generating new shared key for conversation ${conversationId}`);
    const newKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    const exported = await window.crypto.subtle.exportKey('raw', newKey);
    const keyString = arrayBufferToBase64(exported);

    // Store locally first (critical for offline scenarios)
    await storeSharedKey(conversationId, keyString);
    console.log(`Stored new shared key locally for conversation ${conversationId}`);

    // Initialize on server - with retry logic
    try {
      const result = await initializeSharedKeyOnServer(conversationId, keyString, token, apiUrl);
      console.log(`Successfully synced shared key to server for conversation ${conversationId}:`, result);
    } catch (error) {
      console.warn(`Failed to sync shared key to server for conversation ${conversationId}, continuing with local key:`, error.message || error);
      // Continue anyway - key is stored locally and can be used for encryption/decryption
      // Next sync attempt will happen when the user sends their first message or refreshes
    }

    return newKey;
  } catch (error) {
    console.error('Failed to get or create shared key:', error);
    throw error;
  }
};

/**
 * Batch retrieve shared keys for multiple conversations
 */
export const getSharedKeysBatch = async (conversationIds, token, apiUrl) => {
  try {
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return {};
    }

    const response = await fetch(`${apiUrl}/api/encryption/conversation-keys/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationIds }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    const keysMap = {};

    // Store each key locally
    for (const keyData of result.data) {
      await storeSharedKey(keyData.conversationId, keyData.sharedKey);
      keysMap[keyData.conversationId] = keyData.sharedKey;
    }

    console.log(`Retrieved ${result.data.length} shared keys from server`);
    return keysMap;
  } catch (error) {
    console.error('Failed to get shared keys batch:', error);
    return {};
  }
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

export default {
  getOrCreateSharedKey,
  getSharedKey,
  storeSharedKey,
  hasSharedKey,
  getSharedKeyFromServer,
  initializeSharedKeyOnServer,
  getSharedKeysBatch,
};
