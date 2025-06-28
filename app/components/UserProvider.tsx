'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth()

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (isSignedIn && userId) {
        try {
          console.log('Checking if user exists in database...')
          
          // First check if user exists
          const userResponse = await fetch('/api/user')
          
          if (userResponse.status === 404) {
            // User doesn't exist, create them
            console.log('User not found, creating in database...')
            const createResponse = await fetch('/api/user/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (createResponse.ok) {
              console.log('✅ User created successfully in database')
            } else {
              console.error('❌ Failed to create user in database')
            }
          } else if (userResponse.ok) {
            console.log('✅ User already exists in database')
          }
        } catch (error) {
          console.error('Error checking/creating user:', error)
        }
      }
    }

    createUserIfNeeded()
  }, [isSignedIn, userId])

  return <>{children}</>
} 