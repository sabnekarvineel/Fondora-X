import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name profilePhoto role')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name',
        },
      })
      .sort({ updatedAt: -1 });

    // ✅ Build safe preview for sidebar
    const conversationsWithPreview = conversations.map((conv) => {
      let preview = 'New message';

      if (conv.lastMessage) {
        switch (conv.lastMessage.messageType) {
          case 'text':
            preview = '🔒 Encrypted message';
            break;
          case 'image':
            preview = '📷 Photo';
            break;
          case 'video':
            preview = '🎥 Video';
            break;
          default:
            preview = 'New message';
        }
      }

      return {
        ...conv.toObject(),
        lastMessagePreview: preview,
      };
    });

    res.json(conversationsWithPreview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    })
      .populate('participants', 'name profilePhoto role')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name profilePhoto role')
        .populate('lastMessage');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name profilePhoto')
      .populate('receiver', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversation: conversationId });

    res.json({
      messages: messages.reverse(),
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      content,
      messageType,
      imageUrl,
      videoUrl,
      encryptedMediaUrl,
      mediaIv,
      originalFileName,
      mediaMimeType,
      isEncrypted,
      isMediaEncrypted,
    } = req.body;

    // Validate required fields
    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send message in this conversation' });
    }

    const receiver = conversation.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    if (!receiver) {
      return res.status(400).json({ message: 'Invalid receiver in conversation' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver,
      content,
      messageType: messageType || 'text',
      imageUrl: imageUrl || '',
      videoUrl: videoUrl || '',
      encryptedMediaUrl: encryptedMediaUrl || '',
      mediaIv: mediaIv || '',
      originalFileName: originalFileName || '',
      mediaMimeType: mediaMimeType || '',
      isEncrypted: isEncrypted || false,
      isMediaEncrypted: isMediaEncrypted || false,
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePhoto')
      .populate('receiver', 'name profilePhoto');

    console.log(`Message created: ${populatedMessage._id} from ${req.user._id}`);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error.message);
    res.status(500).json({ 
      message: 'Failed to send message',
      error: error.message 
    });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.seen = true;
    message.seenAt = new Date();
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markConversationAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user._id,
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadMessageImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = req.file.path;

    res.json({
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Upload encrypted media (images and videos)
 * Receives pre-encrypted media file from client
 */
export const uploadEncryptedMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { iv, originalName, mimeType } = req.body;

    if (!iv || !mimeType) {
      return res.status(400).json({ message: 'Missing required fields: iv, mimeType' });
    }

    const encryptedUrl = req.file.path;

    res.json({
      message: 'Encrypted media uploaded successfully',
      encryptedUrl,
      iv,
      originalName: originalName || 'media',
      mimeType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMessage:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Edit a message
 * PUT /api/messages/:messageId
 */
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, isEncrypted } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content;
    message.isEncrypted = isEncrypted || false;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name profilePhoto')
      .populate('receiver', 'name profilePhoto');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error in editMessage:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send message to a specific user
 * Used for sharing posts via messages
 * POST body: { recipientId, content, postId (optional) }
 */
export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, postId } = req.body;

    // Validation
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (req.user._id.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      receiver: recipientId,
      content,
      messageType: 'text',
      isEncrypted: false,
      // Optional: Link to post if postId provided
      ...(postId && { postId }),
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate message before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePhoto')
      .populate('receiver', 'name profilePhoto');

    console.log(
      `Shared message created: ${populatedMessage._id} from ${req.user._id} to ${recipientId}`
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Error in sendDirectMessage:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};
