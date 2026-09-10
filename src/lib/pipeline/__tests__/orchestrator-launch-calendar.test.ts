/**
 * Integration test for Launch Calendar Generator in Pipeline Orchestrator
 * 
 * Verifies that Stage 6 (Launch Calendar) properly:
 * - Fetches campaign assets
 * - Calls launchCalendarAgent with correct data
 * - Creates LaunchCalendar record in database
 * - Updates campaign status to "complete"
 * - Handles errors per Req 7.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resumePipelineAfterAngleSelection } from '../orchestrator'
import { prisma } from '@/db'
import * as launchCalendar from '../agents/launch-calendar'

// Mock all dependencies
vi.mock('@/db', () => ({
  prisma: {
    strategy: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    asset: {
      findMany: vi.fn(),
      create: vi.fn()
    },
    launchCalendar: {
      create: vi.fn()
    },
    critique: {
      create: vi.fn()
    },
    campaign: {
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('../agents/aida-strategist', () => ({
  aidaStrategistAgent: vi.fn().mockResolvedValue({
    result: {
      attention: {
        stage: 'attention',
        objective: 'Hook with pain',
        contentDirection: 'Lead with uncertainty',
        keyPoints: ['Pain point 1', 'Pain point 2']
      },
      interest: {
        stage: 'interest',
        objective: 'Build interest',
        contentDirection: 'Explore the problem',
        keyPoints: ['Interest point 1', 'Interest point 2']
      },
      desire: {
        stage: 'desire',
        objective: 'Create desire',
        contentDirection: 'Show transformation',
        keyPoints: ['Desire point 1', 'Desire point 2']
      },
      action: {
        stage: 'action',
        objective: 'Drive action',
        contentDirection: 'Clear CTA',
        keyPoints: ['Action point 1', 'Action point 2']
      }
    },
    metadata: {
      tokensUsed: 1000,
      executionTimeMs: 500,
      modelVersion: 'test-model'
    }
  })
}))

vi.mock('../agents/campaign-builder', () => ({
  campaignBuilderAgent: vi.fn().mockResolvedValue({
    result: [
      {
        channel: 'linkedin',
        stage: 'attention',
        assetType: 'post',
        content: { stage: 'attention', content: 'Test post', strategicPurpose: 'Hook' }
      }
    ],
    metadata: {
      tokensUsed: 2000,
      executionTimeMs: 1000,
      modelVersion: 'test-model'
    }
  })
}))

vi.mock('../agents/campaign-critic', () => ({
  campaignCriticAgent: vi.fn().mockResolvedValue({
    result: {
      overallScore: 8.5,
      attentionScore: 9,
      interestScore: 8,
      desireScore: 8,
      actionScore: 9,
      messageConsistency: 9,
      audienceFit: 8,
      criticalStage: 'interest',
      findings: [],
      recommendations: [],
      primaryRecommendation: {
        stage: 'interest',
        targetAssetIds: ['asset-1'],
        recommendation: 'Test recommendation',
        suggestedFix: 'Test fix'
      }
    },
    metadata: {
      tokensUsed: 1500,
      executionTimeMs: 750,
      modelVersion: 'test-model'
    }
  })
}))

vi.mock('../agents/launch-calendar')

describe('Pipeline Orchestrator - Launch Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully integrate launch calendar generation into pipeline', async () => {
    // Setup: Mock database responses
    const mockCampaignId = 'test-campaign-123'
    const mockAidaStrategy = {
      attention: {
        stage: 'attention' as const,
        objective: 'Hook with pain',
        contentDirection: 'Lead with uncertainty',
        keyPoints: ['Pain point 1', 'Pain point 2']
      },
      interest: {
        stage: 'interest' as const,
        objective: 'Build interest',
        contentDirection: 'Explore the problem',
        keyPoints: ['Interest point 1', 'Interest point 2']
      },
      desire: {
        stage: 'desire' as const,
        objective: 'Create desire',
        contentDirection: 'Show transformation',
        keyPoints: ['Desire point 1', 'Desire point 2']
      },
      action: {
        stage: 'action' as const,
        objective: 'Drive action',
        contentDirection: 'Clear CTA',
        keyPoints: ['Action point 1', 'Action point 2']
      }
    }

    const mockAssets = [
      { id: 'asset-1', channel: 'linkedin', stage: 'attention', assetType: 'post', title: 'Attention Post' },
      { id: 'asset-2', channel: 'email', stage: 'interest', assetType: 'email', title: 'Interest Email' },
      { id: 'asset-3', channel: 'landing_page', stage: 'multi-stage', assetType: 'page_section', title: null }
    ]

    const mockLaunchCalendarResult = {
      days: [
        { dayNumber: 1, date: 'Day 1', actions: [{ action: 'Finalize landing page copy', assetId: 'asset-3' }] },
        { dayNumber: 2, date: 'Day 2', actions: [{ action: 'Publish Attention LinkedIn post', assetId: 'asset-1' }] },
        { dayNumber: 3, date: 'Day 3', actions: [{ action: 'Send Interest email', assetId: 'asset-2' }] },
        { dayNumber: 4, date: 'Day 4', actions: [{ action: 'Monitor engagement' }] },
        { dayNumber: 5, date: 'Day 5', actions: [{ action: 'Publish Desire content' }] },
        { dayNumber: 6, date: 'Day 6', actions: [{ action: 'Amplify messaging' }] },
        { dayNumber: 7, date: 'Day 7', actions: [{ action: 'Drive conversions' }] }
      ]
    }

    // Mock strategy lookup
    vi.mocked(prisma.strategy.findUnique).mockResolvedValue({
      id: 'strategy-1',
      campaignId: mockCampaignId,
      productIntelligence: {
        idealCustomerProfile: 'Test ICP',
        coreProblem: 'Test problem',
        primaryPain: 'Test pain',
        desiredOutcome: 'Test outcome',
        corePromise: 'Test promise',
        differentiators: ['Diff 1'],
        emotionalDrivers: ['Driver 1'],
        objections: ['Obj 1', 'Obj 2'],
        recommendedMessagingAngle: 'pain' as const
      },
      positioning: {
        category: 'Test Category',
        positioningStatement: 'Test positioning',
        valueProposition: 'Test value prop',
        primaryPain: 'Test pain',
        desiredTransformation: 'Test transformation'
      },
      messagingAngles: [
        { type: 'pain' as const, tagline: 'Pain angle', coreMessage: 'Test message', rationale: 'Test rationale' },
        { type: 'outcome' as const, tagline: 'Outcome angle', coreMessage: 'Test message', rationale: 'Test rationale' },
        { type: 'time' as const, tagline: 'Time angle', coreMessage: 'Test message', rationale: 'Test rationale' }
      ],
      selectedAngleIndex: 0,
      aidaStrategy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      campaign: {
        id: mockCampaignId,
        name: 'Test Campaign',
        status: 'positioning_complete',
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        productBrief: {
          id: 'brief-1',
          campaignId: mockCampaignId,
          productName: 'Test Product',
          description: 'Test description',
          category: 'Test Category',
          productType: 'SaaS',
          targetCustomer: 'Test customers',
          customerProblem: 'Test problem',
          customerSophistication: 'Aware',
          mainBenefit: 'Test benefit',
          keyDifferentiator: 'Test differentiator',
          price: '$99/month',
          marketingGoal: 'Awareness',
          launchType: 'New Product',
          desiredCTA: 'Sign up',
          primaryChannel: 'LinkedIn',
          campaignDuration: '7 days',
          competitors: null,
          existingTagline: null,
          brandVoice: null,
          websiteURL: null,
          customerTestimonials: null,
          productDocs: null,
          brandGuidelines: null,
          existingCopy: null,
          createdAt: new Date()
        }
      }
    } as any)

    // Mock asset queries
    vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as any)

    // Mock launch calendar agent
    vi.mocked(launchCalendar.launchCalendarAgent).mockResolvedValue({
      result: mockLaunchCalendarResult,
      metadata: {
        tokensUsed: 800,
        executionTimeMs: 400,
        modelVersion: 'test-model'
      }
    })

    // Mock database operations
    vi.mocked(prisma.$transaction).mockImplementation((operations: any) => 
      Promise.resolve(operations.map(() => ({ id: 'asset-created' })))
    )
    vi.mocked(prisma.campaign.update).mockResolvedValue({} as any)
    vi.mocked(prisma.launchCalendar.create).mockResolvedValue({
      id: 'calendar-1',
      campaignId: mockCampaignId,
      days: mockLaunchCalendarResult.days as any,
      createdAt: new Date()
    })
    vi.mocked(prisma.critique.create).mockResolvedValue({
      id: 'critique-1',
      campaignId: mockCampaignId,
      overallScore: 8.5,
      attentionScore: 9,
      interestScore: 8,
      desireScore: 8,
      actionScore: 9,
      messageConsistency: 9,
      audienceFit: 8,
      criticalStage: 'interest',
      findings: [],
      recommendations: [],
      primaryRecommendation: {
        stage: 'interest',
        targetAssetIds: ['asset-1'],
        recommendation: 'Test recommendation',
        suggestedFix: 'Test fix'
      },
      createdAt: new Date()
    } as any)

    // Execute: Run pipeline resumption
    await resumePipelineAfterAngleSelection(mockCampaignId, 0)

    // Verify: Launch Calendar agent was called with correct data
    expect(launchCalendar.launchCalendarAgent).toHaveBeenCalledWith({
      data: {
        assets: mockAssets,
        aidaStrategy: mockAidaStrategy
      },
      campaignId: mockCampaignId
    })

    // Verify: LaunchCalendar record was created
    expect(prisma.launchCalendar.create).toHaveBeenCalledWith({
      data: {
        campaignId: mockCampaignId,
        days: mockLaunchCalendarResult.days
      }
    })

    // Verify: Campaign status was updated to "complete"
    const updateCalls = vi.mocked(prisma.campaign.update).mock.calls
    const finalStatusUpdate = updateCalls.find(call => 
      call[0].data && 'status' in call[0].data && call[0].data.status === 'complete'
    )
    expect(finalStatusUpdate).toBeDefined()
  })

  it('should handle launch calendar generation failure per Req 7.8', async () => {
    // Setup: Mock database and agent to throw error
    const mockCampaignId = 'test-campaign-456'
    
    vi.mocked(prisma.strategy.findUnique).mockResolvedValue({
      id: 'strategy-1',
      campaignId: mockCampaignId,
      productIntelligence: {
        idealCustomerProfile: 'Test ICP',
        coreProblem: 'Test problem',
        primaryPain: 'Test pain',
        desiredOutcome: 'Test outcome',
        corePromise: 'Test promise',
        differentiators: ['Diff 1'],
        emotionalDrivers: ['Driver 1'],
        objections: ['Obj 1', 'Obj 2'],
        recommendedMessagingAngle: 'pain' as const
      },
      positioning: {
        category: 'Test Category',
        positioningStatement: 'Test positioning',
        valueProposition: 'Test value prop',
        primaryPain: 'Test pain',
        desiredTransformation: 'Test transformation'
      },
      messagingAngles: [
        { type: 'pain' as const, tagline: 'Pain angle', coreMessage: 'Test message', rationale: 'Test rationale' },
        { type: 'outcome' as const, tagline: 'Outcome angle', coreMessage: 'Test message', rationale: 'Test rationale' },
        { type: 'time' as const, tagline: 'Time angle', coreMessage: 'Test message', rationale: 'Test rationale' }
      ],
      selectedAngleIndex: 0,
      aidaStrategy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      campaign: {
        id: mockCampaignId,
        name: 'Test Campaign',
        status: 'positioning_complete',
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        productBrief: {
          id: 'brief-1',
          campaignId: mockCampaignId,
          productName: 'Test Product',
          description: 'Test description',
          category: 'Test Category',
          productType: 'SaaS',
          targetCustomer: 'Test customers',
          customerProblem: 'Test problem',
          customerSophistication: 'Aware',
          mainBenefit: 'Test benefit',
          keyDifferentiator: 'Test differentiator',
          price: '$99/month',
          marketingGoal: 'Awareness',
          launchType: 'New Product',
          desiredCTA: 'Sign up',
          primaryChannel: 'LinkedIn',
          campaignDuration: '7 days',
          competitors: null,
          existingTagline: null,
          brandVoice: null,
          websiteURL: null,
          customerTestimonials: null,
          productDocs: null,
          brandGuidelines: null,
          existingCopy: null,
          createdAt: new Date()
        }
      }
    } as any)

    vi.mocked(prisma.asset.findMany).mockResolvedValue([])
    vi.mocked(prisma.$transaction).mockImplementation((operations: any) => 
      Promise.resolve(operations.map(() => ({ id: 'asset-created' })))
    )
    vi.mocked(prisma.campaign.update).mockResolvedValue({} as any)
    vi.mocked(prisma.critique.create).mockResolvedValue({
      id: 'critique-1',
      campaignId: mockCampaignId,
      overallScore: 8.5,
      attentionScore: 9,
      interestScore: 8,
      desireScore: 8,
      actionScore: 9,
      messageConsistency: 9,
      audienceFit: 8,
      criticalStage: 'interest',
      findings: [],
      recommendations: [],
      primaryRecommendation: {
        stage: 'interest',
        targetAssetIds: ['asset-1'],
        recommendation: 'Test recommendation',
        suggestedFix: 'Test fix'
      },
      createdAt: new Date()
    } as any)

    // Mock launch calendar agent to fail
    vi.mocked(launchCalendar.launchCalendarAgent).mockRejectedValue(
      new Error('Launch calendar generation failed')
    )

    // Execute and verify: Should throw error but preserve previous data
    await expect(
      resumePipelineAfterAngleSelection(mockCampaignId, 0)
    ).rejects.toThrow('Launch Calendar generation failed')

    // Verify: Campaign status was rolled back to 'critique_complete' to allow retry
    const updateCalls = vi.mocked(prisma.campaign.update).mock.calls
    const rollbackStatusUpdate = updateCalls.find(call => 
      call[0].data && 'status' in call[0].data && call[0].data.status === 'critique_complete'
    )
    expect(rollbackStatusUpdate).toBeDefined()

    // Verify: LaunchCalendar record was NOT created
    expect(prisma.launchCalendar.create).not.toHaveBeenCalled()
  })
})
