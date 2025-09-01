'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Moon, Sun, ExternalLink, Mail, Bell } from 'lucide-react'

/* ---------- Types ---------- */
interface UserPreferences {
    emailNotifications?: boolean
    reminders?: boolean
}

interface UserLinks {
    codeforces?: string
    codechef?: string
    leetcode?: string
    geeksforgeeks?: string
}

const platformUrls: Record<string, string> = {
    codeforces: 'https://codeforces.com/profile/',
    codechef: 'https://www.codechef.com/users/',
    leetcode: 'https://leetcode.com/u/',
    geeksforgeeks: 'https://auth.geeksforgeeks.org/user/',
}

interface CodeforcesStats {
    rating?: number
    maxRating?: number
    rank?: string
}

interface UserProfileData {
    clerkId: string
    firstName?: string
    lastName?: string
    username?: string
    imageUrl?: string
    preferences?: UserPreferences
    userLinks?: UserLinks
    codeforcesStats?: CodeforcesStats
    createdAt?: string
    updatedAt?: string
}

/* ---------- Helpers ---------- */
const apiCallWithToken = async (endpoint: string, token: string | null, init: RequestInit = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const res = await fetch(endpoint, { ...init, headers })
    const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
    return json
}

/* ---------- Small presentational components ---------- */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
)

const StatCard: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value ?? '—'}</p>
    </div>
)

const LinkBadge: React.FC<{ platform: string; username?: string }> = ({ platform, username }) => {
    if (!username) return null
    const url = platformUrls[platform] ?? ''
    return (
        <a
            href={`${url}${username}`}
            rel="noopener noreferrer"
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:underline transition"
            aria-label={`${platform} profile`}
        >
            <span className="capitalize">{platform}</span>
            <ExternalLink className="w-4 h-4" />
        </a>
    )
}

