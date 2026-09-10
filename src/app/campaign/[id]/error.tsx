// Error boundary for Campaign Dashboard
// Handles navigation and data loading failures per Req 8.5

'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CampaignError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Campaign page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Failed to Load Campaign
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't load this campaign dashboard. This might be because:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>The campaign doesn't exist or was deleted</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>There was a database connection issue</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>The page took longer than 5 seconds to load</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>An unexpected error occurred</span>
                </li>
              </ul>
            </div>

            {/* Error Details (for development) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-xs font-mono text-red-800 break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              
              <Link
                href="/"
                className="w-full px-6 py-3 rounded-full border-2 border-gray-300 text-gray-900 font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            If this problem persists, you can try creating a new campaign from the home page.
          </p>
        </div>
      </div>
    </div>
  )
}
