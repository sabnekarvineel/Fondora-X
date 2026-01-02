import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessageAsSeen,
  markConversationAsSeen,
  uploadMessageImage,
  uploadEncryptedMedia,
  sendDirectMessage,
  deleteMessage,
  editMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Create a separate multer instance for encrypted media with 'raw' resource type
const encryptedMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'techconhub/encrypted',
    resource_type: 'raw', // Accept any file format
  },
});

const encryptedMediaUpload = multer({
  storage: encryptedMediaStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for large videos
  },
});

router.get('/conversations', protect, getConversations);
router.get('/conversation/:userId', protect, getOrCreateConversation);
router.get('/conversation/:conversationId/messages', protect, getMessages);
router.post('/send', protect, sendMessage);
router.post('/send-direct', protect, sendDirectMessage); // For sharing posts via messages
router.put('/message/:messageId/seen', protect, markMessageAsSeen);
router.put('/conversation/:conversationId/seen', protect, markConversationAsSeen);
router.post('/upload/image', protect, upload.single('image'), uploadMessageImage);
router.post('/upload/encrypted-media', protect, encryptedMediaUpload.single('media'), uploadEncryptedMedia);
router.delete('/:messageId', protect, deleteMessage);
router.put('/:messageId', protect, editMessage);

export default router;