/* ---------- Main component ---------- */
export default function FriendProfile({ params }: { params: { userId: string } }) {
    const { getToken } = useAuth()
    const { user } = useUser()
    const [profile, setProfile] = useState<UserProfileData | null>(null)
    const [isOwnProfile, setIsOwnProfile] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [darkMode, setDarkMode] = useState(false)

    // fetch profile
    const fetchProfile = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const token = await getToken()
            const json = await apiCallWithToken(`/api/users/${params.userId}`, token, {})
            // expected shape: { success: true, data: {...}, isOwnProfile: boolean }
            setProfile(json.data ?? null)
            setIsOwnProfile(Boolean(json.isOwnProfile))
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load profile')
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }, [params.userId, getToken])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    // apply darkmode to document (persist to localStorage)
    useEffect(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null
        if (saved !== null) setDarkMode(JSON.parse(saved))
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') localStorage.setItem('darkMode', JSON.stringify(darkMode))
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    /* ---------- render states ---------- */
    if (loading) {
        return (
            <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Friend Profile</h1>
                        <button
                            onClick={() => setDarkMode((s) => !s)}
                            aria-label="Toggle dark mode"
                            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-gray-600'} shadow`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-24 h-24 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-6 w-3/5 rounded-md" />
                                    <Skeleton className="h-4 w-1/2 rounded-md" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl shadow-lg">
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-1/3 rounded-md" />
                                <div className="grid grid-cols-3 gap-3">
                                    <Skeleton className="h-16 rounded-lg" />
                                    <Skeleton className="h-16 rounded-lg" />
                                    <Skeleton className="h-16 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="max-w-3xl mx-auto text-center">
                    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Error</h2>
                        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
                        <div className="mt-4 flex justify-center gap-3">
                            <button onClick={fetchProfile} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                                Retry
                            </button>
                            <Link href="/profile" className="px-4 py-2 rounded-lg border text-gray-700">
                                Go Back
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="max-w-3xl mx-auto text-center">
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No profile found.</p>
                    <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Link
                            href="/profile"
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Back to My Profile
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    /* ---------- UI layout when profile exists ---------- */
    const prefs = profile.preferences ?? {}
    const links = profile.userLinks ?? {}

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold">Friend Profile</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isOwnProfile ? 'This is your profile' : 'Viewing friend profile'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                            <div className="text-gray-500 dark:text-gray-400">Last updated</div>
                            <div className="font-medium">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : '—'}</div>
                        </div>

                        <button
                            onClick={() => setDarkMode((s) => !s)}
                            aria-label="Toggle dark mode"
                            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-gray-600'} shadow`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left column - profile + links + stats */}
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow p-6`}>
                        <div className="flex items-center gap-4">
                            <img
                                src={profile.imageUrl || '/default-avatar.png'}
                                alt={profile.username || 'Profile'}
                                className="w-24 h-24 rounded-full object-cover ring-2 ring-offset-2 ring-blue-500"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-semibold">{profile.username ?? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`}</h2>
                                    {isOwnProfile && <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">You</span>}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.firstName ?? ''} {profile.lastName ?? ''}</p>
                                <p className="mt-2 text-xs text-gray-400">{profile.clerkId}</p>
                            </div>
                        </div>

                        {/* Platform Links */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium mb-3">Platform Profiles</h3>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                                <LinkBadge platform="codeforces" username={links.codeforces} />
                                <LinkBadge platform="codechef" username={links.codechef} />
                                <LinkBadge platform="leetcode" username={links.leetcode} />
                                <LinkBadge platform="geeksforgeeks" username={links.geeksforgeeks} />
                                {!links.codeforces && !links.codechef && !links.leetcode && !links.geeksforgeeks && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No platform usernames shared</p>
                                )}
                            </div>
                        </div>

                        {/* Codeforces Stats */}
                        {profile.codeforcesStats && (
                            <div className="mt-6">
                                <h3 className="text-sm font-medium mb-3">Codeforces Stats</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <StatCard label="Rating" value={profile.codeforcesStats.rating ?? 'Unrated'} />
                                    <StatCard label="Max Rating" value={profile.codeforcesStats.maxRating ?? '—'} />
                                    <StatCard label="Rank" value={profile.codeforcesStats.rank ?? '—'} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column - preferences, actions, meta */}
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow p-6 space-y-6`}>
                        {/* Preferences */}
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Notification Preferences</h3>
                                <div className="text-xs text-gray-500 dark:text-gray-400">View only</div>
                            </div>

                            <div className="mt-3 space-y-3">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <Mail className="w-5 h-5 text-gray-500" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">Email notifications</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">For new contests</div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${prefs.emailNotifications ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                        {prefs.emailNotifications ? 'On' : 'Off'}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <Bell className="w-5 h-5 text-gray-500" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">Reminders</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Contest reminders (1 hour)</div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${prefs.reminders ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                        {prefs.reminders ? 'On' : 'Off'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Meta / Actions */}
                        <div>
                            <h3 className="text-sm font-medium mb-3">Actions</h3>
                            <div className="flex gap-3 flex-wrap">
                                <button onClick={() => fetchProfile()} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                                    Refresh
                                </button>

                                <Link href="/profile" className="px-4 py-2 rounded-lg border text-gray-700">
                                    Back to My Profile
                                </Link>
                            </div>
                        </div>

                        {/* Joined / Updated */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Joined</div>
                            <div className="font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>

                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Profile last updated</div>
                            <div className="font-medium">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '—'}</div>
                        </div>
                    </div>
                </div>

                {/* Friend status bottom card */}
                <div className="mt-6">
                    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-3">
                            <svg className={`w-5 h-5 ${darkMode ? 'text-green-300' : 'text-green-600'}`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.61.02-.95.06 1.16.84 1.95 1.98 1.95 3.44V19h6v-2.5C22 14.17 17.33 13 16 13z" />
                            </svg>
                            <div className={`${darkMode ? 'text-green-300' : 'text-green-800'} font-medium`}>You are friends with this user</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
