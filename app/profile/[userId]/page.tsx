'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface FriendProfile {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  email: string;
  preferences: {
    codeforces: boolean;
    codechef: boolean;
    leetcode: boolean;
    geeksforgeeks: boolean;
    emailNotifications: boolean;
    reminders: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FriendProfile({ params }: { params: { userId: string } }) {
  const { user } = useUser()
  const [profile, setProfile] = useState<FriendProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFriendProfile()
  }, [params.userId])

  const fetchFriendProfile = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/users/${params.userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.data)
      } else if (response.status === 403) {
        setError('You can only view profiles of your friends. Add this user as a friend first!')
      } else if (response.status === 404) {
        setError('User not found')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching friend profile:', error)
      setError('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/profile" className="text-gray-700 hover:text-gray-900 mr-4">
                  ← Back to My Profile
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Friend Profile</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/profile" className="text-gray-700 hover:text-gray-900 mr-4">
                  ← Back to My Profile
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Friend Profile</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-gray-600">Profile not found</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/profile" className="text-gray-700 hover:text-gray-900 mr-4">
                ← Back to My Profile
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Friend Profile</h1>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Friend Profile */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center space-x-4">
                  <img
                    src={profile.imageUrl || '/default-avatar.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">Your Friend</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.username || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Friend's Preferences */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Contest Preferences</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Platform Preferences */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Platform Preferences</h3>
                <p className="text-sm text-gray-600 mb-4">Platforms this user follows:</p>
                <div className="space-y-3">
                  {[
                    { key: 'codeforces', label: 'Codeforces', color: 'text-red-600', bgColor: 'bg-red-50' },
                    { key: 'codechef', label: 'CodeChef', color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    { key: 'leetcode', label: 'LeetCode', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                    { key: 'geeksforgeeks', label: 'GeeksforGeeks', color: 'text-green-600', bgColor: 'bg-green-50' }
                  ].map((platform) => (
                    <div key={platform.key} className={`flex items-center p-3 rounded-lg ${profile.preferences[platform.key as keyof typeof profile.preferences] ? platform.bgColor : 'bg-gray-50'}`}>
                      <div className={`h-4 w-4 rounded ${profile.preferences[platform.key as keyof typeof profile.preferences] ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`ml-3 block text-sm font-medium ${profile.preferences[platform.key as keyof typeof profile.preferences] ? platform.color : 'text-gray-500'}`}>
                        {platform.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <p className="text-sm text-gray-600 mb-4">This user's notification settings:</p>
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <div className={`h-4 w-4 rounded ${profile.preferences.emailNotifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="ml-3 block text-sm text-gray-900">
                      Email notifications for new contests
                    </span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <div className={`h-4 w-4 rounded ${profile.preferences.reminders ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="ml-3 block text-sm text-gray-900">
                      Contest reminders (1 hour before)
                    </span>
                  </div>
                </div>
              </div>

              {/* Friend Status */}
              <div className="pt-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">You are friends with this user</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 