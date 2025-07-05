# CP Portal - Contest Registration System

## Overview
CP Portal is a competitive programming contest management system that allows users to discover, register for, and track contests from multiple platforms including Codeforces, CodeChef, LeetCode, and GeeksforGeeks.

## Features

### Contest Management
- **Multi-platform Support**: Aggregates contests from Codeforces, CodeChef, LeetCode, and GeeksforGeeks
- **Real-time Updates**: Automatic contest fetching and updates
- **Smart Filtering**: Filter by platform, duration, date range, and contest status
- **Registration System**: Register for upcoming contests with validation

### Problem Sets Management
- **Multi-platform Problem Aggregation**: Collects problems from Codeforces, CodeChef, LeetCode, and GeeksforGeeks
- **Advanced Filtering**: Filter by platform, difficulty, category, tags, and search terms
- **User Progress Tracking**: Track problem-solving progress with status updates
- **Comprehensive Problem Data**: Includes acceptance rates, submission counts, and problem details

### Contest Status System
The system now properly handles contest status to prevent registration for past contests:

- **Upcoming**: Contests that haven't started yet - users can register
- **Ongoing**: Contests currently in progress - registration disabled
- **Ended**: Contests that have finished - registration disabled

### Registration Validation
- **Frontend Validation**: Checks contest start/end times before allowing registration
- **Backend Validation**: Server-side validation to prevent registration for past contests
- **Duplicate Prevention**: Prevents multiple registrations for the same contest
- **User Feedback**: Clear error messages when registration is not possible

### Problem Progress Tracking
- **Status Management**: Track problems as not started, attempted, solved, or solved optimally
- **Progress Analytics**: View problem-solving statistics and progress
- **Personal Notes**: Add personal notes and custom tags to problems
- **Performance Metrics**: Track submission counts, best times, and memory usage

### UI Improvements
- **Status Badges**: Visual indicators showing contest status (Upcoming, Live, Ended)
- **Smart Buttons**: Registration buttons are disabled for past/ongoing contests
- **Past Contest Toggle**: Option to show/hide past contests for reference
- **Problem Dashboard**: Comprehensive problem browsing with advanced filters
- **Progress Indicators**: Visual status indicators for problem-solving progress
- **Responsive Design**: Mobile-friendly interface with modern UI

## Technical Implementation

### Frontend (Next.js + TypeScript)
- Contest status calculation using `getContestStatus()` function
- Real-time validation in `handleRegister()` function
- Dynamic UI updates based on contest state
- Filter system for better contest discovery

### Backend (Node.js + MongoDB)
- Registration API with time-based validation
- Contest model with proper indexing for efficient queries
- Registration model to track user contest registrations
- Automatic contest fetching from multiple platforms

### Database Schema
- **Contest**: Stores contest details with start/end times
- **Registration**: Links users to contests they've registered for
- **Problem**: Stores problem details from all platforms
- **UserProblem**: Tracks user progress and submissions on problems
- **User**: User profiles and authentication via Clerk

## API Endpoints

### Contests
- `GET /api/contests` - Fetch contests with filtering options
- `POST /api/contests/update` - Trigger contest updates from platforms

### Problems
- `GET /api/problems` - Fetch problems with comprehensive filtering
- `POST /api/problems/update` - Trigger problem updates from platforms
- `GET /api/users/[userId]/problems` - Get user's problem progress
- `POST /api/users/[userId]/problems` - Update user's problem status

### Registration
- `GET /api/users/[userId]/registered-contests` - Get user's registered contests
- `POST /api/users/[userId]/registered-contests` - Register for a contest

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Access the application at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file with:
```
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 
