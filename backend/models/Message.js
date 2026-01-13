import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    encryptedMediaUrl: {
      type: String,
      default: '',
    },
    mediaIv: {
      type: String,
      default: '',
    },
    originalFileName: {
      type: String,
      default: '',
    },
    mediaMimeType: {
      type: String,
      default: '',
    },
    isMediaEncrypted: {
      type: Boolean,
      default: false,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

// Pre-save middleware to ensure isEncrypted flag is set correctly
messageSchema.pre('save', function(next) {
  // If message has content, ensure it's marked as encrypted when appropriate
  // If no isEncrypted value is explicitly set and content exists, default to true
  // (since frontend should always send encrypted messages)
  if (this.isNew && this.content && this.isEncrypted === false) {
    // Only log if it's explicitly being saved as unencrypted
    console.warn(`Message ${this._id} saved as unencrypted - this may be a security issue`);
  }
  next();
});

export default mongoose.model('Message', messageSchema);
