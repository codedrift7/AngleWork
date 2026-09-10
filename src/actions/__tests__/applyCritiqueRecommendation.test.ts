/**
 * Unit tests for applyCritiqueRecommendation server action
 * 
 * Tests the server action that applies the Campaign Critic's primary recommendation
 * to identified target assets.
 * 
 * Requirements: 6.5, 6.6
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { applyCritiqueRecommendation } from '../campaign'
import { prisma } from '@/db'
import { revalidatePath } from 'next/cache'

// Mock Prisma client
vi.mock('@/db', () => ({
  prisma: {
    critique: {
      findUnique: vi.fn()
    },
    asset: {
      findMany: vi.fn(),
      update: vi.fn()
    }
  }
}))

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

const mockPrisma = prisma as {
  critique: {
    findUnique: Mock
  }
  asset: {
    findMany: Mock
    update: Mock
  }
}

describe('applyCritiqueRecommendation', () => {
  const campaignId = 'test-campaign-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success cases', () => {
    it('should update LinkedIn post asset with suggestedFix content', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['asset-1'],
          recommendation: 'The attention post should lead with a stronger hook',
          suggestedFix: 'Your bank balance is lying to you. Here\'s why freelancers need more than a checking account balance.'
        },
        createdAt: new Date()
      }

      const mockAsset = {
        id: 'asset-1',
        campaignId,
        channel: 'linkedin',
        stage: 'attention',
        assetType: 'post',
        title: 'Attention Post',
        content: {
          stage: 'attention',
          content: 'Old content here',
          strategicPurpose: 'Hook the audience'
        },
        version: 1,
        manuallyEdited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset] as any)
      mockPrisma.asset.update.mockResolvedValue({
        ...mockAsset,
        content: {
          ...mockAsset.content,
          content: mockCritique.primaryRecommendation.suggestedFix
        },
        version: 2
      } as any)

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(true)
      expect(mockPrisma.critique.findUnique).toHaveBeenCalledWith({
        where: { campaignId }
      })
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          campaignId,
          id: { in: ['asset-1'] }
        }
      })
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          content: expect.objectContaining({
            content: mockCritique.primaryRecommendation.suggestedFix
          }),
          version: 2,
          manuallyEdited: false
        })
      })
    })

    it('should update email asset body with suggestedFix content', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 7,
        interestScore: 5,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'interest',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'interest',
          targetAssetIds: ['asset-2'],
          recommendation: 'The email body should elaborate more on the problem',
          suggestedFix: 'You\'re making business decisions based on incomplete data. Every time you check your bank balance, you\'re seeing money that\'s already spoken for by upcoming bills, taxes, and expenses.'
        },
        createdAt: new Date()
      }

      const mockAsset = {
        id: 'asset-2',
        campaignId,
        channel: 'email',
        stage: 'interest',
        assetType: 'email',
        title: 'Interest Email',
        content: {
          stage: 'interest',
          subjectLine: 'Your bank balance is lying',
          previewText: 'Here\'s what you need to know',
          body: 'Old email body content',
          cta: 'Start your free trial',
          strategicPurpose: 'Build interest'
        },
        version: 1,
        manuallyEdited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset] as any)
      mockPrisma.asset.update.mockResolvedValue({
        ...mockAsset,
        content: {
          ...mockAsset.content,
          body: mockCritique.primaryRecommendation.suggestedFix
        },
        version: 2
      } as any)

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(true)
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-2' },
        data: expect.objectContaining({
          content: expect.objectContaining({
            body: mockCritique.primaryRecommendation.suggestedFix
          }),
          version: 2,
          manuallyEdited: false
        })
      })
    })

    it('should update multiple target assets simultaneously', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 5,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['asset-1', 'asset-2'],
          recommendation: 'Both attention assets need stronger hooks',
          suggestedFix: 'Your bank balance is lying to you. Here\'s why.'
        },
        createdAt: new Date()
      }

      const mockAssets = [
        {
          id: 'asset-1',
          campaignId,
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          content: { stage: 'attention', content: 'Old content 1', strategicPurpose: 'Hook' },
          version: 1,
          manuallyEdited: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'asset-2',
          campaignId,
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          content: { stage: 'attention', content: 'Old content 2', strategicPurpose: 'Hook' },
          version: 1,
          manuallyEdited: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any)
      mockPrisma.asset.update.mockImplementation((args: any) => {
        const asset = mockAssets.find(a => a.id === args.where.id)
        return Promise.resolve({
          ...asset,
          content: {
            ...asset!.content,
            content: mockCritique.primaryRecommendation.suggestedFix
          },
          version: 2
        } as any)
      })

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(true)
      expect(mockPrisma.asset.update).toHaveBeenCalledTimes(2)
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          version: 2,
          manuallyEdited: false
        })
      })
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-2' },
        data: expect.objectContaining({
          version: 2,
          manuallyEdited: false
        })
      })
    })

    it('should increment asset version number', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['asset-1'],
          recommendation: 'Test',
          suggestedFix: 'New content'
        },
        createdAt: new Date()
      }

      const mockAsset = {
        id: 'asset-1',
        campaignId,
        channel: 'linkedin',
        stage: 'attention',
        assetType: 'post',
        content: { stage: 'attention', content: 'Old', strategicPurpose: 'Hook' },
        version: 3, // Already at version 3
        manuallyEdited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset] as any)
      mockPrisma.asset.update.mockResolvedValue({
        ...mockAsset,
        version: 4
      } as any)

      await applyCritiqueRecommendation(campaignId)

      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          version: 4 // Should increment from 3 to 4
        })
      })
    })

    it('should keep manuallyEdited flag as false', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['asset-1'],
          recommendation: 'Test',
          suggestedFix: 'New content'
        },
        createdAt: new Date()
      }

      const mockAsset = {
        id: 'asset-1',
        campaignId,
        channel: 'linkedin',
        stage: 'attention',
        assetType: 'post',
        content: { stage: 'attention', content: 'Old', strategicPurpose: 'Hook' },
        version: 1,
        manuallyEdited: true, // Previously manually edited
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset] as any)
      mockPrisma.asset.update.mockResolvedValue({
        ...mockAsset,
        manuallyEdited: false,
        version: 2
      } as any)

      await applyCritiqueRecommendation(campaignId)

      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: expect.objectContaining({
          manuallyEdited: false // AI fix should reset this to false
        })
      })
    })
  })

  describe('Error cases', () => {
    it('should return error when critique not found', async () => {
      mockPrisma.critique.findUnique.mockResolvedValue(null)

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Campaign critique not found')
      expect(mockPrisma.asset.findMany).not.toHaveBeenCalled()
    })

    it('should return error when primaryRecommendation has no targetAssetIds', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: [], // Empty array
          recommendation: 'Test',
          suggestedFix: 'New content'
        },
        createdAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No target assets specified in recommendation')
      expect(mockPrisma.asset.findMany).not.toHaveBeenCalled()
    })

    it('should return error when target assets not found', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['non-existent-asset'],
          recommendation: 'Test',
          suggestedFix: 'New content'
        },
        createdAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([]) // No assets found

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Target assets not found')
      expect(mockPrisma.asset.update).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.critique.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('Different asset types', () => {
    it('should update ad asset primaryText field', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['asset-ad'],
          recommendation: 'The ad copy needs a stronger hook',
          suggestedFix: 'Stop guessing where your money went. Get real-time financial clarity.'
        },
        createdAt: new Date()
      }

      const mockAsset = {
        id: 'asset-ad',
        campaignId,
        channel: 'ads',
        stage: 'attention',
        assetType: 'ad',
        content: {
          angle: 'pain',
          headline: 'Financial Clarity',
          primaryText: 'Old ad copy',
          cta: 'Start free trial',
          targetAudience: 'Freelancers',
          stage: 'attention',
          rationale: 'Hook the audience'
        },
        version: 1,
        manuallyEdited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset] as any)
      mockPrisma.asset.update.mockResolvedValue({
        ...mockAsset,
        content: {
          ...mockAsset.content,
          primaryText: mockCritique.primaryRecommendation.suggestedFix
        },
        version: 2
      } as any)

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(true)
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-ad' },
        data: expect.objectContaining({
          content: expect.objectContaining({
            primaryText: mockCritique.primaryRecommendation.suggestedFix
          })
        })
      })
    })

    it('should update landing page headline for attention stage', async () => {
      const mockCritique = {
        id: 'critique-1',
        campaignId,
        overallScore: 6.5,
        attentionScore: 5,
        interestScore: 7,
        desireScore: 8,
        actionScore: 6,
        messageConsistency: 7,
        audienceFit: 6,
        criticalStage: 'attention',
        findings: [],
        recommendations: [],
        primaryRecommendation: {
          stage: 'attention',
          targetAssetIds: ['asset-landing'],
          recommendation: 'The landing page headline needs more impact',
          suggestedFix: 'Your Bank Balance Is Lying To You'
        },
        createdAt: new Date()
      }

      const mockAsset = {
        id: 'asset-landing',
        campaignId,
        channel: 'landing_page',
        stage: 'multi-stage',
        assetType: 'page_section',
        content: {
          headline: 'Old headline',
          subheadline: 'Subheadline',
          primaryCTA: 'Get Started',
          problemSection: 'Problem content',
          whyCurrentSolutionsFail: 'Why current solutions fail',
          productSolution: 'Product solution',
          benefits: [],
          howItWorks: [],
          objectionHandling: [],
          socialProof: 'Social proof',
          faq: [],
          finalCTA: 'Start now'
        },
        version: 1,
        manuallyEdited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.critique.findUnique.mockResolvedValue(mockCritique as any)
      mockPrisma.asset.findMany.mockResolvedValue([mockAsset] as any)
      mockPrisma.asset.update.mockResolvedValue({
        ...mockAsset,
        content: {
          ...mockAsset.content,
          headline: mockCritique.primaryRecommendation.suggestedFix
        },
        version: 2
      } as any)

      const result = await applyCritiqueRecommendation(campaignId)

      expect(result.success).toBe(true)
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-landing' },
        data: expect.objectContaining({
          content: expect.objectContaining({
            headline: mockCritique.primaryRecommendation.suggestedFix
          })
        })
      })
    })
  })
})
