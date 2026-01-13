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
        if (!conversationId || typeof conversationId !== 'string') {
            throw new Error('Invalid conversationId');
        }

        const storageKey = `${KEY_STORAGE_PREFIX}${conversationId}`;
        const stored = localStorage.getItem(storageKey);

        if (!stored) {
            console.log(`No shared key found for conversation ${conversationId}`);
            return null;
        }

        if (typeof stored !== 'string' || stored.trim().length === 0) {
            console.warn(`Invalid shared key format for conversation ${conversationId}`);
            localStorage.removeItem(storageKey);
            return null;
        }

        // Import the key
        const keyBuffer = base64ToArrayBuffer(stored);

        // Validate key length (should be 32 bytes for AES-256)
        if (keyBuffer.byteLength !== 32) {
            console.error(`Invalid key length for conversation ${conversationId}: ${keyBuffer.byteLength} bytes`);
            localStorage.removeItem(storageKey);
            return null;
        }

        const key = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        console.log(`✅ Retrieved shared key for conversation ${conversationId} from localStorage`);
        return key;
    } catch (error) {
        console.error('Failed to get shared key:', error);
        // Clear corrupted key
        try {
            localStorage.removeItem(`${KEY_STORAGE_PREFIX}${conversationId}`);
        } catch (e) {
            // Ignore errors clearing corrupted key
        }
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
 * INCLUDES: Auto re-sync from server to prevent key loss over time
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
            console.log(`✅ Using local shared key for conversation ${conversationId}`);
            // Even if we have local key, attempt server sync in background to prevent key loss
            syncKeyWithServerBackground(conversationId, token, apiUrl).catch(() => {
                // Silent fail for background sync
            });
            return localKey;
        }

        console.log(`No local key found for conversation ${conversationId}, fetching from server...`);

        // Try to get from server
        const serverKeyString = await getSharedKeyFromServer(conversationId, token, apiUrl);
        if (serverKeyString) {
            // Store locally and return
            await storeSharedKey(conversationId, serverKeyString);
            console.log(`✅ Retrieved and stored shared key from server for conversation ${conversationId}`);
            const key = await getSharedKey(conversationId);
            return key;
        }

        // Generate new key
        console.log(`🔐 Generating new shared key for conversation ${conversationId}`);
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
        console.log(`✅ Stored new shared key locally for conversation ${conversationId}`);

        // Initialize on server - with retry logic
        try {
            const result = await initializeSharedKeyOnServer(conversationId, keyString, token, apiUrl);
            console.log(`✅ Successfully synced shared key to server for conversation ${conversationId}:`, result);
        } catch (error) {
            console.warn(`⚠️ Failed to sync shared key to server for conversation ${conversationId}, continuing with local key:`, error.message || error);
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
 * Background sync to ensure server always has latest key
 * Prevents key loss due to browser storage issues or cache clearing
 */
const syncKeyWithServerBackground = async (conversationId, token, apiUrl) => {
    try {
        const stored = localStorage.getItem(`${KEY_STORAGE_PREFIX}${conversationId}`);

        // Only sync if we have a local key
        if (!stored) {
            return;
        }

        // Check if server has this key already
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

        if (response.ok) {
            const result = await response.json();
            // Server already has the key, no need to sync
            if (result.data?.isNew === false) {
                console.log(`✅ Server already has key for conversation ${conversationId}`);
                return;
            }
        }

        // Server doesn't have key, sync ours
        if (stored) {
            console.log(`🔄 Background syncing key for conversation ${conversationId}...`);
            await initializeSharedKeyOnServer(conversationId, stored, token, apiUrl);
            console.log(`✅ Background sync complete for conversation ${conversationId}`);
        }
    } catch (error) {
        // Silent background error - don't interrupt user
        console.warn(`Background sync attempted for ${conversationId}:`, error.message);
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
