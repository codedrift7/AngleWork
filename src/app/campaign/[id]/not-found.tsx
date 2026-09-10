// Not Found page for Campaign Dashboard
// Displayed when a campaign ID doesn't exist

import Link from 'next/link'

export default function CampaignNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Not Found Card */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
              />
            </svg>
          </div>

          {/* Message */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Campaign Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The campaign you're looking for doesn't exist or has been deleted.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/campaign/new"
                className="w-full px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors text-center"
              >
                Create New Campaign
              </Link>
              
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
            Double-check the URL or create a new campaign to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
