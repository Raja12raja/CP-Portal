'use client'

import { useState, useEffect } from 'react'
import { UserProfile, useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface UserPreferences {
  codeforces: boolean;
  codechef: boolean;
  leetcode: boolean;
  geeksforgeeks: boolean;
  emailNotifications: boolean;
  reminders: boolean;
}

interface Friend {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  email: string;
}

export default function Profile() {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<UserPreferences>({
    codeforces: true,
    codechef: true,
    leetcode: true,
    geeksforgeeks: true,
    emailNotifications: false,
    reminders: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userData, setUserData] = useState<any>(null)
  
  // Friends state
  const [friends, setFriends] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState<Friend | null>(null)
  const [searching, setSearching] = useState(false)
  const [friendsLoading, setFriendsLoading] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchFriendsData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user')
      
      if (response.ok) {
        const data = await response.json()
        console.log('User data:', data)
        
        if (data.data) {
          setUserData(data.data)
          if (data.data.preferences) {
            setPreferences(data.data.preferences)
          }
        }
      } else if (response.status === 404) {
        // User not found in database, create them
        console.log('User not found, creating user...')
        await createUser()
      } else {
        console.error('Failed to fetch user data:', response.status)
        setMessage('Failed to load user data')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setMessage('Error loading user data')
    } finally {
      setLoading(false)
    }
  }

  const fetchFriendsData = async () => {
    try {
      setFriendsLoading(true)
      const response = await fetch('/api/friends')
      
      if (response.ok) {
        const data = await response.json()
        setFriends(data.data.friends || [])
        setSentRequests(data.data.sentRequests || [])
        setReceivedRequests(data.data.receivedRequests || [])
      } else {
        console.error('Failed to fetch friends data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching friends data:', error)
    } finally {
      setFriendsLoading(false)
    }
  }

  const createUser = async () => {
    try {
      console.log('Creating user in database...')
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('User created:', data)
        setMessage('User created successfully!')
        // Fetch user data again
        await fetchUserData()
      } else {
        const errorData = await response.json()
        console.error('Failed to create user:', errorData)
        setMessage(errorData.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setMessage('Error creating user. Please try again.')
    }
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
    // Clear any previous messages when user makes changes
    setMessage('')
  }

  const savePreferences = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Preferences saved:', data)
        setMessage('Preferences saved successfully!')
        // Update local user data
        if (data.data) {
          setUserData(data.data)
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to save preferences:', errorData)
        setMessage(errorData.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage('Error saving preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setPreferences({
      codeforces: true,
      codechef: true,
      leetcode: true,
      geeksforgeeks: true,
      emailNotifications: false,
      reminders: true
    })
    setMessage('Reset to default preferences')
  }

  // Friends functions
  const searchUser = async () => {
    if (!searchEmail.trim()) return
    
    try {
      setSearching(true)
      setSearchResult(null)
      
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(searchEmail)}`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResult(data.data)
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to search user')
      }
    } catch (error) {
      console.error('Error searching user:', error)
      setMessage('Error searching user')
    } finally {
      setSearching(false)
    }
  }

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      })

      if (response.ok) {
        setMessage('Friend request sent successfully!')
        setSearchResult(null)
        setSearchEmail('')
        await fetchFriendsData()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to send friend request')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      setMessage('Error sending friend request')
    }
  }

  const handleFriendRequest = async (targetUserId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, action }),
      })

      if (response.ok) {
        setMessage(`Friend request ${action}ed successfully!`)
        await fetchFriendsData()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || `Failed to ${action} friend request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error)
      setMessage(`Error ${action}ing friend request`)
    }
  }

  const cancelFriendRequest = async (targetUserId: string) => {
    try {
      const response = await fetch(`/api/friends/requests?targetUserId=${targetUserId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage('Friend request cancelled successfully!')
        await fetchFriendsData()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to cancel friend request')
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error)
      setMessage('Error cancelling friend request')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
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
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
            </div>
            {userData && (
              <div className="text-sm text-gray-500">
                Last updated: {new Date(userData.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
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
                      <h3 className="text-lg font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <p className="mt-1 text-sm text-gray-500 font-mono">{user.id}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading user information...</p>
                </div>
              )}
            </div>
          </div>

          {/* Friends Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Friends</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Add Friend */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Add Friend</h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      placeholder="Enter friend's email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={searchResult.imageUrl || '/default-avatar.png'}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {searchResult.firstName} {searchResult.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{searchResult.email}</p>
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
                  <h3 className="text-md font-medium text-gray-900 mb-4">Friend Requests ({receivedRequests.length})</h3>
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div key={request.clerkId} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.imageUrl || '/default-avatar.png'}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {request.firstName} {request.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{request.email}</p>
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
                  <h3 className="text-md font-medium text-gray-900 mb-4">Sent Requests ({sentRequests.length})</h3>
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div key={request.clerkId} className="p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.imageUrl || '/default-avatar.png'}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {request.firstName} {request.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{request.email}</p>
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
                <h3 className="text-md font-medium text-gray-900 mb-4">My Friends ({friends.length})</h3>
                {friendsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.clerkId} className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={friend.imageUrl || '/default-avatar.png'}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {friend.firstName} {friend.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{friend.email}</p>
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
                  <p className="text-gray-600 text-sm">No friends yet. Search for users to add them as friends!</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
              <button
                onClick={resetToDefaults}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset to Defaults
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Platform Preferences */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Platform Preferences</h3>
                <p className="text-sm text-gray-600 mb-4">Select which platforms you want to see contests from:</p>
                <div className="space-y-3">
                  {[
                    { key: 'codeforces' as keyof UserPreferences, label: 'Codeforces', color: 'text-red-600', bgColor: 'bg-red-50' },
                    { key: 'codechef' as keyof UserPreferences, label: 'CodeChef', color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    { key: 'leetcode' as keyof UserPreferences, label: 'LeetCode', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                    { key: 'geeksforgeeks' as keyof UserPreferences, label: 'GeeksforGeeks', color: 'text-green-600', bgColor: 'bg-green-50' }
                  ].map((platform) => (
                    <div key={platform.key} className={`flex items-center p-3 rounded-lg ${preferences[platform.key] ? platform.bgColor : 'bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        id={platform.key}
                        checked={preferences[platform.key]}
                        onChange={(e) => handlePreferenceChange(platform.key, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={platform.key} className={`ml-3 block text-sm font-medium ${platform.color}`}>
                        {platform.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <p className="text-sm text-gray-600 mb-4">Choose how you want to be notified about contests:</p>
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={preferences.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-3 block text-sm text-gray-900">
                      Email notifications for new contests
                    </label>
                  </div>
                  <div className="flex items-center p-3 rounded-lg bg-gray-50">
                    <input
                      type="checkbox"
                      id="reminders"
                      checked={preferences.reminders}
                      onChange={(e) => handlePreferenceChange('reminders', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="reminders" className="ml-3 block text-sm text-gray-900">
                      Contest reminders (1 hour before)
                    </label>
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-md border ${
                  message.includes('successfully') || message.includes('Reset') 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
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
              )}

              {/* Save Button */}
              <div className="pt-4 space-y-3">
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
                    'Save Preferences'
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