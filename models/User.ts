// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICodeforcesStats {
  rating: number | null;
  rank: string | null;
  maxRank: string | null;
  maxRating: number | null;
  problemsSolved: number;
  contestsParticipated: number;
  username: string;
  lastUpdated: Date;
}

export interface IUserPreferences {
  // Platform preferences for contests
  codeforces: boolean;
  codechef: boolean;
  leetcode: boolean;
  geeksforgeeks: boolean;
  // Notification preferences
  emailNotifications: boolean;
  reminders: boolean;
}

export interface IUserLinks {
  codeforces?: string;
  codechef?: string;
  leetcode?: string;
  geeksforgeeks?: string;
}

export interface IFriendRequests {
  sent: string[]; // Array of clerkIds to whom friend requests were sent
  received: string[]; // Array of clerkIds from whom friend requests were received
}

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  preferences: IUserPreferences;
  userLinks: IUserLinks;
  codeforcesStats?: ICodeforcesStats;
  friends: string[]; // Array of clerkIds of friends
  friendRequests: IFriendRequests;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  fullName: string;
  displayName: string;

  // Instance methods
  isFriendsWith(clerkId: string): boolean;
  hasSentRequestTo(clerkId: string): boolean;
  hasReceivedRequestFrom(clerkId: string): boolean;
  addFriend(clerkId: string): void;
  removeFriend(clerkId: string): void;
  sendFriendRequest(clerkId: string): void;
  receiveFriendRequest(clerkId: string): void;
  acceptFriendRequest(clerkId: string): void;
  rejectFriendRequest(clerkId: string): void;
  cancelFriendRequest(clerkId: string): void;
  getFriendProfile(): Partial<IUser>;
  getPublicProfile(): Partial<IUser>;
}

const CodeforcesStatsSchema = new Schema({
  rating: {
    type: Number,
    default: null,
  },
  rank: {
    type: String,
    default: null,
  },
  maxRank: {
    type: String,
    default: null,
  },
  maxRating: {
    type: Number,
    default: null,
  },
  problemsSolved: {
    type: Number,
    default: 0,
  },
  contestsParticipated: {
    type: Number,
    default: 0,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

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
    lowercase: true,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    trim: true,
    sparse: true, // Allow multiple null values but enforce uniqueness for non-null values
    index: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  preferences: {
    // Platform preferences for contest notifications
    codeforces: {
      type: Boolean,
      default: false,
    },
    codechef: {
      type: Boolean,
      default: false,
    },
    leetcode: {
      type: Boolean,
      default: false,
    },
    geeksforgeeks: {
      type: Boolean,
      default: false,
    },
    // Notification preferences
    emailNotifications: {
      type: Boolean,
      default: false,
    },
    reminders: {
      type: Boolean,
      default: true,
    },
  },
  userLinks: {
    codeforces: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v: string) {
          // If provided, should be a valid username (alphanumeric, underscore, hyphen)
          return !v || /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'Codeforces username can only contain letters, numbers, underscores, and hyphens'
      }
    },
    codechef: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'CodeChef username can only contain letters, numbers, underscores, and hyphens'
      }
    },
    leetcode: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'LeetCode username can only contain letters, numbers, underscores, and hyphens'
      }
    },
    geeksforgeeks: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'GeeksforGeeks username can only contain letters, numbers, underscores, and hyphens'
      }
    },
  },
  codeforcesStats: {
    type: CodeforcesStatsSchema,
    default: null,
  },
  friends: [{
    type: String,
    ref: 'User',
    index: true,
    validate: {
      validator: function (v: string) {
        // Ensure friend clerkId is not the same as user's clerkId
        return v !== (this as any).clerkId;
      },
      message: 'Cannot add yourself as a friend'
    }
  }],
  friendRequests: {
    sent: [{
      type: String,
      ref: 'User',
      validate: {
        validator: function (v: string) {
          return v !== (this as any).clerkId;
        },
        message: 'Cannot send friend request to yourself'
      }
    }],
    received: [{
      type: String,
      ref: 'User',
      validate: {
        validator: function (v: string) {
          return v !== (this as any).clerkId;
        },
        message: 'Cannot receive friend request from yourself'
      }
    }],
  },
}, {
  timestamps: true,
  // Add version key for optimistic concurrency control
  versionKey: '__v',
});

// Compound indexes for efficient querying
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 }, { sparse: true }); // Sparse index for optional usernames
UserSchema.index({ friends: 1 });
UserSchema.index({ 'friendRequests.sent': 1 });
UserSchema.index({ 'friendRequests.received': 1 });
UserSchema.index({ 'codeforcesStats.username': 1 }, { sparse: true });
UserSchema.index({ 'codeforcesStats.lastUpdated': 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ updatedAt: 1 });

