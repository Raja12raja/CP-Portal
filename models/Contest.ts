import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  name: string;
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks';
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  url: string;
  description?: string;
  difficulty?: string;
  isRated?: boolean;
  participants?: number;
  lastUpdated: Date;
}

const ContestSchema: Schema = new Schema({
  name: {
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
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  difficulty: {
    type: String,
  },
  isRated: {
    type: Boolean,
    default: false,
  },
  participants: {
    type: Number,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient querying
ContestSchema.index({ platform: 1, startTime: 1 });

// Index for finding upcoming contests
ContestSchema.index({ startTime: 1 }, { 
  partialFilterExpression: { startTime: { $gte: new Date() } } 
});

export default mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema); 