import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  preferences: {
    codeforces: boolean;
    codechef: boolean;
    leetcode: boolean;
    geeksforgeeks: boolean;
    emailNotifications: boolean;
    reminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  username: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  preferences: {
    codeforces: {
      type: Boolean,
      default: true,
    },
    codechef: {
      type: Boolean,
      default: true,
    },
    leetcode: {
      type: Boolean,
      default: true,
    },
    geeksforgeeks: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: false,
    },
    reminders: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Index for efficient querying
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 