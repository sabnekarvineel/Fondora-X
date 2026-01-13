import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

/**
 * Sync encryption keys across devices
 * Frontend uploads encrypted keys, backend stores them
 * POST /api/encryption/sync-keys
 * Body: { masterKeyEncrypted, masterKeySalt, masterKeyIv, conversationKeys }
 */
export const syncEncryptionKeys = async (req, res) => {
  try {
    const userId = req.user._id;
    const { masterKeyEncrypted, masterKeySalt, masterKeyIv, conversationKeys } = req.body;

    // Validate required fields
    if (!masterKeyEncrypted || !masterKeySalt || !masterKeyIv) {
      return res.status(400).json({
        success: false,
        message: 'Missing required encryption fields: masterKeyEncrypted, masterKeySalt, masterKeyIv',
      });
    }

    // Update user's encryption keys
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'encryptionKeys.masterKeyEncrypted': masterKeyEncrypted,
        'encryptionKeys.masterKeySalt': masterKeySalt,
        'encryptionKeys.masterKeyIv': masterKeyIv,
        'encryptionKeys.keysSyncedAt': new Date(),
        ...(conversationKeys && { 'encryptionKeys.conversationKeys': conversationKeys }),
      },
      { new: true }
    );

    console.log(`Encryption keys synced for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Encryption keys synced successfully',
      data: {
        keysSyncedAt: user.encryptionKeys.keysSyncedAt,
        conversationKeysCount: user.encryptionKeys.conversationKeys?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error syncing encryption keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync encryption keys',
      error: error.message,
    });
  }
};

/**
 * Retrieve user's synced encryption keys
 * GET /api/encryption/sync-keys
 */
export const getEncryptionKeys = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'encryptionKeys -password'
    );

    if (!user || !user.encryptionKeys || !user.encryptionKeys.masterKeyEncrypted) {
      return res.status(404).json({
        success: false,
        message: 'No synced encryption keys found. Please set up encryption on your device.',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Encryption keys retrieved successfully',
      data: {
        masterKeyEncrypted: user.encryptionKeys.masterKeyEncrypted,
        masterKeySalt: user.encryptionKeys.masterKeySalt,
        masterKeyIv: user.encryptionKeys.masterKeyIv,
        conversationKeys: user.encryptionKeys.conversationKeys || [],
        keysSyncedAt: user.encryptionKeys.keysSyncedAt,
      },
    });
  } catch (error) {
    console.error('Error retrieving encryption keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve encryption keys',
      error: error.message,
    });
  }
};

/**
 * Add a new conversation key to sync
 * POST /api/encryption/conversation-key
 * Body: { conversationId, encryptedKey }
 */
export const addConversationKey = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, encryptedKey } = req.body;

    if (!conversationId || !encryptedKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: conversationId, encryptedKey',
      });
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add key for this conversation',
      });
    }

    // Remove existing key for this conversation if any
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          'encryptionKeys.conversationKeys': { conversationId },
        },
      }
    );

    // Add new key
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          'encryptionKeys.conversationKeys': {
            conversationId,
            encryptedKey,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    console.log(`Conversation key added for user ${userId}, conversation ${conversationId}`);

    res.status(201).json({
      success: true,
      message: 'Conversation key added successfully',
      data: {
        conversationId,
        addedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error adding conversation key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add conversation key',
      error: error.message,
    });
  }
};

/**
 * Get keys for specific conversations
 * GET /api/encryption/conversation-keys?conversationIds=id1,id2
 */
export const getConversationKeys = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationIds } = req.query;

    if (!conversationIds) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: conversationIds',
      });
    }

    const ids = conversationIds.split(',').filter(id => id.trim());

    const user = await User.findById(userId).select('encryptionKeys.conversationKeys');

    const requestedKeys = user.encryptionKeys.conversationKeys.filter(
      (k) => ids.includes(k.conversationId.toString())
    );

    res.status(200).json({
      success: true,
      message: 'Conversation keys retrieved',
      data: requestedKeys,
    });
  } catch (error) {
    console.error('Error retrieving conversation keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation keys',
      error: error.message,
    });
  }
};

/**
 * Clear all encryption keys (use with caution)
 * DELETE /api/encryption/keys
 */
export const clearEncryptionKeys = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
      userId,
      {
        'encryptionKeys.masterKeyEncrypted': '',
        'encryptionKeys.masterKeySalt': '',
        'encryptionKeys.masterKeyIv': '',
        'encryptionKeys.conversationKeys': [],
        'encryptionKeys.keysSyncedAt': null,
      }
    );

    console.log(`Encryption keys cleared for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'All encryption keys have been cleared',
    });
  } catch (error) {
    console.error('Error clearing encryption keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear encryption keys',
      error: error.message,
    });
  }
};
