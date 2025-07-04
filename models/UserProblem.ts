import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProblem extends Document {
  userId: string;
  problemId: string; // Reference to Problem model
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks';
  status: 'not_started' | 'attempted' | 'solved' | 'solved_optimally';
  submissionCount: number;
  bestSubmissionTime?: number; // Best time in milliseconds
  bestSubmissionMemory?: number; // Best memory usage in MB
  lastAttempted: Date;
  solvedAt?: Date;
  notes?: string; // User's personal notes
  rating?: number; // User's rating after solving (if applicable)
  tags?: string[]; // User's custom tags
  difficulty?: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

const UserProblemSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  problemId: {
    type: String,
    required: true,
    index: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ['codeforces', 'codechef', 'leetcode', 'geeksforgeeks'],
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['not_started', 'attempted', 'solved', 'solved_optimally'],
    default: 'not_started',
    index: true,
  },
  submissionCount: {
    type: Number,
    default: 0,
  },
  bestSubmissionTime: {
    type: Number,
  },
  bestSubmissionMemory: {
    type: Number,
  },
  lastAttempted: {
    type: Date,
    default: Date.now,
  },
  solvedAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
  rating: {
    type: Number,
  },
  tags: [{
    type: String,
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced'],
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient querying
UserProblemSchema.index({ userId: 1, platform: 1 });
UserProblemSchema.index({ userId: 1, status: 1 });
UserProblemSchema.index({ userId: 1, difficulty: 1 });
UserProblemSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.models.UserProblem || mongoose.model<IUserProblem>('UserProblem', UserProblemSchema); 