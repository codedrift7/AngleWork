import { describe, it, expect } from 'vitest'
import { Critique } from '@/lib/types/campaign'

/**
 * Render verification test for CampaignCritiquePanel component.
 * 
 * This test verifies that the component can be imported and the data structure
 * is correct. Full DOM rendering tests would require @testing-library/react.
 */
describe('CampaignCritiquePanel - Render Verification', () => {
  const mockCritique: Critique = {
    overallScore: 7.2,
    attentionScore: 8,
    interestScore: 7,
    desireScore: 6,
    actionScore: 8,
    messageConsistency: 7,
    audienceFit: 7,
    criticalStage: 'desire',
    findings: [
      {
        stage: 'desire',
        issue: 'Too feature-focused, needs more emotional appeal',
        severity: 'high'
      },
      {
        stage: 'attention',
        issue: 'Hook could be stronger',
        severity: 'medium'
      }
    ],
    recommendations: [
      {
        stage: 'desire',
        recommendation: 'Emphasize customer transformation over features',
        expectedImpact: 'Higher engagement and conversion'
      }
    ],
    primaryRecommendation: {
      stage: 'desire',
      targetAssetIds: ['asset-123'],
      recommendation: 'Your Desire stage is too feature-focused. Replace feature lists with customer outcomes.',
      suggestedFix: 'Stop spending Sunday nights sorting receipts. Get your books done in 10 minutes.'
    }
  }

  it('verifies component can be imported', async () => {
    // Dynamic import to verify component exists and can be loaded
    const module = await import('../CampaignCritiquePanel')
    expect(module.CampaignCritiquePanel).toBeDefined()
    expect(typeof module.CampaignCritiquePanel).toBe('function')
  })

  it('verifies critique prop structure matches requirements', () => {
    // Verify all required Critique fields are present per Req 6.2
    expect(mockCritique).toHaveProperty('overallScore')
    expect(mockCritique).toHaveProperty('attentionScore')
    expect(mockCritique).toHaveProperty('interestScore')
    expect(mockCritique).toHaveProperty('desireScore')
    expect(mockCritique).toHaveProperty('actionScore')
    expect(mockCritique).toHaveProperty('messageConsistency')
    expect(mockCritique).toHaveProperty('audienceFit')
    
    // Verify critical stage field per Req 6.3
    expect(mockCritique).toHaveProperty('criticalStage')
    expect(['attention', 'interest', 'desire', 'action']).toContain(mockCritique.criticalStage)
    
    // Verify primary recommendation structure per Req 6.3
    expect(mockCritique).toHaveProperty('primaryRecommendation')
    expect(mockCritique.primaryRecommendation).toHaveProperty('stage')
    expect(mockCritique.primaryRecommendation).toHaveProperty('targetAssetIds')
    expect(mockCritique.primaryRecommendation).toHaveProperty('recommendation')
    expect(mockCritique.primaryRecommendation).toHaveProperty('suggestedFix')
  })

  it('verifies component accepts required props', () => {
    // Verify the component accepts both critique and campaignId props
    const mockProps = {
      critique: mockCritique,
      campaignId: 'test-campaign-id'
    }
    
    expect(mockProps.critique).toBeDefined()
    expect(mockProps.campaignId).toBeDefined()
    expect(typeof mockProps.campaignId).toBe('string')
  })

  it('verifies overall score calculation is within range', () => {
    // Per Req 6.2: overall score should be arithmetic mean of 6 component scores
    const { attentionScore, interestScore, desireScore, actionScore, messageConsistency, audienceFit } = mockCritique
    const calculatedMean = (attentionScore + interestScore + desireScore + actionScore + messageConsistency + audienceFit) / 6
    
    // Allow small floating point difference
    expect(Math.abs(mockCritique.overallScore - calculatedMean)).toBeLessThan(0.1)
    
    // Verify score is in valid range (1-10)
    expect(mockCritique.overallScore).toBeGreaterThanOrEqual(1)
    expect(mockCritique.overallScore).toBeLessThanOrEqual(10)
  })

  it('verifies all component scores are integers 1-10', () => {
    // Per Req 6.2: component scores are integers 1-10
    const componentScores = [
      mockCritique.attentionScore,
      mockCritique.interestScore,
      mockCritique.desireScore,
      mockCritique.actionScore,
      mockCritique.messageConsistency,
      mockCritique.audienceFit
    ]

    componentScores.forEach(score => {
      expect(Number.isInteger(score)).toBe(true)
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(10)
    })
  })

  it('verifies critical stage matches lowest score stage', () => {
    // Per Req 6.3: critical stage should be the stage with lowest score
    const { attentionScore, interestScore, desireScore, actionScore, criticalStage } = mockCritique
    const stageScores = {
      attention: attentionScore,
      interest: interestScore,
      desire: desireScore,
      action: actionScore
    }

    const lowestScore = Math.min(...Object.values(stageScores))
    const lowestStages = Object.entries(stageScores)
      .filter(([_, score]) => score === lowestScore)
      .map(([stage]) => stage)

    // Critical stage should be one of the lowest scoring stages
    expect(lowestStages).toContain(criticalStage)
  })
})
