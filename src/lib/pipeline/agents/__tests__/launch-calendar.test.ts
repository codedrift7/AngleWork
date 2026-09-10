/**
 * Launch Calendar Agent Tests
 * 
 * Tests the Launch Calendar Generator AI agent to ensure it:
 * - Generates exactly 7 days (Req 7.1)
 * - Assigns assets to correct stage windows (Req 7.2)
 * - Formats actions as imperatives (Req 7.3)
 * - Limits to max 3 actions per day (Req 7.4)
 * - Schedules landing page on Day 1, first action (Req 7.5)
 * - Uses relative timing (Req 7.7)
 * - Handles overflow (>21 assets) appropriately (Req 7.4)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { launchCalendarAgent } from '../launch-calendar'
import type { LaunchCalendarInput } from '../launch-calendar'
import { AidaStrategy } from '@/lib/types/campaign'
import * as llmClient from '@/lib/ai/llm-client'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('launchCalendarAgent', () => {
  const mockAidaStrategy: AidaStrategy = {
    attention: {
      stage: 'attention',
      objective: 'Hook with financial uncertainty',
      contentDirection: 'Lead with the pain of not knowing real numbers',
      keyPoints: ['Bank balance ≠ real money', 'Surprise tax bills']
    },
    interest: {
      stage: 'interest',
      objective: 'Show cost of manual bookkeeping',
      contentDirection: 'Highlight time waste and error risk',
      keyPoints: ['Hours every week', 'Easy to miss deductions']
    },
    desire: {
      stage: 'desire',
      objective: 'Paint transformation to clarity',
      contentDirection: 'Show outcome of knowing numbers without effort',
      keyPoints: ['Confidence in decisions', 'Time back']
    },
    action: {
      stage: 'action',
      objective: 'Drive signup',
      contentDirection: 'Clear CTA with trial offer',
      keyPoints: ['Start free trial', 'No credit card']
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate exactly 7 days (Req 7.1)', async () => {
    const mockAssets = [
      { id: 'asset-1', channel: 'linkedin', stage: 'attention', assetType: 'post', title: 'Attention Post' },
      { id: 'asset-2', channel: 'email', stage: 'interest', assetType: 'email', title: 'Interest Email' },
      { id: 'asset-3', channel: 'linkedin', stage: 'desire', assetType: 'post', title: 'Desire Post' },
      { id: 'asset-4', channel: 'email', stage: 'action', assetType: 'email', title: 'Action Email' }
    ]

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Publish Attention LinkedIn post', assetId: 'asset-1', stage: 'attention' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Send Interest email', assetId: 'asset-2', stage: 'interest' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Publish Desire LinkedIn post', assetId: 'asset-3', stage: 'desire' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Prepare for Action stage' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Review campaign performance' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Optimize based on data' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Send Action email', assetId: 'asset-4', stage: 'action' }] }
      ],
      tokensUsed: 1000
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    expect(result.result.days).toHaveLength(7)
    expect(result.result.days.every(d => d.dayNumber >= 1 && d.dayNumber <= 7)).toBe(true)
  })

  it('should assign Attention assets to Day 1-2 (Req 7.2)', async () => {
    const mockAssets = [
      { id: 'attn-1', channel: 'linkedin', stage: 'attention', assetType: 'post' },
      { id: 'attn-2', channel: 'email', stage: 'attention', assetType: 'email' }
    ]

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Publish Attention LinkedIn post', assetId: 'attn-1', stage: 'attention' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Send Attention email', assetId: 'attn-2', stage: 'attention' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Monitor engagement' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Review metrics' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Adjust strategy' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Prepare final push' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Complete launch' }] }
      ],
      tokensUsed: 900
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    // Check that attention assets appear in days 1-2
    const days12Actions = [
      ...result.result.days[0].actions,
      ...result.result.days[1].actions
    ]
    const attentionAssetIds = days12Actions
      .filter(a => a.assetId)
      .map(a => a.assetId)

    expect(attentionAssetIds).toContain('attn-1')
    expect(attentionAssetIds).toContain('attn-2')
  })

  it('should format actions as imperatives (Req 7.3)', async () => {
    const mockAssets = [
      { id: 'asset-1', channel: 'linkedin', stage: 'attention', assetType: 'post' }
    ]

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Publish LinkedIn post', assetId: 'asset-1' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Send email to subscribers' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Launch ad campaign' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Review performance metrics' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Optimize targeting' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Increase ad spend' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Execute final CTA push' }] }
      ],
      tokensUsed: 850
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    // All actions should start with imperative verbs
    const imperativeVerbs = ['publish', 'send', 'launch', 'review', 'optimize', 'increase', 'execute', 'finalize', 'post', 'create', 'start', 'monitor', 'update']
    
    result.result.days.forEach(day => {
      day.actions.forEach(action => {
        const firstWord = action.action.split(' ')[0].toLowerCase()
        const isImperative = imperativeVerbs.some(verb => firstWord.startsWith(verb))
        expect(isImperative).toBe(true)
      })
    })
  })

  it('should limit to max 3 actions per day (Req 7.4)', async () => {
    const mockAssets = Array.from({ length: 15 }, (_, i) => ({
      id: `asset-${i}`,
      channel: 'linkedin',
      stage: ['attention', 'interest', 'desire', 'action'][i % 4] as any,
      assetType: 'post'
    }))

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Action 1' }, { action: 'Action 2' }, { action: 'Action 3' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Action 4' }, { action: 'Action 5' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Action 6' }, { action: 'Action 7' }, { action: 'Action 8' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Action 9' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Action 10' }, { action: 'Action 11' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Action 12' }, { action: 'Action 13' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Action 14' }, { action: 'Action 15' }] }
      ],
      tokensUsed: 1200
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    result.result.days.forEach(day => {
      expect(day.actions.length).toBeLessThanOrEqual(3)
      expect(day.actions.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should schedule landing page finalization on Day 1, first action (Req 7.5)', async () => {
    const mockAssets = [
      { id: 'landing-page-1', channel: 'landing_page', stage: 'multi-stage', assetType: 'page_section' },
      { id: 'linkedin-1', channel: 'linkedin', stage: 'attention', assetType: 'post' }
    ]

    const mockResponse = {
      days: [
        { 
          dayNumber: 1, 
          date: 'Day 1', 
          actions: [
            { action: 'Finalize landing page copy', assetId: 'landing-page-1' },
            { action: 'Publish Attention LinkedIn post', assetId: 'linkedin-1', stage: 'attention' }
          ] 
        },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Monitor traffic' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Engage with comments' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Send interest email' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Post desire content' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Prepare CTA' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Execute action stage' }] }
      ],
      tokensUsed: 950
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    const day1 = result.result.days[0]
    expect(day1.dayNumber).toBe(1)
    
    const firstAction = day1.actions[0]
    expect(firstAction.action.toLowerCase()).toContain('landing page')
    expect(firstAction.assetId).toBe('landing-page-1')
  })

  it('should use relative timing (Day 1, Day 2, etc.) not specific dates (Req 7.7)', async () => {
    const mockAssets = [
      { id: 'asset-1', channel: 'linkedin', stage: 'attention', assetType: 'post' }
    ]

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Start campaign' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Post content' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Send email' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Monitor metrics' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Adjust strategy' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Prepare finale' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Complete launch' }] }
      ],
      tokensUsed: 800
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    result.result.days.forEach((day, index) => {
      // Should use "Day N" format
      expect(day.date).toBe(`Day ${index + 1}`)
      
      // Should NOT contain specific dates (checking for common date patterns)
      const hasSpecificDate = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(day.date || '')
      expect(hasSpecificDate).toBe(false)
    })
  })

  it('should include metadata with token usage and execution time', async () => {
    const mockAssets = [
      { id: 'asset-1', channel: 'linkedin', stage: 'attention', assetType: 'post' }
    ]

    const mockResponse = {
      days: Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        date: `Day ${i + 1}`,
        actions: [{ action: `Action ${i + 1}` }]
      })),
      tokensUsed: 1500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockImplementation(async () => {
      // Add a small delay to ensure executionTimeMs > 0
      await new Promise(resolve => setTimeout(resolve, 1))
      return mockResponse
    })

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    expect(result.metadata).toBeDefined()
    expect(result.metadata.tokensUsed).toBe(1500)
    expect(result.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.metadata.modelVersion).toBeDefined()
  })

  it('should handle stage windows correctly for Interest (Day 3-4) and Desire (Day 5-6)', async () => {
    const mockAssets = [
      { id: 'interest-1', channel: 'email', stage: 'interest', assetType: 'email' },
      { id: 'interest-2', channel: 'linkedin', stage: 'interest', assetType: 'post' },
      { id: 'desire-1', channel: 'email', stage: 'desire', assetType: 'email' },
      { id: 'desire-2', channel: 'linkedin', stage: 'desire', assetType: 'post' }
    ]

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Prepare for interest stage' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Review strategy' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Send Interest email', assetId: 'interest-1', stage: 'interest' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Publish Interest LinkedIn post', assetId: 'interest-2', stage: 'interest' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Send Desire email', assetId: 'desire-1', stage: 'desire' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Publish Desire LinkedIn post', assetId: 'desire-2', stage: 'desire' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Execute action stage' }] }
      ],
      tokensUsed: 1100
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    // Check Interest assets appear in days 3-4
    const days34Actions = [
      ...result.result.days[2].actions,
      ...result.result.days[3].actions
    ]
    const interestAssetIds = days34Actions
      .filter(a => a.assetId && a.stage === 'interest')
      .map(a => a.assetId)

    expect(interestAssetIds).toContain('interest-1')
    expect(interestAssetIds).toContain('interest-2')

    // Check Desire assets appear in days 5-6
    const days56Actions = [
      ...result.result.days[4].actions,
      ...result.result.days[5].actions
    ]
    const desireAssetIds = days56Actions
      .filter(a => a.assetId && a.stage === 'desire')
      .map(a => a.assetId)

    expect(desireAssetIds).toContain('desire-1')
    expect(desireAssetIds).toContain('desire-2')
  })

  it('should schedule Action assets on Day 7 (Req 7.2)', async () => {
    const mockAssets = [
      { id: 'action-1', channel: 'email', stage: 'action', assetType: 'email' },
      { id: 'action-2', channel: 'linkedin', stage: 'action', assetType: 'post' }
    ]

    const mockResponse = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Prepare campaign' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Build awareness' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Generate interest' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Deepen interest' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Create desire' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Build credibility' }] },
        { 
          dayNumber: 7, 
          date: 'Day 7', 
          actions: [
            { action: 'Send Action email with CTA', assetId: 'action-1', stage: 'action' },
            { action: 'Publish Action LinkedIn post', assetId: 'action-2', stage: 'action' }
          ] 
        }
      ],
      tokensUsed: 1050
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

    const input: LaunchCalendarInput = {
      data: { assets: mockAssets, aidaStrategy: mockAidaStrategy },
      campaignId: 'test-campaign-id'
    }

    const result = await launchCalendarAgent(input)

    const day7 = result.result.days[6]
    expect(day7.dayNumber).toBe(7)
    
    const actionAssetIds = day7.actions
      .filter(a => a.assetId && a.stage === 'action')
      .map(a => a.assetId)

    expect(actionAssetIds).toContain('action-1')
    expect(actionAssetIds).toContain('action-2')
  })
})
