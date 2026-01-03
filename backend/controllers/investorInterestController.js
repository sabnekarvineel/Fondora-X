import InvestorInterest from '../models/InvestorInterest.js';
import FundingRequest from '../models/FundingRequest.js';
import { createNotification } from './notificationController.js';
import { getIO } from '../socket/socketHandler.js';

export const expressInterest = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'investor') {
      return res.status(403).json({ message: 'Only investors can express interest' });
    }

    const { fundingRequestId, message, proposedAmount, proposedEquity, terms } = req.body;

    // Guard: Validate required fields
    if (!fundingRequestId) {
      return res.status(400).json({ message: 'Funding request ID is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const fundingRequest = await FundingRequest.findById(fundingRequestId);

    if (!fundingRequest) {
      return res.status(404).json({ message: 'Funding request not found' });
    }

    // Guard: Validate funding request has required fields
    if (!fundingRequest.startup) {
      return res.status(400).json({ message: 'Funding request data is incomplete' });
    }

    if (fundingRequest.status !== 'open') {
      return res.status(400).json({ message: 'This funding request is no longer open' });
    }

    const existingInterest = await InvestorInterest.findOne({
      fundingRequest: fundingRequestId,
      investor: req.user._id,
    });

    if (existingInterest) {
      return res.status(400).json({ message: 'You have already expressed interest in this funding request' });
    }

    const interest = await InvestorInterest.create({
      fundingRequest: fundingRequestId,
      investor: req.user._id,
      message: message.trim(),
      proposedAmount: proposedAmount || undefined,
      proposedEquity: proposedEquity || undefined,
      terms: terms || undefined,
    });

    // Guard: Check if interest was created successfully
    if (!interest || !interest._id) {
      return res.status(500).json({ message: 'Failed to create interest record' });
    }

    fundingRequest.interests.push(interest._id);
    await fundingRequest.save();

    const populatedInterest = await InvestorInterest.findById(interest._id)
      .populate('investor', 'name profilePhoto email investorProfile')
      .populate('fundingRequest', 'title fundingAmount');

    // Guard: Ensure notification data is valid before creating notification
    if (fundingRequest.startup && req.user.name && fundingRequest.title) {
      const notification = await createNotification({
        recipient: fundingRequest.startup,
        sender: req.user._id,
        type: 'investor_interest',
        message: `${req.user.name} expressed interest in your funding request: ${fundingRequest.title}`,
        link: `/funding/${fundingRequestId}`,
      });

      if (notification) {
        const io = getIO();
        io.to(fundingRequest.startup.toString()).emit('newNotification', notification);
      }
    }

    res.status(201).json(populatedInterest);
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ message: error.message || 'Failed to express interest' });
  }
};

export const getMyInterests = async (req, res) => {
  try {
    // Guard: Validate user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const interests = await InvestorInterest.find({ investor: req.user._id })
      .populate('fundingRequest')
      .populate({
        path: 'fundingRequest',
        populate: {
          path: 'startup',
          select: 'name profilePhoto startupProfile',
        },
      })
      .sort({ createdAt: -1 });

    // Guard: Filter out interests with incomplete funding request data
    const validInterests = interests.filter(interest => 
      interest && interest.fundingRequest && interest.fundingRequest._id
    );

    res.json(validInterests);
  } catch (error) {
    console.error('Get my interests error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getFundingInterests = async (req, res) => {
  try {
    // Guard: Validate user and params
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.params.fundingRequestId) {
      return res.status(400).json({ message: 'Funding request ID is required' });
    }

    const fundingRequest = await FundingRequest.findById(req.params.fundingRequestId);

    if (!fundingRequest) {
      return res.status(404).json({ message: 'Funding request not found' });
    }

    // Guard: Validate funding request has startup before accessing
    if (!fundingRequest.startup) {
      return res.status(400).json({ message: 'Funding request data is incomplete' });
    }

    if (fundingRequest.startup.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these interests' });
    }

    const interests = await InvestorInterest.find({ fundingRequest: req.params.fundingRequestId })
      .populate('investor', 'name profilePhoto email investorProfile')
      .sort({ createdAt: -1 });

    // Guard: Filter out invalid interests
    const validInterests = interests.filter(interest => 
      interest && interest._id && interest.investor
    );

    res.json(validInterests);
  } catch (error) {
    console.error('Get funding interests error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateInterestStatus = async (req, res) => {
  try {
    // Guard: Validate inputs
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Interest ID is required' });
    }

    if (!req.body.status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const { status, meetingDate, notes } = req.body;
    const interest = await InvestorInterest.findById(req.params.id).populate('fundingRequest');

    if (!interest) {
      return res.status(404).json({ message: 'Interest not found' });
    }

    // Guard: Validate interest has required fields
    if (!interest.fundingRequest || !interest.fundingRequest.startup) {
      return res.status(400).json({ message: 'Interest data is incomplete' });
    }

    if (!interest.investor) {
      return res.status(400).json({ message: 'Interest investor data is missing' });
    }

    const isStartup = interest.fundingRequest.startup.toString() === req.user._id.toString();
    const isInvestor = interest.investor.toString() === req.user._id.toString();

    if (!isStartup && !isInvestor) {
      return res.status(403).json({ message: 'Not authorized to update this interest' });
    }

    if (status) {
      interest.status = status;
    }

    if (meetingDate) {
      interest.meetingDate = meetingDate;
    }

    if (notes) {
      interest.notes = notes;
    }

    await interest.save();

    const recipientId = isStartup ? interest.investor : interest.fundingRequest.startup;

    // Guard: Only create notification if recipient exists
    if (recipientId && interest.fundingRequest._id) {
      const notification = await createNotification({
        recipient: recipientId,
        sender: req.user._id,
        type: 'investor_interest',
        message: `Interest status updated to: ${status}`,
        link: `/funding/${interest.fundingRequest._id}`,
      });

      if (notification) {
        const io = getIO();
        io.to(recipientId.toString()).emit('newNotification', notification);
      }
    }

    res.json(interest);
  } catch (error) {
    console.error('Update interest status error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteInterest = async (req, res) => {
  try {
    // Guard: Validate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Interest ID is required' });
    }

    const interest = await InvestorInterest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({ message: 'Interest not found' });
    }

    // Guard: Validate interest has investor before accessing
    if (!interest.investor) {
      return res.status(400).json({ message: 'Interest data is incomplete' });
    }

    if (interest.investor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this interest' });
    }

    // Guard: Ensure funding request exists before updating
    if (interest.fundingRequest) {
      await FundingRequest.findByIdAndUpdate(interest.fundingRequest, {
        $pull: { interests: interest._id },
      });
    }

    await interest.deleteOne();

    res.json({ message: 'Interest withdrawn successfully' });
  } catch (error) {
    console.error('Delete interest error:', error);
    res.status(500).json({ message: error.message });
  }
};
