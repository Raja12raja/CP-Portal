'use client'

import { useState, useEffect } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
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
  isRegistered?: boolean
}

export default function Dashboard() {
  const { user } = useUser()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // New filters
  const [searchTerm, setSearchTerm] = useState('')
  const [durationFilter, setDurationFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('startTime')

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
        const contestsData = data.data
        if (!user?.id) return
        const regRes = await fetch(`/api/users/${user.id}/registered-contests`)
        const regData = await regRes.json()
        const registeredUrls = new Set((regData.data || []).map((c: Contest) => c.url))

        const enriched = contestsData.map((c: Contest) => ({
          ...c,
          isRegistered: registeredUrls.has(c.url)
        }))
        setContests(enriched)
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

  const handleRegister = async (contest: Contest) => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/users/${user.id}/registered-contests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contest })
      })
      const data = await res.json()
      console.log('Register response:', data)
      if (res.ok) {
        setContests(prev =>
          prev.map(c => c.url === contest.url ? { ...c, isRegistered: true } : c)
        )
      } else {
        alert(data.error || 'Failed to register.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to register.')
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
      codeforces: 'bg-red-100 text-red-800 border-red-200',
      codechef: 'bg-orange-100 text-orange-800 border-orange-200',
      leetcode: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      geeksforgeeks: 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
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

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-600'
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
      beginner: 'bg-blue-100 text-blue-700',
      intermediate: 'bg-purple-100 text-purple-700',
      advanced: 'bg-red-100 text-red-700'
    }
    return colors[difficulty.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const platforms = [
    { value: 'all', label: 'All Platforms' },
    { value: 'codeforces', label: 'Codeforces' },
    { value: 'codechef', label: 'CodeChef' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'geeksforgeeks', label: 'GeeksforGeeks' }
  ]

  const durationOptions = [
    { value: 'all', label: 'All Durations' },
    { value: 'short', label: 'Short (< 2h)' },
    { value: 'medium', label: 'Medium (2-4h)' },
    { value: 'long', label: 'Long (> 4h)' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ]

  const sortOptions = [
    { value: 'startTime', label: 'Start Time' },
    { value: 'duration', label: 'Duration' },
    { value: 'name', label: 'Name' },
    { value: 'platform', label: 'Platform' }
  ]

  // Filter and sort contests
  const filteredContests = contests
    .filter(contest => {
      // Search filter
      if (searchTerm && !contest.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Duration filter
      if (durationFilter !== 'all') {
        const hours = contest.duration / 60
        if (durationFilter === 'short' && hours >= 2) return false
        if (durationFilter === 'medium' && (hours < 2 || hours > 4)) return false
        if (durationFilter === 'long' && hours <= 4) return false
      }

      // Date range filter
      if (dateRange !== 'all') {
        const contestDate = new Date(contest.startTime)
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        if (dateRange === 'today' && contestDate.toDateString() !== now.toDateString()) return false
        if (dateRange === 'tomorrow' && contestDate.toDateString() !== tomorrow.toDateString()) return false
        if (dateRange === 'week' && contestDate > weekEnd) return false
        if (dateRange === 'month' && contestDate > monthEnd) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'startTime':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        case 'duration':
          return a.duration - b.duration
        case 'name':
          return a.name.localeCompare(b.name)
        case 'platform':
          return a.platform.localeCompare(b.platform)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contests...</p>
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
                <p className="text-2xl font-bold text-gray-900">{filteredContests.length}</p>
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

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full border  text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search and Upcoming Toggle */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Contests
              </label>
              <input
                type="text"
                placeholder="Search by contest name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

        {/* Contests Grid */}
        <div className="bg-white rounded-lg shadow">
          {filteredContests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600">No contests found.</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map((contest) => (
                  <div key={contest._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Platform Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="mr-2">{getPlatformIcon(contest.platform)}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPlatformColor(contest.platform)}`}>
                            {contest.platform}
                          </span>
                        </div>
                        {contest.isRated && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Rated
                          </span>
                        )}
                      </div>

                      {/* Contest Name */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {contest.name}
                      </h3>

                      {/* Description */}
                      {contest.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {contest.description}
                        </p>
                      )}

                      {/* Difficulty */}
                      {contest.difficulty && (
                        <div className="mb-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(contest.difficulty)}`}>
                            {contest.difficulty}
                          </span>
                        </div>
                      )}

                      {/* Contest Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Start:</span>
                          <span className="ml-1">{formatDate(contest.startTime)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Duration:</span>
                          <span className="ml-1">{formatDuration(contest.duration)}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <a
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center block"
                      >
                        View Contest →
                      </a>
                      {contest.isRegistered ? (
                        <button className="w-full bg-red-600 text-white mt-4 px-4 py-2 rounded-md" disabled>✅ Registered</button>
                      ) :
                        (
                          <button onClick={() => handleRegister(contest)} className="w-full bg-green-600 text-white mt-4 px-4 py-2 rounded-md">Register</button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 