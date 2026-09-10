import { AidaStrategy } from '@/lib/types/campaign'

interface AidaStrategyDisplayProps {
  aidaStrategy: AidaStrategy
}

/**
 * AidaStrategyDisplay renders the complete AIDA strategy showing all four stages
 * (Attention, Interest, Desire, Action) with objectives, content directions, key points,
 * and proof requirements.
 * 
 * Requirements: 4.7
 */
export function AidaStrategyDisplay({ aidaStrategy }: AidaStrategyDisplayProps) {
  const stageLabels: Record<string, string> = {
    attention: 'Attention',
    interest: 'Interest',
    desire: 'Desire',
    action: 'Action'
  }

  const stageIcons: Record<string, string> = {
    attention: '👁️',
    interest: '🤔',
    desire: '💡',
    action: '🎯'
  }

  const stages = [
    aidaStrategy.attention,
    aidaStrategy.interest,
    aidaStrategy.desire,
    aidaStrategy.action
  ]

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-2xl font-bold mb-6">AIDA Strategy</h2>

      <div className="space-y-8">
        {stages.map((stage, index) => (
          <section key={stage.stage} className="pb-6 border-b last:border-b-0 last:pb-0">
            {/* Stage Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{stageIcons[stage.stage]}</span>
              <h3 className="text-xl font-semibold text-gray-900">
                {stageLabels[stage.stage]}
              </h3>
            </div>

            {/* Objective */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Objective
              </h4>
              <p className="text-gray-700 leading-relaxed">{stage.objective}</p>
            </div>

            {/* Content Direction */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Content Direction
              </h4>
              <p className="text-gray-700 leading-relaxed">{stage.contentDirection}</p>
            </div>

            {/* Key Points */}
            <div className={stage.proofRequirements && stage.proofRequirements.length > 0 ? 'mb-4' : ''}>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Key Points
              </h4>
              <ul className="space-y-2">
                {stage.keyPoints.map((point, pointIndex) => (
                  <li key={pointIndex} className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Proof Requirements (if present) */}
            {stage.proofRequirements && stage.proofRequirements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Proof Requirements
                </h4>
                <ul className="space-y-2">
                  {stage.proofRequirements.map((proof, proofIndex) => (
                    <li key={proofIndex} className="flex items-start">
                      <span className="text-purple-600 mr-2 mt-1">✓</span>
                      <span className="text-gray-700 font-mono text-sm">{proof}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
