import { LaunchCalendar } from '@/lib/types/campaign'

interface LaunchCalendarDisplayProps {
  calendar: LaunchCalendar
}

/**
 * LaunchCalendarDisplay renders the 7-day launch calendar as an ordered list
 * showing daily actions sequenced by AIDA stage windows.
 * 
 * Requirements: 7.6
 */
export function LaunchCalendarDisplay({ calendar }: LaunchCalendarDisplayProps) {
  const stageLabels: Record<string, string> = {
    attention: 'Attention',
    interest: 'Interest',
    desire: 'Desire',
    action: 'Action'
  }

  const stageColors: Record<string, string> = {
    attention: 'bg-purple-100 text-purple-800 border-purple-200',
    interest: 'bg-blue-100 text-blue-800 border-blue-200',
    desire: 'bg-green-100 text-green-800 border-green-200',
    action: 'bg-orange-100 text-orange-800 border-orange-200'
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Launch Calendar</h2>
      
      <p className="text-gray-600 mb-6">
        Your 7-day execution plan with concrete daily actions sequenced by AIDA stages.
      </p>

      <div className="space-y-6">
        {calendar.days.map((day) => (
          <div
            key={day.dayNumber}
            className="border rounded-lg p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300">
              <h3 className="text-lg font-bold text-gray-900">
                Day {day.dayNumber}
              </h3>
              <span className="text-sm font-medium text-gray-500">
                {day.actions.length} {day.actions.length === 1 ? 'action' : 'actions'}
              </span>
            </div>

            {/* Actions List */}
            <ul className="space-y-3">
              {day.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-3">
                  {/* Action Number */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>

                  {/* Action Content */}
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium leading-relaxed">
                      {action.action}
                    </p>

                    {/* Stage Badge (if present) */}
                    {action.stage && (
                      <div className="mt-2">
                        <span
                          className={`
                            inline-block px-2 py-1 rounded text-xs font-semibold border
                            ${stageColors[action.stage]}
                          `}
                        >
                          {stageLabels[action.stage]} Stage
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Note:</span> All timing is relative to your launch start date. 
          Execute actions in the order shown for optimal campaign flow through the AIDA stages.
        </p>
      </div>
    </div>
  )
}
