'use client'

import { MessagingAngle } from '@/lib/types/campaign'
import { selectMessagingAngle } from '@/actions/campaign'
import { useState, useTransition } from 'react'

interface PositioningStrategySelectorProps {
  messagingAngles: MessagingAngle[]
  selectedAngleIndex: number | null
  campaignId: string
}

/**
 * PositioningStrategySelector displays three messaging angles and allows the user to select one.
 * The selection triggers the next stage of the pipeline (AIDA Strategy generation).
 * 
 * Requirements: 3.3, 3.4
 */
export function PositioningStrategySelector({
  messagingAngles,
  selectedAngleIndex,
  campaignId
}: PositioningStrategySelectorProps) {
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(selectedAngleIndex)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const angleTypeLabels: Record<string, string> = {
    pain: 'Pain-Focused',
    outcome: 'Outcome-Focused',
    time: 'Time/Effort-Focused'
  }

  const angleTypeColors: Record<string, { border: string; bg: string; badge: string }> = {
    pain: {
      border: 'border-red-300',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-800 border-red-200'
    },
    outcome: {
      border: 'border-green-300',
      bg: 'bg-green-50',
      badge: 'bg-green-100 text-green-800 border-green-200'
    },
    time: {
      border: 'border-blue-300',
      bg: 'bg-blue-50',
      badge: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const handleSelectAngle = (index: number) => {
    if (localSelectedIndex !== null) {
      // Selection already made, don't allow change
      return
    }

    setError(null)
    setLocalSelectedIndex(index)

    // Call server action to persist selection and trigger pipeline
    startTransition(async () => {
      try {
        const result = await selectMessagingAngle(campaignId, index)
        
        if (!result.success) {
          setError(result.error)
          setLocalSelectedIndex(null) // Reset on error
        }
      } catch (err) {
        console.error('Error selecting messaging angle:', err)
        setError('Failed to select messaging angle. Please try again.')
        setLocalSelectedIndex(null) // Reset on error
      }
    })
  }

  const isDisabled = localSelectedIndex !== null || isPending

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold mb-2">Choose Your Messaging Angle</h2>
        <p className="text-gray-600">
          Select the angle that best fits your brand and resonates with your audience. 
          This will anchor all campaign assets.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {messagingAngles.map((angle, index) => {
          const isSelected = localSelectedIndex === index
          const colors = angleTypeColors[angle.type]

          return (
            <button
              key={index}
              onClick={() => handleSelectAngle(index)}
              disabled={isDisabled}
              className={`
                relative text-left border-2 rounded-lg p-6 transition-all duration-200
                ${isSelected 
                  ? `${colors.border} ${colors.bg} ring-2 ring-offset-2 ring-${angle.type === 'pain' ? 'red' : angle.type === 'outcome' ? 'green' : 'blue'}-500`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isPending && isSelected ? 'animate-pulse' : ''}
              `}
              aria-pressed={isSelected}
              aria-label={`Select ${angleTypeLabels[angle.type]} messaging angle`}
            >
              {/* Badge with angle type */}
              <div className="mb-3">
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                  ${isSelected ? colors.badge : 'bg-gray-100 text-gray-700 border-gray-200'}
                `}>
                  {angleTypeLabels[angle.type]}
                </span>
              </div>

              {/* Tagline */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                "{angle.tagline}"
              </h3>

              {/* Core Message */}
              <p className="text-gray-700 mb-4 leading-relaxed">
                {angle.coreMessage}
              </p>

              {/* Rationale */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Why This Angle?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {angle.rationale}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${angle.type === 'pain' ? 'bg-red-500' : angle.type === 'outcome' ? 'bg-green-500' : 'bg-blue-500'}
                  `}>
                    <svg 
                      className="w-5 h-5 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {isPending && isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 font-medium">Processing selection...</p>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {localSelectedIndex !== null && !isPending && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✓ Messaging angle selected! Building your AIDA strategy...
          </p>
        </div>
      )}
    </div>
  )
}
