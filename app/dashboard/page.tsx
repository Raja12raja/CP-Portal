'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

interface Contest {
  _id: string
  name: string
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks'
  startTime: string
  endTime: string
  duration: number
  url: string
  description?: string
  difficulty?: string
  isRated?: boolean
}

export default function Dashboard() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch contests when component mounts or filters change
  useEffect(() => {
    fetchContests()
  }, [selectedPlatform, showUpcoming])

  const fetchContests = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams()
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      if (showUpcoming) {
        params.append('upcoming', 'true')
      }
      
      console.log('Fetching contests with params:', params.toString())
      const response = await fetch(`/api/contests?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setContests(data.data)
        setLastUpdated(new Date())
        console.log(`Fetched ${data.data.length} contests`)
      } else {
        setError(data.error || 'Failed to fetch contests')
        console.error('API error:', data.error)
      }
    } catch (error) {
      console.error('Error fetching contests:', error)
      setError('Failed to load contests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 0) {
      return `Started ${Math.abs(Math.floor(diffInHours))}h ago`
    } else if (diffInHours < 24) {
      return `In ${Math.floor(diffInHours)}h (${date.toLocaleString()})`
    } else {
      return date.toLocaleString()
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getPlatformColor = (platform: string) => {
    const colors = {
      codeforces: 'bg-red-100 text-red-800',
      codechef: 'bg-orange-100 text-orange-800',
      leetcode: 'bg-yellow-100 text-yellow-800',
      geeksforgeeks: 'bg-green-100 text-green-800'
    }
    return colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      codeforces: '🔴',
      codechef: '🟠',
      leetcode: '🟡',
      geeksforgeeks: '🟢'
    }
    return icons[platform as keyof typeof icons] || '⚫'
  }

  const platforms = [
    { value: 'all', label: 'All Platforms' },
    { value: 'codeforces', label: 'Codeforces' },
    { value: 'codechef', label: 'CodeChef' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'geeksforgeeks', label: 'GeeksforGeeks' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CP Portal Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-700 hover:text-gray-900">
                Profile
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Stats and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contests</p>
                <p className="text-2xl font-bold text-gray-900">{contests.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Platforms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(contests.map(c => c.platform)).size}
                </p>
              </div>
              {lastUpdated && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-900">{lastUpdated.toLocaleTimeString()}</p>
                </div>
              )}
            </div>
            <button
              onClick={fetchContests}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="upcoming"
                checked={showUpcoming}
                onChange={(e) => setShowUpcoming(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="upcoming" className="ml-2 block text-sm text-gray-900">
                Show upcoming contests only
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading contests</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contests List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading contests...</p>
            </div>
          ) : contests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600">No contests found.</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or refresh the page.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contests.map((contest) => (
                    <tr key={contest._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contest.name}
                          </div>
                          {contest.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {contest.description}
                            </div>
                          )}
                          {contest.difficulty && (
                            <div className="text-xs text-gray-400 mt-1">
                              Difficulty: {contest.difficulty}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getPlatformIcon(contest.platform)}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlatformColor(contest.platform)}`}>
                            {contest.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(contest.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(contest.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={contest.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Contest →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 