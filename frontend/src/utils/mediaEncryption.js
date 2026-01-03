/**
 * Media Encryption Utility for Images and Videos
 * Uses AES-256-GCM for encrypting/decrypting binary media files
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Encrypt binary media data (images/videos)
 * @param {ArrayBuffer} mediaBuffer - Binary media data
 * @param {CryptoKey} encryptionKey - AES-256-GCM key
 * @returns {Promise<{encrypted: string, iv: string}>} Base64 encoded encrypted data and IV
 */
export const encryptMedia = async (mediaBuffer, encryptionKey) => {
  try {
    // Generate random IV for this encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      encryptionKey,
      mediaBuffer
    );

    return {
      encrypted: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv.buffer),
    };
  } catch (error) {
    console.error('Media encryption failed:', error);
    throw new Error('Failed to encrypt media');
  }
};

/**
 * Decrypt binary media data (images/videos)
 * @param {string} encryptedBase64 - Base64 encoded encrypted data
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {CryptoKey} encryptionKey - AES-256-GCM key
 * @returns {Promise<ArrayBuffer>} Decrypted binary media data
 */
export const decryptMedia = async (encryptedBase64, ivBase64, encryptionKey) => {
  try {
    // Guard: validate inputs
    if (!encryptedBase64 || !ivBase64 || !encryptionKey) {
      throw new Error('Missing required decryption parameters');
    }

    // Guard: validate types
    if (typeof encryptedBase64 !== 'string' || typeof ivBase64 !== 'string') {
      throw new Error('Invalid data format: expected strings');
    }

    if (typeof encryptionKey !== 'object' || !encryptionKey.type) {
      throw new Error('Invalid encryption key object');
    }

    let encrypted, ivBuffer;
    try {
      encrypted = base64ToArrayBuffer(encryptedBase64);
      ivBuffer = base64ToArrayBuffer(ivBase64);
    } catch (parseError) {
      throw new Error(`Invalid base64 format: ${parseError.message}`);
    }

    const iv = new Uint8Array(ivBuffer);

    // Guard: validate data
    if (!encrypted || encrypted.byteLength === 0) {
      throw new Error('Invalid encrypted media data');
    }
    if (iv.byteLength !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.byteLength}`);
    }

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      encryptionKey,
      encrypted
    );

    return decrypted;
  } catch (error) {
    // Distinguish between different error types for better logging
    if (error.name === 'OperationError') {
      console.warn(
        'Media decryption OperationError: The cryptographic operation failed. ' +
        'This typically means the encryption key has changed or the media is corrupted. ' +
        'Media will not be displayed.',
        { errorMessage: error.message }
      );
    } else {
      console.error('Media decryption failed:', error.message || error);
    }
    // Re-throw so the caller can decide how to handle (fallback UI)
    throw error;
  }
};

/**
 * Read file as ArrayBuffer
 * @param {File} file - File object
 * @returns {Promise<ArrayBuffer>}
 */
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Convert ArrayBuffer to Blob for creating URLs
 * @param {ArrayBuffer} buffer - Binary data
 * @param {string} mimeType - MIME type of the media
 * @returns {Blob}
 */
export const arrayBufferToBlob = (buffer, mimeType = 'application/octet-stream') => {
  return new Blob([new Uint8Array(buffer)], { type: mimeType });
};

/**
 * Create object URL from decrypted media
 * @param {ArrayBuffer} decryptedBuffer - Decrypted binary data
 * @param {string} mimeType - MIME type
 * @returns {string} Object URL
 */
export const createMediaURL = (decryptedBuffer, mimeType) => {
  const blob = arrayBufferToBlob(decryptedBuffer, mimeType);
  return URL.createObjectURL(blob);
};

/**
 * Clean up object URL
 * @param {string} objectUrl - Object URL to revoke
 */
export const revokeMediaURL = (objectUrl) => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
};

/**
 * Encrypt and upload media file
 * @param {File} file - Media file to encrypt and upload
 * @param {CryptoKey} encryptionKey - Encryption key
 * @param {string} token - Auth token
 * @param {string} uploadEndpoint - Backend upload endpoint
 * @returns {Promise<{encryptedData: string, iv: string, originalName: string, mimeType: string}>}
 */
export const encryptAndUploadMedia = async (
  file,
  encryptionKey,
  token,
  uploadEndpoint
) => {
  try {
    // Read file as ArrayBuffer
    const fileBuffer = await readFileAsArrayBuffer(file);

    // Encrypt the media
    const { encrypted, iv } = await encryptMedia(fileBuffer, encryptionKey);

    // Prepare FormData for upload
    const formData = new FormData();
    const encryptedBlob = new Blob([base64ToArrayBuffer(encrypted)], {
      type: 'application/octet-stream',
    });
    formData.append('media', encryptedBlob, `${file.name}.enc`);
    formData.append('iv', iv);
    formData.append('originalName', file.name);
    formData.append('mimeType', file.type);

    // Upload encrypted media
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    return {
      encryptedUrl: data.encryptedUrl,
      iv,
      originalName: file.name,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Media encryption and upload failed:', error);
    throw new Error('Failed to encrypt and upload media');
  }
};

/**
 * Download and decrypt media
 * @param {string} encryptedUrl - URL to encrypted media
 * @param {string} iv - IV for decryption
 * @param {CryptoKey} encryptionKey - Encryption key
 * @param {string} mimeType - Original MIME type
 * @returns {Promise<string>} Object URL for decrypted media
 */
export const downloadAndDecryptMedia = async (
  encryptedUrl,
  iv,
  encryptionKey,
  mimeType
) => {
  try {
    // Guard: validate inputs
    if (!encryptedUrl || !iv || !encryptionKey) {
      throw new Error('Missing required parameters for media decryption');
    }

    if (typeof encryptedUrl !== 'string' || typeof iv !== 'string') {
      throw new Error('Invalid parameter types');
    }

    if (typeof encryptionKey !== 'object' || !encryptionKey.type) {
      throw new Error('Invalid encryption key');
    }

    // Fetch encrypted media
    const response = await fetch(encryptedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch encrypted media: ${response.statusText}`);
    }

    const encryptedBuffer = await response.arrayBuffer();
    
    // Guard: validate fetched data
    if (!encryptedBuffer || encryptedBuffer.byteLength === 0) {
      throw new Error('Downloaded media is empty');
    }

    const encryptedBase64 = arrayBufferToBase64(encryptedBuffer);

    // Decrypt media
    const decryptedBuffer = await decryptMedia(encryptedBase64, iv, encryptionKey);

    // Guard: validate decrypted data
    if (!decryptedBuffer || decryptedBuffer.byteLength === 0) {
      throw new Error('Decrypted media is empty');
    }

    // Create object URL
    return createMediaURL(decryptedBuffer, mimeType);
  } catch (error) {
    console.error('Media download and decryption failed:', error.message || error);
    throw error;
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

// Helper: Base64 to Uint8Array (for direct blob creation)
const base64ToUint8Array = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export default {
  encryptMedia,
  decryptMedia,
  readFileAsArrayBuffer,
  arrayBufferToBlob,
  createMediaURL,
  revokeMediaURL,
  encryptAndUploadMedia,
  downloadAndDecryptMedia,
};
