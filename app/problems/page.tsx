'use client'

import { useState, useEffect } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface Problem {
  _id: string
  title: string
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks'
  problemId: string
  url: string
  difficulty: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  category?: string
  acceptanceRate?: number
  totalSubmissions?: number
  solvedCount?: number
  contestId?: string
  contestName?: string
  timeLimit?: number
  memoryLimit?: number
  description?: string
  constraints?: string
  examples?: Array<{
    input: string
    output: string
    explanation?: string
  }>
  isPremium?: boolean
  isRated?: boolean
  lastUpdated: string
  userStatus?: 'not_started' | 'attempted' | 'solved' | 'solved_optimally'
  isFavorite?: boolean
}

export default function ProblemsDashboard(): JSX.Element {
  const { user } = useUser()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [darkMode, setDarkMode] = useState<boolean>(false)

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showPremium, setShowPremium] = useState<boolean>(true)
  const [showRated, setShowRated] = useState<boolean>(true)
  const [showFavorites, setShowFavorites] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<string>('asc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  // Available filters
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const itemsPerPage: number = 20

  // Fetch problems when component mounts or filters change
  useEffect(() => {
    fetchProblems()
  }, [selectedPlatform, selectedDifficulty, selectedCategory, selectedTag, searchTerm, showPremium, showRated, showFavorites, sortBy, sortOrder, currentPage])

  const fetchProblems = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      if (selectedDifficulty !== 'all') {
        params.append('difficulty', selectedDifficulty)
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (selectedTag !== 'all') {
        params.append('tag', selectedTag)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (!showPremium) {
        params.append('premium', 'false')
      }
      if (!showRated) {
        params.append('rated', 'false')
      }
      if (showFavorites && user?.id) {
        params.append('favorites', 'true')
        params.append('userId', user.id)
      }
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('limit', itemsPerPage.toString())
      params.append('skip', ((currentPage - 1) * itemsPerPage).toString())

      console.log('Fetching problems with params:', params.toString())
      const response = await fetch(`/api/problems?${params}`)
      const data = await response.json()

      if (data.success) {
        const problemsData = data.data

        // Fetch user progress and favorites if logged in
        if (user?.id) {
          const [userProblemsRes, favoritesRes] = await Promise.all([
            fetch(`/api/users/${user.id}/problems`),
            fetch(`/api/users/${user.id}/favorites`)
          ])

          const [userProblemsData, favoritesData] = await Promise.all([
            userProblemsRes.json(),
            favoritesRes.json()
          ])

          const userProblemsMap = new Map()
          const favoritesSet = new Set()

          if (userProblemsData.success) {
            userProblemsData.data.forEach((up: any) => {
              userProblemsMap.set(up.problemId, up.status)
            })
          }

          if (favoritesData.success) {
            favoritesData.data.forEach((fav: any) => {
              favoritesSet.add(fav.problemId)
            })
          }

          let enriched = problemsData.map((p: Problem) => ({
            ...p,
            userStatus: userProblemsMap.get(p.problemId) || 'not_started',
            isFavorite: favoritesSet.has(p.problemId)
          }))

          // Filter favorites on client side if needed
          if (showFavorites) {
            enriched = enriched.filter((p: Problem) => p.isFavorite)
          }

          setProblems(enriched)
        } else {
          setProblems(problemsData)
        }

        setHasMore(data.pagination?.hasMore || false)
        setAvailableCategories(data.filters?.categories || [])
        setAvailableTags(data.filters?.tags || [])
        setLastUpdated(new Date())
        console.log(`Fetched ${data.data.length} problems`)
      } else {
        setError(data.error || 'Failed to fetch problems')
        console.error('API error:', data.error)
      }
    } catch (error) {
      console.error('Error fetching problems:', error)
      setError('Failed to load problems. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProblemStatusUpdate = async (problemId: string, status: string): Promise<void> => {
    if (!user?.id) return

    try {
      const res = await fetch(`/api/users/${user.id}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, status })
      })

      if (res.ok) {
        // Update local state
        setProblems(prev =>
          prev.map(p => p.problemId === problemId ? { ...p, userStatus: status as Problem['userStatus'] } : p)
        )
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update problem status.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to update problem status.')
    }
  }

  const handleFavoriteToggle = async (problemId: string): Promise<void> => {
    if (!user?.id) return

    try {
      const problem = problems.find(p => p.problemId === problemId)
      const isFavorite = problem?.isFavorite || false

      const res = await fetch(`/api/users/${user.id}/favorites`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId })
      })

      if (res.ok) {
        // Update local state
        setProblems(prev =>
          prev.map(p => p.problemId === problemId ? { ...p, isFavorite: !isFavorite } : p)
        )

        // If showing favorites only and item was unfavorited, remove it from view
        if (showFavorites && isFavorite) {
          setProblems(prev => prev.filter(p => p.problemId !== problemId))
        }
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update favorite status.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to update favorite status.')
    }
  }

  const getPlatformColor = (platform: string): string => {
    const colors = {
      codeforces: darkMode ? 'bg-red-800 text-red-100 border-red-700' : 'bg-red-100 text-red-800 border-red-200',
      codechef: darkMode ? 'bg-orange-800 text-orange-100 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-200',
      leetcode: darkMode ? 'bg-yellow-800 text-yellow-100 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
      geeksforgeeks: darkMode ? 'bg-green-800 text-green-100 border-green-700' : 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[platform as keyof typeof colors] || (darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200')
  }

  const getPlatformIcon = (platform: string): string => {
    const icons = {
      codeforces: '🔴',
      codechef: '🟠',
      leetcode: '🟡',
      geeksforgeeks: '🟢'
    }
    return icons[platform as keyof typeof icons] || '⚫'
  }

  const getDifficultyColor = (difficulty: string): string => {
    const colors = {
      easy: darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-700',
      beginner: darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-700',
      medium: darkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-700',
      intermediate: darkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-700',
      hard: darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-700',
      advanced: darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-700'
    }
    return colors[difficulty.toLowerCase() as keyof typeof colors] || (darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-600')
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      not_started: darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-600',
      attempted: darkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-600',
      solved: darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-600',
      solved_optimally: darkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-600'
    }
    return colors[status as keyof typeof colors] || (darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-600')
  }

  const getStatusLabel = (status: string): string => {
    const labels = {
      not_started: 'Not Started',
      attempted: 'Attempted',
      solved: 'Solved',
      solved_optimally: 'Solved Optimally'
    }
    return labels[status as keyof typeof labels] || 'Not Started'
  }

  const platforms = [
    { value: 'all', label: 'All Platforms' },
    { value: 'codeforces', label: 'Codeforces' },
    { value: 'codechef', label: 'CodeChef' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'geeksforgeeks', label: 'GeeksforGeeks' }
  ]

  const difficulties = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ]

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'acceptanceRate', label: 'Acceptance Rate' },
    { value: 'lastUpdated', label: 'Last Updated' }
  ]

  const resetFilters = (): void => {
    setSelectedPlatform('all')
    setSelectedDifficulty('all')
    setSelectedCategory('all')
    setSelectedTag('all')
    setSearchTerm('')
    setShowPremium(true)
    setShowRated(true)
    setShowFavorites(false)
    setSortBy('title')
    setSortOrder('asc')
    setCurrentPage(1)
  }

  if (loading && problems.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading problems...</p>
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
            <div className="flex items-center space-x-4">
              <Link href="/" className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                CP Portal
              </Link>
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Problems
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/contests" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
                Contests
              </Link>
              <Link href="/profile" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
                Profile
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-md ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats and Controls */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Problems
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {problems.length}
                </p>
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Platforms
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Set(problems.map(p => p.platform)).size}
                </p>
              </div>
              {user && (
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Favorites
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {problems.filter(p => p.isFavorite).length}
                  </p>
                </div>
              )}
              {lastUpdated && (
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Last Updated
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={resetFilters}
                className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 ${darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500'
                  : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                  }`}
              >
                Reset Filters
              </button>
              <button
                onClick={fetchProblems}
                disabled={loading}
                className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode
                  ? 'bg-blue-700 text-white hover:bg-blue-600 focus:ring-blue-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  }`}
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
        </div>

        {/* Filters */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Platform Filter */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
                  }`}
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
                  }`}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
                  }`}
              >
                <option value="all">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Tag
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
                  }`}
              >
                <option value="all">All Tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search and Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Search Problems
              </label>
              <input
                type="text"
                placeholder="Search by title, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                  : 'bg-white text-black border-gray-300 placeholder-gray-500'
                  }`}
              />
            </div>

            {/* Sort By */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
                  }`}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
                  }`}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="premium"
                  checked={showPremium}
                  onChange={(e) => setShowPremium(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="premium" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  Show Premium
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rated"
                  checked={showRated}
                  onChange={(e) => setShowRated(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rated" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  Show Rated
                </label>
              </div>
              {user && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="favorites"
                    checked={showFavorites}
                    onChange={(e) => setShowFavorites(e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="favorites" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    Show Favorites ❤️
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-md p-4 mb-6`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${darkMode ? 'text-red-300' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
                  Error loading problems
                </h3>
                <div className="mt-2 text-sm">
                  <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Problems Grid */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
          {problems.length === 0 ? (
            <div className="p-8 text-center">
              <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                {showFavorites ? 'No favorite problems found.' : 'No problems found.'}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                {showFavorites
                  ? 'Start favoriting problems by clicking the heart button!'
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {problems.map((problem) => (
                  <div key={problem._id} className={`${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:shadow-md'} border rounded-lg shadow-sm transition-shadow`}>
                    <div className="p-6">
                      {/* Platform and Status Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="mr-2">{getPlatformIcon(problem.platform)}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPlatformColor(problem.platform)}`}>
                            {problem.platform}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {problem.isFavorite && (
                            <span className="text-pink-500 text-lg" title="Favorite">
                              ❤️
                            </span>
                          )}
                          {problem.isPremium && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-800'}`}>
                              Premium
                            </span>
                          )}
                          {problem.isRated && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Rated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Problem Title */}
                      <h3
                        className={`${darkMode
                          ? 'text-lg text-white font-semibold mb-2 line-clamp-2'
                          : 'text-lg font-semibold text-gray-900 mb-2 line-clamp-2'
                          }`}
                      >
                        {problem.title}
                      </h3>

                      {/* Difficulty and Category */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        {problem.category && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            {problem.category}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {problem.tags && problem.tags.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                {tag}
                              </span>
                            ))}
                            {problem.tags.length > 3 && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                +{problem.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="space-y-2 mb-4">
                        {problem.acceptanceRate !== undefined && (
                          <div
                            className={`flex items-center text-sm ${darkMode ? 'text-gray-200' : 'text-gray-600'
                              }`}
                          >
                            <span className="font-medium">Acceptance Rate:</span>
                            <span className="ml-1">{problem.acceptanceRate.toFixed(1)}%</span>
                          </div>
                        )}
                        {problem.solvedCount !== undefined && (
                          <div
                            className={`flex items-center text-sm ${darkMode ? 'text-gray-200' : 'text-gray-600'
                              }`}
                          >
                            <span className="font-medium">Solved:</span>
                            <span className="ml-1">{problem.solvedCount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* User Status */}
                      {user && (
                        <div className="mb-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(problem.userStatus || 'not_started')}`}>
                            {getStatusLabel(problem.userStatus || 'not_started')}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center block"
                        >
                          View Problem →
                        </a>

                        {user && (
                          <div className="space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleProblemStatusUpdate(problem.problemId, 'attempted')}
                                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${problem.userStatus === 'attempted'
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  }`}
                              >
                                Attempted
                              </button>
                              <button
                                onClick={() => handleProblemStatusUpdate(problem.problemId, 'solved')}
                                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${problem.userStatus === 'solved' || problem.userStatus === 'solved_optimally'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                              >
                                Solved
                              </button>
                            </div>

                            {/* Favorite Button */}
                            <button
                              onClick={() => handleFavoriteToggle(problem.problemId)}
                              className={`w-full px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center space-x-2 ${problem.isFavorite
                                ? 'bg-pink-600 text-white hover:bg-pink-700'
                                : `${darkMode
                                  ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`
                                }`}
                              title={problem.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <span>{problem.isFavorite ? '❤️' : '🤍'}</span>
                              <span>{problem.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}