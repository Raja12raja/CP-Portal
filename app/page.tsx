'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth, SignOutButton } from '@clerk/nextjs'

export default function Home() {
  const { isSignedIn } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CP Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              {isSignedIn ? (
                <SignOutButton>
                  <Button variant="outline">Sign Out</Button>
                </SignOutButton>
              ) : (
                <Link href="/sign-in">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Track Competitive Programming
            <span className="text-blue-600"> Contests</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Never miss another programming contest! Get real-time updates on upcoming contests from 
            Codeforces, CodeChef, LeetCode, and GeeksforGeeks all in one place.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="px-8">
                    Get Started
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="px-8">
                    View Contests
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
            <p className="text-gray-600">Get instant notifications about new contests and schedule changes</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Multiple Platforms</h3>
            <p className="text-gray-600">Track contests from Codeforces, CodeChef, LeetCode, and GeeksforGeeks</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Filtering</h3>
            <p className="text-gray-600">Filter contests by platform, difficulty, and time to find what you need</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h10v-2H4v2zM4 11h14v-2H4v2zM4 7h18v-2H4v2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Personalized</h3>
            <p className="text-gray-600">Save your favorite platforms and get personalized contest recommendations</p>
          </div>
        </div>
      </div>
    </div>
  )
} 