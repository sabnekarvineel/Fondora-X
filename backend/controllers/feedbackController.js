import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const { userId, userEmail, type, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (!['bug', 'feature', 'general'].includes(type)) {
      return res.status(400).json({ message: 'Invalid feedback type' });
    }

    const feedback = new Feedback({
      userId: userId || req.user?._id,
      userEmail: userEmail || req.user?.email,
      type,
      subject,
      message,
      status: 'new',
    });

    // 💾 Save feedback first
    try {
      await feedback.save();
    } catch (saveErr) {
      console.error('Error saving feedback:', saveErr.message);
      return res.status(500).json({ message: 'Failed to save feedback' });
    }

    // 📧 Send to EMAIL_USER (non-blocking, don't crash if email fails)
    if (process.env.EMAIL_USER) {
      sendEmail({
        to: process.env.EMAIL_USER,
        subject: `New Feedback (${type.toUpperCase()})`,
        html: `
          <h3>New Feedback</h3>
          <p><b>From:</b> ${userEmail || req.user?.email || 'Unknown'}</p>
          <p><b>Type:</b> ${type}</p>
          <p><b>Subject:</b> ${subject}</p>
          <p>${message}</p>
        `,
      }).catch((emailErr) => {
        console.warn('Failed to send feedback email:', emailErr.message);
        // Don't crash - email is optional
      });
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error in submitFeedback:', error.message);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

// Get user's feedback
export const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user._id;

    const feedback = await Feedback.find({ userId })
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback by ID
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id)
      .populate('userId', 'name email')
      .populate('respondedBy', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user is owner or admin
    if (feedback.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this feedback' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all feedback
export const getAllFeedback = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all feedback' });
    }

    const { type, status } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    const feedback = await Feedback.find(query)
      .populate('userId', 'name email')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Respond to feedback
export const respondToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status } = req.body;

    // Check if user is admin
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can respond to feedback' });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (response) feedback.response = response;
    if (status) feedback.status = status;
    feedback.respondedBy = req.user._id;

    await feedback.save();

    res.json({
      message: 'Feedback updated successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete feedback' });
    }

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback statistics
export const getFeedbackStats = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view feedback stats' });
    }

    const totalFeedback = await Feedback.countDocuments();
    const byType = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const byStatus = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      totalFeedback,
      byType,
      byStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
