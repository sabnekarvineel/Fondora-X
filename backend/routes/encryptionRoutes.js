import express from 'express';
import {
  syncEncryptionKeys,
  getEncryptionKeys,
  addConversationKey,
  getConversationKeys,
  clearEncryptionKeys,
  initializeConversationKey,
  getConversationKeysBatch,
} from '../controllers/encryptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * Sync encrypted keys across devices
 * POST /api/encryption/sync-keys
 */
router.post('/sync-keys', syncEncryptionKeys);

/**
 * Retrieve synced encryption keys
 * GET /api/encryption/sync-keys
 */
router.get('/sync-keys', getEncryptionKeys);

/**
 * Initialize or get shared conversation key (cross-device)
 * POST /api/encryption/conversation-key/init
 */
router.post('/conversation-key/init', initializeConversationKey);

/**
 * Get shared keys for multiple conversations (batch)
 * POST /api/encryption/conversation-keys/batch
 */
router.post('/conversation-keys/batch', getConversationKeysBatch);

/**
 * Add a new conversation key (deprecated)
 * POST /api/encryption/conversation-key
 */
router.post('/conversation-key', addConversationKey);

/**
 * Get keys for specific conversations
 * GET /api/encryption/conversation-keys?conversationIds=id1,id2
 */
router.get('/conversation-keys', getConversationKeys);

/**
 * Clear all keys (use with caution)
 * DELETE /api/encryption/keys
 */
router.delete('/keys', clearEncryptionKeys);

export default router;
