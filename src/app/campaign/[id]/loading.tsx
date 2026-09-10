// Loading state for Campaign Dashboard
// Shows while the campaign data is being fetched
// Implements timeout detection per Req 8.5

'use client'

import { useEffect, useState } from 'react'

export default function CampaignLoading() {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  useEffect(() => {
    // Set a 5-second timeout to show warning message per Req 8.5
    const timeoutId = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Loading Spinner */}
        <div className="mx-auto mb-6 h-16 w-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        {/* Loading Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Loading Campaign
        </h2>
        <p className="text-gray-600 mb-6">
          {showTimeoutWarning 
            ? 'This is taking longer than expected...'
            : 'Please wait while we fetch your campaign data'
          }
        </p>

        {/* Timeout Warning */}
        {showTimeoutWarning && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-left">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Loading is taking longer than expected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The campaign dashboard is still loading. This might happen if:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>The campaign is still being generated</li>
                    <li>There's a temporary network issue</li>
                    <li>The database is experiencing high load</li>
                  </ul>
                  <p className="mt-2">
                    If this message persists, try refreshing the page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {!showTimeoutWarning && (
          <div className="mt-6 text-sm text-gray-500">
            <p>💡 Your campaign is being created by our AI pipeline</p>
            <p className="mt-1">This usually takes a few seconds</p>
          </div>
        )}
      </div>
    </div>
  )
}
