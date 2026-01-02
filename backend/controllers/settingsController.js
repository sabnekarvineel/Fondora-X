import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logger function for audit trail
const logDeactivation = (userId, email, timestamp) => {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'account_deactivations.log');
  const logEntry = `[${timestamp}] User ID: ${userId} | Email: ${email} | Action: Account Deactivated\n`;

  fs.appendFileSync(logFile, logEntry, 'utf8');
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notificationsEnabled = !user.notificationsEnabled;
    await user.save();

    res.json({
      message: `Notifications ${user.notificationsEnabled ? 'enabled' : 'disabled'}`,
      notificationsEnabled: user.notificationsEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please provide your password to deactivate account' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    const userId = req.user._id;

    // Get all posts by user to handle cascading deletes
    const userPosts = await Post.find({ author: userId });

    // Delete comments from posts by other users that include this user's comments
    await Post.updateMany(
      {},
      {
        $pull: {
          comments: { user: userId },
          likes: userId,
          shares: userId,
          taggedUsers: userId,
        },
      }
    );

    // Delete all posts created by the user
    await Post.deleteMany({ author: userId });

    // Delete all messages sent or received by the user
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Delete conversations where user is a participant
    await Conversation.deleteMany({
      participants: { $in: [userId] },
    });

    // Deactivate the account
    user.isActive = false;
    await user.save();

    // Log the deactivation
    logDeactivation(userId, user.email, new Date().toISOString());

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'Account reactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationsEnabled isActive');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      notificationsEnabled: user.notificationsEnabled,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
