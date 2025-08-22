import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  contestId: string;
  userId: string;
  username: string;
  userImage?: string;
  message: string;
  timestamp: Date;
  isDeleted: boolean;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  contestId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userImage: {
    type: String
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Compound index for efficient querying
ChatMessageSchema.index({ contestId: 1, timestamp: -1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
