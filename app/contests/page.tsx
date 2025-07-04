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
  const [showPastContests, setShowPastContests] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  // New filters
  const [searchTerm, setSearchTerm] = useState('')
  const [durationFilter, setDurationFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('startTime')

  // Fetch contests when component mounts or filters change
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark')
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    fetchContests()
  }, [selectedPlatform, showUpcoming, showPastContests])

  const fetchContests = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      if (showUpcoming && !showPastContests) {
        params.append('upcoming', 'true')
      }
      if (showPastContests) {
        params.append('includePast', 'true')
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

    // Check if contest has already started
    const now = new Date()
    const contestStartTime = new Date(contest.startTime)
    const contestEndTime = new Date(contest.endTime)

    if (now >= contestEndTime) {
      alert('This contest has already ended. Registration is not possible.')
      return
    }

    if (now >= contestStartTime) {
      alert('This contest has already started. Registration is not possible.')
      return
    }

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
    if (!difficulty) return darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
    const lightColors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
      beginner: 'bg-blue-100 text-blue-700',
      intermediate: 'bg-purple-100 text-purple-700',
      advanced: 'bg-red-100 text-red-700'
    }

    const darkColors = {
      easy: 'bg-green-900/30 text-green-400',
      medium: 'bg-yellow-900/30 text-yellow-400',
      hard: 'bg-red-900/30 text-red-400',
      beginner: 'bg-blue-900/30 text-blue-400',
      intermediate: 'bg-purple-900/30 text-purple-400',
      advanced: 'bg-red-900/30 text-red-400'
    }

    const colors = darkMode ? darkColors : lightColors
    return colors[difficulty.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const getContestStatus = (contest: Contest) => {
    const now = new Date()
    const startTime = new Date(contest.startTime)
    const endTime = new Date(contest.endTime)

    if (now >= endTime) {
      return { status: 'ended', label: 'Contest Ended', color: 'bg-gray-500', disabled: true }
    } else if (now >= startTime) {
      return { status: 'ongoing', label: 'Contest Ongoing', color: 'bg-orange-500', disabled: true }
    } else {
      return { status: 'upcoming', label: 'Register', color: 'bg-green-600', disabled: false }
    }
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

  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
    headerBg: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    textTertiary: darkMode ? 'text-gray-500' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-black',
    shadow: darkMode ? 'shadow-lg shadow-gray-900/50' : 'shadow',
    hover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={themeClasses.textSecondary}>Loading contests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${themeClasses.headerBg} shadow-lg border-b ${themeClasses.border} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className={`text-xl font-bold ${themeClasses.text} hover:text-blue-500 transition-colors`}>CP Portal Dashboard</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/problems" className={`${themeClasses.textSecondary} hover:text-blue-500 transition-colors font-medium`}>
                Problems
              </Link>
              <Link href="/profile" className={`${themeClasses.textSecondary} hover:text-blue-500 transition-colors font-medium`}>
                Profile
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${themeClasses.hover} transition-colors duration-200`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Stats and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className={`${themeClasses.cardBg} rounded-xl ${themeClasses.shadow} p-6 mb-6 border ${themeClasses.border} transition-all duration-300`}>
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Total Contests</p>
                <p className={`text-3xl font-bold ${themeClasses.text} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>{filteredContests.length}</p>
              </div>
              <div>
                <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Platforms</p>
                <p className={`text-3xl font-bold ${themeClasses.text} bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent`}>
                  {new Set(contests.map(c => c.platform)).size}
                </p>
              </div>
              {lastUpdated && (
                <div>
                  <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Last Updated</p>
                  <p className={`text-sm ${themeClasses.text} font-semibold`}>{lastUpdated.toLocaleTimeString()}</p>
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
        <div className={`${themeClasses.cardBg} rounded-xl ${themeClasses.shadow} p-6 mb-6 border ${themeClasses.border} transition-all duration-300`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Platform Filter */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className={`w-full border ${themeClasses.input} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
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
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Duration
              </label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className={`w-full border ${themeClasses.input} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
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
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`w-full border ${themeClasses.input} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
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
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Sort By
              </label>
              <select
                value={dateRange}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full border ${themeClasses.input} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
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
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Search Contests
              </label>
              <input
                type="text"
                placeholder="Search by contest name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border ${themeClasses.input} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="upcoming"
                  checked={showUpcoming}
                  onChange={(e) => setShowUpcoming(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="upcoming" className={`ml-3 block text-sm ${themeClasses.text} font-medium`}>
                  Show upcoming contests only
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pastContests"
                  checked={showPastContests}
                  onChange={(e) => setShowPastContests(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pastContests" className={`ml-3 block text-sm ${themeClasses.text} font-medium`}>
                  Show past contests
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-xl p-4 mb-6 transition-colors duration-300`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                  Error loading contests
                </h3>
                <div className={`mt-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contests Grid */}
        <div className={`${themeClasses.cardBg} rounded-xl ${themeClasses.shadow} border ${themeClasses.border} transition-all duration-300`}>
          {filteredContests.length === 0 ? (
            <div className="p-8 text-center">
              <div className={`${themeClasses.textSecondary} mb-4`}>
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className={`${themeClasses.text} text-lg font-medium mb-2`}>No contests found.</p>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map((contest) => (
                  <div key={contest._id} className={`${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:shadow-md'} border rounded-lg shadow-sm transition-shadow`}>
                    <div className="p-6">
                      {/* Platform Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="mr-2">{getPlatformIcon(contest.platform)}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPlatformColor(contest.platform)}`}>
                            {contest.platform}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {contest.isRated && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Rated
                            </span>
                          )}
                          {(() => {
                            const status = getContestStatus(contest)
                            if (status.status === 'ended') {
                              return (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                  Ended
                                </span>
                              )
                            } else if (status.status === 'ongoing') {
                              return (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">
                                  Live
                                </span>
                              )
                            } else {
                              return (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
                                  Upcoming
                                </span>
                              )
                            }
                          })()}
                        </div>
                      </div>

                      {/* Contest Name */}
                      <h3 className={`${darkMode
                        ? 'text-lg text-white font-semibold mb-2 line-clamp-2'
                        : 'text-lg font-semibold text-gray-900 mb-2 line-clamp-2'
                        }`} >
                        {contest.name}
                      </h3>

                      {/* Description */}
                      {contest.description && (
                        <p className={`${darkMode ? 'text-gray-200' : 'text-gray-600'} text-sm mb-3 line-clamp-2`}>
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
                        <div className={`flex items-center text-sm ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Start:</span>
                          <span className="ml-1">{formatDate(contest.startTime)}</span>
                        </div>
                        <div className={`flex items-center text-sm ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
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
                      {(() => {
                        const status = getContestStatus(contest)
                        if (contest.isRegistered) {
                          return (
                            <button className="w-full bg-red-600 text-white mt-4 px-4 py-2 rounded-md" disabled>
                              ✅ Registered
                            </button>
                          )
                        } else if (status.disabled) {
                          return (
                            <button className={`w-full ${status.color} text-white mt-4 px-4 py-2 rounded-md`} disabled>
                              {status.label}
                            </button>
                          )
                        } else {
                          return (
                            <button
                              onClick={() => handleRegister(contest)}
                              className={`w-full ${status.color} text-white mt-4 px-4 py-2 rounded-md hover:opacity-90 transition-opacity`}
                            >
                              {status.label}
                            </button>
                          )
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  )
} 