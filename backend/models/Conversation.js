import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // 🔐 Shared encryption key for cross-device message decryption
    // This is the base64-encoded conversation key that all devices use
    // Generated once on first message in this conversation
    sharedEncryptionKey: {
      type: String,
      default: '',
    },
    // Tracks if encryption key has been initialized
    encryptionKeyInitialized: {
      type: Boolean,
      default: false,
    },
    // When the shared key was created
    encryptionKeyCreatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
