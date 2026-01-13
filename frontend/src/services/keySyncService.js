/**
 * Key Sync Service
 * Handles automatic encryption key sync on login across devices
 */

import {
  syncKeysWithServer,
  retrieveKeysFromServer,
  restoreKeysFromServerBackup,
} from '../utils/encryption.js';

const API = import.meta.env.VITE_API_URL;

/**
 * On login: Sync keys to server if not already synced
 * This runs silently in background
 */
export const syncKeysOnLogin = async (password, token) => {
  try {
    console.log('Attempting to sync encryption keys to server...');
    
    const result = await syncKeysWithServer(password, API, token);
    
    console.log('Successfully synced keys to server:', result);
    return { success: true, message: 'Keys synced successfully' };
  } catch (error) {
    console.error('Failed to sync keys to server:', error);
    // Don't throw - this is a background operation
    return { success: false, message: error.message };
  }
};

/**
 * On login on new device: Attempt to restore keys from server
 * Requires password to decrypt master key
 */
export const restoreKeysOnNewDevice = async (token) => {
  try {
    console.log('Checking for synced keys on server...');
    
    const serverKeys = await retrieveKeysFromServer(API, token);
    
    if (!serverKeys || !serverKeys.masterKeyEncrypted) {
      console.log('No synced keys found on server');
      return { success: false, hasKeys: false, message: 'No synced keys found' };
    }
    
    console.log('Found synced keys on server, user needs to enter password to restore');
    
    return {
      success: true,
      hasKeys: true,
      message: 'Synced keys found on server',
      serverKeys: serverKeys,
    };
  } catch (error) {
    console.error('Failed to retrieve keys from server:', error);
    return { success: false, hasKeys: false, message: error.message };
  }
};

/**
 * Restore keys from server backup using password
 */
export const restoreKeysWithPassword = async (password, serverKeys) => {
  try {
    if (!serverKeys || !serverKeys.masterKeyEncrypted) {
      throw new Error('Invalid server keys data');
    }

    console.log('Restoring encryption keys with password...');
    
    await restoreKeysFromServerBackup(password, serverKeys);
    
    console.log('Successfully restored encryption keys');
    return { success: true, message: 'Keys restored successfully' };
  } catch (error) {
    console.error('Failed to restore keys with password:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check if device has local encryption keys
 */
export const hasLocalEncryptionKeys = () => {
  try {
    // Check if any encryption keys exist in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('e2e_key_')) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking local keys:', error);
    return false;
  }
};
