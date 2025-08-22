// File: /models/UserFavorite.ts
import mongoose from 'mongoose';

const UserFavoriteSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Create compound index for efficient queries
UserFavoriteSchema.index({ userId: 1, problemId: 1 }, { unique: true });

// Create index for userId for faster user favorite lookups
UserFavoriteSchema.index({ userId: 1 });

export default mongoose.models.UserFavorite || mongoose.model('UserFavorite', UserFavoriteSchema);