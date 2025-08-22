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

interface Contest {
  _id: string;
  name: string;
  platform: string;
  startTime: string;
  endTime: string;
  url: string;
}

export default function FriendProfile({ params }: { params: { userId: string } }) {
  const { user } = useUser()
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<FriendProfile | null>(null)
  const [registeredContests, setRegisteredContests] = useState<Contest[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFriendProfile();
    fetchRegisteredContests();
  }, [params.userId]);

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

  const fetchRegisteredContests = async () => {
    try {
      const res = await fetch(`/api/users/${params.userId}/registered-contests`)
      const data = await res.json()
      if (res.ok) {
        setRegisteredContests(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch registered contests:', err)
    }
  }

  function getDuration(start: string, end: string): string {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime.getTime() - startTime.getTime();

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-600'} mx-auto mb-4`}></div>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/profile" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} mr-4`}>
                  ← Back to My Profile
                </Link>
                <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Friend Profile</h1>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${darkMode ? 'bg-red-900' : 'bg-red-100'} mb-4`}>
                <svg className={`h-6 w-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Access Denied</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{error}</p>
              <Link
                href="/profile"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/profile" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} mr-4`}>
                  ← Back to My Profile
                </Link>
                <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Friend Profile</h1>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="text-center">
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Profile not found</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/profile" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} mr-4`}>
                ← Back to My Profile
              </Link>
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Friend Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Friend Profile */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center space-x-4">
                  <img
                    src={profile.imageUrl || '/default-avatar.png'}
                    alt="Profile"
                    className={`w-16 h-16 rounded-full object-cover border-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  />
                  <div>
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your Friend</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{profile.email}</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile.username || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Account Created</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-10">
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Contests {profile?.firstName} Registered For
                    </h2>
                    {registeredContests.length === 0 ? (
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No registered contests found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-3">
                        {registeredContests.map(contest => (
                          <ul key={contest._id} className={`border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'} px-4 py-4 pb-2 rounded shadow`}>
                            <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-black'} text-lg`}>{contest.name}</h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Platform: {contest.platform}</p>
                            <div className="space-y-2 mb-4">
                              <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Start:</span>
                                <span className="ml-1">{new Date(contest.startTime).toLocaleString()}</span>
                              </div>
                              <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Duration:</span>
                                <span className="ml-1">{getDuration(contest.startTime, contest.endTime)}</span>
                              </div>
                            </div>
                            <a
                              href={contest.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center block`}
                            >
                              View Contest →
                            </a>
                          </ul>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Friend's Preferences */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contest Preferences</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Platform Preferences */}
              <div>
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Platform Preferences</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Platforms this user follows:</p>
                <div className="space-y-3">
                  {[
                    { key: 'codeforces', label: 'Codeforces', color: 'text-red-600', bgColor: darkMode ? 'bg-red-900' : 'bg-red-50', darkColor: 'text-red-400' },
                    { key: 'codechef', label: 'CodeChef', color: 'text-orange-600', bgColor: darkMode ? 'bg-orange-900' : 'bg-orange-50', darkColor: 'text-orange-400' },
                    { key: 'leetcode', label: 'LeetCode', color: 'text-yellow-600', bgColor: darkMode ? 'bg-yellow-900' : 'bg-yellow-50', darkColor: 'text-yellow-400' },
                    { key: 'geeksforgeeks', label: 'GeeksforGeeks', color: 'text-green-600', bgColor: darkMode ? 'bg-green-900' : 'bg-green-50', darkColor: 'text-green-400' }
                  ].map((platform) => (
                    <div key={platform.key} className={`flex items-center p-3 rounded-lg ${profile.preferences[platform.key as keyof typeof profile.preferences]
                      ? platform.bgColor
                      : darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                      <div className={`h-4 w-4 rounded ${profile.preferences[platform.key as keyof typeof profile.preferences] ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`ml-3 block text-sm font-medium ${profile.preferences[platform.key as keyof typeof profile.preferences]
                        ? darkMode ? platform.darkColor : platform.color
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {platform.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Notification Preferences</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>This user's notification settings:</p>
                <div className="space-y-3">
                  <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`h-4 w-4 rounded ${profile.preferences.emailNotifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={`ml-3 block text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Email notifications for new contests
                    </span>
                  </div>
                  <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`h-4 w-4 rounded ${profile.preferences.reminders ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={`ml-3 block text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Contest reminders (1 hour before)
                    </span>
                  </div>
                </div>
              </div>

              {/* Friend Status */}
              <div className="pt-4">
                <div className={`p-4 ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} rounded-lg border`}>
                  <div className="flex items-center">
                    <svg className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'} mr-2`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`${darkMode ? 'text-green-300' : 'text-green-800'} font-medium`}>You are friends with this user</span>
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