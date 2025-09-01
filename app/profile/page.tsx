'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserProfile, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Moon, Sun, ExternalLink, RefreshCw, BarChart3 } from 'lucide-react'

// Types
interface UserPreferences {
  emailNotifications: boolean;
  reminders: boolean;
}

interface UserLinks {
  codeforces: string;
  codechef: string;
  leetcode: string;
}

interface Friend {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  email: string;
}

interface CodeforcesStats {
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution?: number;
  handle?: string;
}

// Custom hooks
const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return [darkMode, setDarkMode] as const
}

const useMessage = () => {
  const [message, setMessage] = useState('')

  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000) // Auto-clear after 5 seconds
  }, [])

  const clearMessage = useCallback(() => setMessage(''), [])

  return { message, showMessage, clearMessage }
}

// API functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Component
export default function Profile() {
  const { user } = useUser()
  const [darkMode, setDarkMode] = useDarkMode()
  const { message, showMessage, clearMessage } = useMessage()

  // State
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: false,
    reminders: true
  })
  const [userLinks, setUserLinks] = useState<UserLinks>({
    codeforces: '',
    codechef: '',
    leetcode: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(null)
  const [cfStatsLoading, setCfStatsLoading] = useState(false)
  const [cfStatsLastUpdated, setCfStatsLastUpdated] = useState<string | null>(null)

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState<Friend | null>(null)
  const [searching, setSearching] = useState(false)
  const [friendsLoading, setFriendsLoading] = useState(false)

  // Data fetching functions
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiCall('/api/user')

      if (data.data) {
        setUserData(data.data)
        setPreferences(data.data.preferences || { emailNotifications: false, reminders: true })

        const existingUserLinks = data.data.userLinks || {}
        setUserLinks({
          codeforces: existingUserLinks.codeforces || '',
          codechef: existingUserLinks.codechef || '',
          leetcode: existingUserLinks.leetcode || ''
        })
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        await createUser()
      } else {
        showMessage('Failed to load user data')
        console.error('Error fetching user data:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [showMessage])

  const fetchFriendsData = useCallback(async () => {
    try {
      setFriendsLoading(true)
      const data = await apiCall('/api/friends')

      setFriends(data.data.friends || [])
      setSentRequests(data.data.sentRequests || [])
      setReceivedRequests(data.data.receivedRequests || [])
    } catch (error) {
      console.error('Error fetching friends data:', error)
    } finally {
      setFriendsLoading(false)
    }
  }, [])

  const createUser = async () => {
    try {
      await apiCall('/api/user/create', { method: 'POST' })
      showMessage('User created successfully!')
      await fetchUserData()
    } catch (error) {
      showMessage('Error creating user. Please try again.')
      console.error('Error creating user:', error)
    }
  }

  // Effects
  useEffect(() => {
    fetchUserData()
    fetchFriendsData()
  }, [fetchUserData, fetchFriendsData])

  useEffect(() => {
    if (userLinks.codeforces?.trim() && !cfStats && !cfStatsLoading) {
      fetchCodeforcesStats(userLinks.codeforces, false)
    }
  }, [userLinks.codeforces])

  // Event handlers
  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    clearMessage()
  }

  const handleUserLinkChange = (platform: keyof UserLinks, value: string) => {
    setUserLinks(prev => ({ ...prev, [platform]: value }))
    clearMessage()
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      clearMessage()

      const data = await apiCall('/api/user', {
        method: 'PUT',
        body: JSON.stringify({ preferences, userLinks }),
      })

      showMessage('Settings saved successfully!')

      if (data.data) {
        setUserData(data.data)
        if (data.data.userLinks) {
          setUserLinks(data.data.userLinks)
        }
      }
    } catch (error) {
      showMessage('Failed to save settings')
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setPreferences({
      emailNotifications: false,
      reminders: true
    })
    setUserLinks({
      codeforces: '',
      codechef: '',
      leetcode: ''
    })
    showMessage('Reset to default preferences')
  }

  const fetchCodeforcesStats = async (username: string, forceRefresh = false) => {
    if (!username.trim()) {
      showMessage('Please enter a valid Codeforces username')
      return
    }

    try {
      setCfStatsLoading(true)
      showMessage('Fetching Codeforces stats...')

      const url = forceRefresh ? '/api/codeforces-stats' : `/api/codeforces-stats?username=${encodeURIComponent(username)}`
      const options = forceRefresh ? {
        method: 'POST',
        body: JSON.stringify({ username })
      } : {}

      const data = await apiCall(url, options)

      if (data.success) {
        setCfStats(data.data)
        setCfStatsLastUpdated(data.lastUpdated)
        const cacheStatus = data.cached ? ' (cached)' : ' (fresh data)'
        showMessage(`Codeforces stats loaded successfully!${cacheStatus}`)
      } else {
        throw new Error(data.error || 'Failed to fetch Codeforces stats')
      }
    } catch (error) {
      showMessage('Error fetching Codeforces stats. Please try again.')
      setCfStats(null)
      setCfStatsLastUpdated(null)
      console.error('Error fetching Codeforces stats:', error)
    } finally {
      setCfStatsLoading(false)
    }
  }

  const openPlatformProfile = (platform: keyof UserLinks) => {
    const userId = userLinks[platform]
    if (!userId.trim()) {
      showMessage(`Please set your ${platform} username first`)
      return
    }

    const urls = {
      codeforces: `https://codeforces.com/profile/${userId}`,
      codechef: `https://www.codechef.com/users/${userId}`,
      leetcode: `https://leetcode.com/u/${userId}`
    }

    window.open(urls[platform], '_blank')
  }

  // Friends functions
  const searchUser = async () => {
    if (!searchEmail.trim()) return

    try {
      setSearching(true)
      setSearchResult(null)

      const data = await apiCall(`/api/users/search?email=${encodeURIComponent(searchEmail)}`)
      setSearchResult(data.data)
    } catch (error) {
      showMessage('Failed to search user')
      console.error('Error searching user:', error)
    } finally {
      setSearching(false)
    }
  }

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      await apiCall('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      })

      showMessage('Friend request sent successfully!')
      setSearchResult(null)
      setSearchEmail('')
      await fetchFriendsData()
    } catch (error) {
      showMessage('Failed to send friend request')
      console.error('Error sending friend request:', error)
    }
  }

  const handleFriendRequest = async (targetUserId: string, action: 'accept' | 'decline') => {
    try {
      await apiCall('/api/friends/requests', {
        method: 'PUT',
        body: JSON.stringify({ targetUserId, action }),
      })

      showMessage(`Friend request ${action}ed successfully!`)
      await fetchFriendsData()
    } catch (error) {
      showMessage(`Failed to ${action} friend request`)
      console.error(`Error ${action}ing friend request:`, error)
    }
  }

  const cancelFriendRequest = async (targetUserId: string) => {
    try {
      await apiCall(`/api/friends/requests?targetUserId=${targetUserId}`, {
        method: 'DELETE',
      })

      showMessage('Friend request cancelled successfully!')
      await fetchFriendsData()
    } catch (error) {
      showMessage('Failed to cancel friend request')
      console.error('Error cancelling friend request:', error)
    }
  }

  // Render functions
  const renderCodeforcesStats = () => {
    if (!cfStats) return null

    return (
      <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Codeforces Stats
          </h4>
          <BarChart3 className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Current Rating</p>
            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cfStats.rating || 'Unrated'}
            </p>
          </div>
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Max Rating</p>
            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cfStats.maxRating || 'N/A'}
            </p>
          </div>
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rank</p>
            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cfStats.rank || 'N/A'}
            </p>
          </div>
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Max Rank</p>
            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cfStats.maxRank || 'N/A'}
            </p>
          </div>
        </div>
        {cfStatsLastUpdated && (
          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last updated: {new Date(cfStatsLastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading your profile...</p>
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
              <Link href="/contests" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} mr-4`}>
                ← Back to Dashboard
              </Link>
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              {userData && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Last updated: {new Date(userData.updatedAt).toLocaleDateString()}
                </div>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-md border ${message.includes('successfully') || message.includes('Reset')
            ? (darkMode ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-50 text-green-800 border-green-200')
            : (darkMode ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-50 text-red-800 border-red-200')
            }`}>
            <div className="flex items-center">
              {message.includes('successfully') || message.includes('Reset') ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {message}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Information</h2>
            </div>
            <div className="p-6">
              {user ? (
                <div className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.imageUrl}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div>
                      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.firstName} {user.lastName}
                      </h3>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>

                  {/* Platform Links */}
                  <div className="pt-4">
                    <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Platform Profiles</h3>
                    <div className="space-y-3">
                      {Object.entries({
                        codeforces: { name: 'Codeforces', color: 'red' },
                        codechef: { name: 'CodeChef', color: 'orange' },
                        leetcode: { name: 'LeetCode', color: 'yellow' }
                      }).map(([platform, config]) => (
                        <button
                          key={platform}
                          onClick={() => openPlatformProfile(platform as keyof UserLinks)}
                          disabled={!userLinks[platform as keyof UserLinks]?.trim()}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${userLinks[platform as keyof UserLinks]?.trim()
                            ? darkMode
                              ? `bg-${config.color}-900 border-${config.color}-700 hover:bg-${config.color}-800 text-${config.color}-100`
                              : `bg-${config.color}-50 border-${config.color}-200 hover:bg-${config.color}-100 text-${config.color}-800`
                            : darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          <span>{config.name} Profile</span>
                          {userLinks[platform as keyof UserLinks]?.trim() && <ExternalLink className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>

                    {/* Codeforces Stats Section */}
                    {userLinks.codeforces?.trim() && (
                      <div className="mt-4 space-y-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchCodeforcesStats(userLinks.codeforces, false)}
                            disabled={cfStatsLoading}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center ${darkMode
                              ? 'bg-blue-700 hover:bg-blue-600 text-blue-100 border border-blue-600'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {cfStatsLoading ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load Stats'
                            )}
                          </button>

                          <button
                            onClick={() => fetchCodeforcesStats(userLinks.codeforces, true)}
                            disabled={cfStatsLoading}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center ${darkMode
                              ? 'bg-green-700 hover:bg-green-600 text-green-100 border border-green-600'
                              : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {cfStatsLoading ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Refreshing...
                              </>
                            ) : (
                              'Refresh Stats'
                            )}
                          </button>
                        </div>
                        {renderCodeforcesStats()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading user information...</p>
                </div>
              )}
            </div>
          </div>

          {/* Friends Section */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Friends</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Add Friend */}
              <div>
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Add Friend</h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      placeholder="Enter friend's email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-black placeholder-gray-500'
                        }`}
                    />
                    <button
                      onClick={searchUser}
                      disabled={searching || !searchEmail.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {searchResult && (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3">
                        <img
                          src={searchResult.imageUrl || '/default-avatar.png'}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {searchResult.firstName} {searchResult.lastName}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{searchResult.email}</p>
                        </div>
                        <button
                          onClick={() => sendFriendRequest(searchResult.clerkId)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Add Friend
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Friend Requests */}
              {receivedRequests.length > 0 && (
                <div>
                  <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Friend Requests ({receivedRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div key={request.clerkId} className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.imageUrl || '/default-avatar.png'}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {request.firstName} {request.lastName}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{request.email}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleFriendRequest(request.clerkId, 'accept')}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleFriendRequest(request.clerkId, 'decline')}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div>
                  <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Sent Requests ({sentRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div key={request.clerkId} className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.imageUrl || '/default-avatar.png'}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {request.firstName} {request.lastName}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{request.email}</p>
                          </div>
                          <button
                            onClick={() => cancelFriendRequest(request.clerkId)}
                            className="px-2 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div>
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  My Friends ({friends.length})
                </h3>
                {friendsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.clerkId} className={`p-3 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                        <div className="flex items-center space-x-3">
                          <img
                            src={friend.imageUrl || '/default-avatar.png'}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {friend.firstName} {friend.lastName}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{friend.email}</p>
                          </div>
                          <Link
                            href={`/profile/${friend.clerkId}`}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    No friends yet. Search for users to add them as friends!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences and User Links */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
              <button
                onClick={resetToDefaults}
                className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
              >
                Reset to Defaults
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* User Links */}
              <div>
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Platform Usernames</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  Add your usernames for each platform to access your profiles:
                </p>
                <div className="space-y-4">
                  {[
                    { key: 'codeforces', label: 'Codeforces Username', placeholder: 'Your Codeforces username' },
                    { key: 'codechef', label: 'CodeChef Username', placeholder: 'Your CodeChef username' },
                    { key: 'leetcode', label: 'LeetCode Username', placeholder: 'Your LeetCode username' }
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label htmlFor={key} className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {label}
                      </label>
                      <input
                        type="text"
                        id={key}
                        placeholder={placeholder}
                        value={userLinks[key as keyof UserLinks]}
                        onChange={(e) => handleUserLinkChange(key as keyof UserLinks, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-black placeholder-gray-500'
                          }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Notification Preferences</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  Choose how you want to be notified about contests:
                </p>
                <div className="space-y-3">
                  <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={preferences.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className={`ml-3 block text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Email notifications for new contests
                    </label>
                  </div>
                  <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                    <input
                      type="checkbox"
                      id="reminders"
                      checked={preferences.reminders}
                      onChange={(e) => handlePreferenceChange('reminders', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="reminders" className={`ml-3 block text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Contest reminders (1 hour before)
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}