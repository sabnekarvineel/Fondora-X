import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getEngagementDashboard,
  getPostAnalytics,
  getProfileAnalytics,
} from '../controllers/engagementController.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/dashboard', authenticateToken, getEngagementDashboard);
router.get('/post/:postId', authenticateToken, getPostAnalytics);
router.get('/profile', authenticateToken, getProfileAnalytics);

export default router;
