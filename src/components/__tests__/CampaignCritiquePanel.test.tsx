import { describe, it, expect } from 'vitest'
import { Critique } from '@/lib/types/campaign'

/**
 * Tests for CampaignCritiquePanel component structure and type safety.
 * 
 * Note: Full DOM rendering tests require @testing-library/react to be installed.
 * These tests validate the component's type compatibility and data structures.
 */
describe('CampaignCritiquePanel', () => {
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

  it('validates critique data structure', () => {
    expect(mockCritique.overallScore).toBe(7.2)
    expect(mockCritique.criticalStage).toBe('desire')
    expect(mockCritique.attentionScore).toBe(8)
    expect(mockCritique.interestScore).toBe(7)
    expect(mockCritique.desireScore).toBe(6)
    expect(mockCritique.actionScore).toBe(8)
    expect(mockCritique.messageConsistency).toBe(7)
    expect(mockCritique.audienceFit).toBe(7)
  })

  it('validates critique has findings array', () => {
    expect(Array.isArray(mockCritique.findings)).toBe(true)
    expect(mockCritique.findings.length).toBe(2)
    expect(mockCritique.findings[0].severity).toBe('high')
    expect(mockCritique.findings[1].severity).toBe('medium')
  })

  it('validates critique has recommendations array', () => {
    expect(Array.isArray(mockCritique.recommendations)).toBe(true)
    expect(mockCritique.recommendations.length).toBe(1)
    expect(mockCritique.recommendations[0].stage).toBe('desire')
  })

  it('validates primary recommendation structure', () => {
    expect(mockCritique.primaryRecommendation.stage).toBe('desire')
    expect(Array.isArray(mockCritique.primaryRecommendation.targetAssetIds)).toBe(true)
    expect(mockCritique.primaryRecommendation.targetAssetIds.length).toBeGreaterThan(0)
    expect(mockCritique.primaryRecommendation.recommendation).toBeTruthy()
    expect(mockCritique.primaryRecommendation.suggestedFix).toBeTruthy()
  })

  it('validates minimal critique data structure', () => {
    const minimalCritique: Critique = {
      overallScore: 5.5,
      attentionScore: 5,
      interestScore: 6,
      desireScore: 5,
      actionScore: 6,
      messageConsistency: 5,
      audienceFit: 6,
      criticalStage: 'attention',
      findings: [],
      recommendations: [],
      primaryRecommendation: {
        stage: 'attention',
        targetAssetIds: ['asset-456'],
        recommendation: 'Improve attention hook',
        suggestedFix: 'Use a stronger pain point'
      }
    }

    expect(minimalCritique.overallScore).toBe(5.5)
    expect(minimalCritique.criticalStage).toBe('attention')
    expect(minimalCritique.findings.length).toBe(0)
    expect(minimalCritique.recommendations.length).toBe(0)
  })

  it('validates all AIDA stages are valid critique stages', () => {
    const validStages: Array<Critique['criticalStage']> = ['attention', 'interest', 'desire', 'action']
    
    validStages.forEach(stage => {
      const critique: Critique = {
        ...mockCritique,
        criticalStage: stage
      }
      expect(['attention', 'interest', 'desire', 'action']).toContain(critique.criticalStage)
    })
  })

  it('validates severity levels are properly typed', () => {
    const validSeverities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    
    mockCritique.findings.forEach(finding => {
      expect(validSeverities).toContain(finding.severity)
    })
  })

  it('validates score ranges', () => {
    expect(mockCritique.overallScore).toBeGreaterThanOrEqual(1)
    expect(mockCritique.overallScore).toBeLessThanOrEqual(10)
    
    expect(mockCritique.attentionScore).toBeGreaterThanOrEqual(1)
    expect(mockCritique.attentionScore).toBeLessThanOrEqual(10)
    
    expect(mockCritique.interestScore).toBeGreaterThanOrEqual(1)
    expect(mockCritique.interestScore).toBeLessThanOrEqual(10)
  })
})
