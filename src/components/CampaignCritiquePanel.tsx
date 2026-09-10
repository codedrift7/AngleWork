'use client'

import { Critique } from '@/lib/types/campaign'
import { applyCritiqueRecommendation } from '@/actions/campaign'
import { useState } from 'react'

interface CampaignCritiquePanelProps {
  critique: Critique
  campaignId: string
}

/**
 * CampaignCritiquePanel displays the Campaign Critique scores and recommendations.
 * Shows overall score, component scores, critical stage, and primary recommendation
 * with an "Apply Recommendation" button.
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */
export function CampaignCritiquePanel({ critique, campaignId }: CampaignCritiquePanelProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const stageLabels: Record<string, string> = {
    attention: 'Attention',
    interest: 'Interest',
    desire: 'Desire',
    action: 'Action'
  }

  const severityColors: Record<string, string> = {
    low: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    medium: 'bg-orange-50 text-orange-800 border-orange-200',
    high: 'bg-red-50 text-red-800 border-red-200'
  }

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 8) return 'Excellent'
    if (score >= 6) return 'Good'
    if (score >= 4) return 'Needs Work'
    return 'Critical'
  }

  const handleApplyRecommendation = async () => {
    setIsApplying(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await applyCritiqueRecommendation(campaignId)
      
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Success state will show briefly then the page will revalidate
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply recommendation')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Campaign Critique</h2>

      {/* Overall Score */}
      <section className="mb-8 pb-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Score</h3>
            <p className="text-sm text-gray-600">Average of all component scores</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${getScoreColor(critique.overallScore)}`}>
              {critique.overallScore.toFixed(1)}
            </div>
            <div className={`text-sm font-medium mt-1 ${getScoreColor(critique.overallScore)}`}>
              {getScoreLabel(critique.overallScore)}
            </div>
          </div>
        </div>
      </section>

      {/* Component Scores */}
      <section className="mb-8 pb-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Scores</h3>
        
        {/* AIDA Stage Scores */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            AIDA Stages
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <ScoreItem
              label="Attention"
              score={critique.attentionScore}
              isCritical={critique.criticalStage === 'attention'}
            />
            <ScoreItem
              label="Interest"
              score={critique.interestScore}
              isCritical={critique.criticalStage === 'interest'}
            />
            <ScoreItem
              label="Desire"
              score={critique.desireScore}
              isCritical={critique.criticalStage === 'desire'}
            />
            <ScoreItem
              label="Action"
              score={critique.actionScore}
              isCritical={critique.criticalStage === 'action'}
            />
          </div>
        </div>

        {/* Campaign Quality Scores */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Campaign Quality
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <ScoreItem
              label="Message Consistency"
              score={critique.messageConsistency}
            />
            <ScoreItem
              label="Audience Fit"
              score={critique.audienceFit}
            />
          </div>
        </div>
      </section>

      {/* Critical Stage */}
      <section className="mb-8 pb-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Critical Finding</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-900 mb-1">
                Weakest Stage: {stageLabels[critique.criticalStage]}
              </div>
              <p className="text-red-800 text-sm">
                This stage requires the most improvement to strengthen your campaign.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Findings */}
      {critique.findings.length > 0 && (
        <section className="mb-8 pb-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Findings</h3>
          <div className="space-y-3">
            {critique.findings.map((finding, index) => (
              <div
                key={index}
                className={`border rounded-md p-4 ${severityColors[finding.severity]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold mb-1">
                      {stageLabels[finding.stage as keyof typeof stageLabels] || finding.stage}
                    </div>
                    <p className="text-sm">{finding.issue}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
                    {finding.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Primary Recommendation */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Recommendation</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 text-xl">💡</span>
              <h4 className="font-semibold text-blue-900">
                Target: {stageLabels[critique.primaryRecommendation.stage as keyof typeof stageLabels] || critique.primaryRecommendation.stage} Stage
              </h4>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              {critique.primaryRecommendation.recommendation}
            </p>
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Suggested Fix
              </div>
              <p className="text-sm text-gray-700">
                {critique.primaryRecommendation.suggestedFix}
              </p>
            </div>
          </div>

          {/* Apply Recommendation Button */}
          <div className="mt-4">
            <button
              onClick={handleApplyRecommendation}
              disabled={isApplying || success}
              className={`
                w-full px-6 py-3 rounded-md font-semibold text-white
                transition-colors duration-200
                ${success 
                  ? 'bg-green-600 cursor-default' 
                  : isApplying 
                  ? 'bg-blue-400 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
                disabled:cursor-not-allowed
              `}
            >
              {success ? '✓ Recommendation Applied' : isApplying ? 'Applying...' : 'Apply Recommendation'}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  The recommendation has been applied to your campaign assets.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Additional Recommendations */}
      {critique.recommendations.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Recommendations</h3>
          <div className="space-y-3">
            {critique.recommendations.map((rec, index) => (
              <div key={index} className="border rounded-md p-4 bg-gray-50">
                <div className="font-semibold text-gray-900 mb-2">
                  {stageLabels[rec.stage as keyof typeof stageLabels] || rec.stage}
                </div>
                <p className="text-gray-700 text-sm mb-2">{rec.recommendation}</p>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Expected Impact:</span> {rec.expectedImpact}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * ScoreItem component displays a single score with optional critical indicator
 */
function ScoreItem({ 
  label, 
  score, 
  isCritical = false 
}: { 
  label: string
  score: number
  isCritical?: boolean
}) {
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 4) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className={`
      border rounded-md p-4 
      ${isCritical ? 'ring-2 ring-red-400 bg-red-50' : getScoreColor(score)}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {label}
            {isCritical && (
              <span className="ml-2 text-xs font-semibold text-red-600 uppercase">
                Critical
              </span>
            )}
          </div>
        </div>
        <div className={`text-2xl font-bold ${isCritical ? 'text-red-600' : ''}`}>
          {score}
        </div>
      </div>
    </div>
  )
}
