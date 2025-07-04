import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { UserProvider } from './components/UserProvider'
import { initializeServices } from '../lib/startup'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CP Portal - Competitive Programming Contests',
  description: 'Track upcoming programming contests from Codeforces, CodeChef, LeetCode, and GeeksforGeeks',
}

// Initialize services on server startup
if (typeof window === 'undefined') {
  // Only run on server side
  initializeServices();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <UserProvider>
            {children}
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  )
} 