import express from 'express';
import {
  createFundingRequest,
  getFundingRequests,
  getFundingRequest,
  getMyFundingRequests,
  getUserFundingRequests,
  updateFundingRequest,
  deleteFundingRequest,
} from '../controllers/fundingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createFundingRequest);
router.get('/my-requests', protect, getMyFundingRequests);
router.get('/user/:userId', getUserFundingRequests);
router.get('/', protect, getFundingRequests);
router.get('/:id', protect, getFundingRequest);
router.put('/:id', protect, updateFundingRequest);
router.delete('/:id', protect, deleteFundingRequest);

export default router;
