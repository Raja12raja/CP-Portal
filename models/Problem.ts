import mongoose, { Schema, Document } from 'mongoose';

export interface IProblem extends Document {
  title: string;
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks';
  problemId: string; // Platform-specific problem ID
  url: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';
  tags: string[]; // Problem tags/categories
  category?: string; // Main category (e.g., "Arrays", "Dynamic Programming")
  acceptanceRate?: number; // Percentage of successful submissions
  totalSubmissions?: number;
  solvedCount?: number;
  contestId?: string; // If problem is from a contest
  contestName?: string;
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in MB
  description?: string;
  constraints?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  isPremium?: boolean; // For platforms with premium problems
  isRated?: boolean; // If problem contributes to rating
  lastUpdated: Date;
}

const ProblemSchema: Schema = new Schema({
  title: {
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
  problemId: {
    type: String,
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced'],
    index: true,
  },
  tags: [{
    type: String,
    index: true,
  }],
  category: {
    type: String,
    index: true,
  },
  acceptanceRate: {
    type: Number,
    min: 0,
    max: 100,
  },
  totalSubmissions: {
    type: Number,
    default: 0,
  },
  solvedCount: {
    type: Number,
    default: 0,
  },
  contestId: {
    type: String,
    index: true,
  },
  contestName: {
    type: String,
  },
  timeLimit: {
    type: Number,
  },
  memoryLimit: {
    type: Number,
  },
  description: {
    type: String,
  },
  constraints: {
    type: String,
  },
  examples: [{
    input: String,
    output: String,
    explanation: String,
  }],
  isPremium: {
    type: Boolean,
    default: false,
    index: true,
  },
  isRated: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for efficient querying
ProblemSchema.index({ platform: 1, difficulty: 1 });
ProblemSchema.index({ platform: 1, category: 1 });
ProblemSchema.index({ platform: 1, tags: 1 });
ProblemSchema.index({ difficulty: 1, acceptanceRate: 1 });
ProblemSchema.index({ platform: 1, isPremium: 1 });

// Text index for search functionality
ProblemSchema.index({ title: 'text', tags: 'text', category: 'text' });

export default mongoose.models.Problem || mongoose.model<IProblem>('Problem', ProblemSchema); 