// Compound indexes for complex queries
UserSchema.index({ 'preferences.codeforces': 1, 'preferences.emailNotifications': 1 });
UserSchema.index({ 'preferences.codechef': 1, 'preferences.emailNotifications': 1 });
UserSchema.index({ 'preferences.leetcode': 1, 'preferences.emailNotifications': 1 });
UserSchema.index({ 'preferences.geeksforgeeks': 1, 'preferences.emailNotifications': 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.username || 'Anonymous User';
});

// Virtual for display name (prioritizes username, then full name, then email)
UserSchema.virtual('displayName').get(function () {
  return this.username || this.fullName || this.email;
});

// Instance method to check if user is friends with another user
UserSchema.methods.isFriendsWith = function (clerkId: string): boolean {
  return this.friends.includes(clerkId);
};

// Instance method to check if user has sent a friend request to another user
UserSchema.methods.hasSentRequestTo = function (clerkId: string): boolean {
  return this.friendRequests.sent.includes(clerkId);
};

// Instance method to check if user has received a friend request from another user
UserSchema.methods.hasReceivedRequestFrom = function (clerkId: string): boolean {
  return this.friendRequests.received.includes(clerkId);
};

// Instance method to add a friend
UserSchema.methods.addFriend = function (clerkId: string): void {
  if (!this.friends.includes(clerkId) && clerkId !== this.clerkId) {
    this.friends.push(clerkId);
  }
};

// Instance method to remove a friend
UserSchema.methods.removeFriend = function (clerkId: string): void {
  this.friends = this.friends.filter((friendId: string) => friendId !== clerkId);
};

// Instance method to send a friend request
UserSchema.methods.sendFriendRequest = function (clerkId: string): void {
  if (!this.friendRequests.sent.includes(clerkId) && clerkId !== this.clerkId) {
    this.friendRequests.sent.push(clerkId);
  }
};

// Instance method to receive a friend request
UserSchema.methods.receiveFriendRequest = function (clerkId: string): void {
  if (!this.friendRequests.received.includes(clerkId) && clerkId !== this.clerkId) {
    this.friendRequests.received.push(clerkId);
  }
};

// Instance method to accept a friend request
UserSchema.methods.acceptFriendRequest = function (clerkId: string): void {
  // Remove from received requests
  this.friendRequests.received = this.friendRequests.received.filter((id: string) => id !== clerkId);
  // Add as friend
  this.addFriend(clerkId);
};

// Instance method to reject a friend request
UserSchema.methods.rejectFriendRequest = function (clerkId: string): void {
  this.friendRequests.received = this.friendRequests.received.filter((id: string) => id !== clerkId);
};

// Instance method to cancel a sent friend request
UserSchema.methods.cancelFriendRequest = function (clerkId: string): void {
  this.friendRequests.sent = this.friendRequests.sent.filter((id: string) => id !== clerkId);
};

// Instance method to get safe profile data (for friends)
UserSchema.methods.getFriendProfile = function () {
  return {
    clerkId: this.clerkId,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    imageUrl: this.imageUrl,
    preferences: this.preferences,
    userLinks: this.userLinks,
    codeforcesStats: this.codeforcesStats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    // Don't include email, friends list, or friend requests for privacy
  };
};

// Instance method to get public profile data (for search results)
UserSchema.methods.getPublicProfile = function () {
  return {
    clerkId: this.clerkId,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    imageUrl: this.imageUrl,
    // Only basic info, no preferences or links
  };
};

// Pre-save middleware to clean up empty strings
UserSchema.pre('save', function (next) {
  // Clean up empty strings in userLinks
  if (this.userLinks) {
    Object.keys(this.userLinks).forEach(key => {
      if (this.userLinks[key as keyof IUserLinks] === '') {
        this.userLinks[key as keyof IUserLinks] = undefined;
      }
    });
  }

  // Trim string fields
  if (this.firstName) this.firstName = this.firstName.trim();
  if (this.lastName) this.lastName = this.lastName.trim();
  if (this.username) this.username = this.username.trim();
  if (this.imageUrl) this.imageUrl = this.imageUrl.trim();

  next();
});

// Static method to find users by platform username
UserSchema.statics.findByPlatformUsername = function (platform: string, username: string) {
  const query: any = {};
  query[`userLinks.${platform}`] = username;
  return this.find(query);
};

// Static method to find users who want notifications for a specific platform
UserSchema.statics.findUsersForPlatformNotifications = function (platform: string) {
  const query: any = {
    'preferences.emailNotifications': true,
  };
  query[`preferences.${platform}`] = true;
  return this.find(query);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);