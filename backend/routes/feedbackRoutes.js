import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  submitFeedback,
  getUserFeedback,
  getFeedbackById,
  getAllFeedback,
  respondToFeedback,
  deleteFeedback,
  getFeedbackStats,
} from '../controllers/feedbackController.js';

const router = express.Router();

// Public routes (protected)
router.post('/', protect, submitFeedback);
router.get('/my-feedback', protect, getUserFeedback);
router.get('/:id', protect, getFeedbackById);

// Admin routes
router.get('/admin/all', protect, getAllFeedback);
router.put('/:id/respond', protect, respondToFeedback);
router.delete('/:id', protect, deleteFeedback);
router.get('/admin/stats', protect, getFeedbackStats);

export default router;
