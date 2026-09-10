// Loading state for Campaign Creation page

export default function NewCampaignLoading() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar Skeleton */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex-1 h-2 rounded bg-gray-300 animate-pulse" />
          ))}
        </div>

        {/* Form Card Skeleton */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i}>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-12 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200">
            <div className="h-12 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-12 w-32 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
