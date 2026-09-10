/**
 * Tests for selectMessagingAngle server action
 * 
 * Tests cover:
 * 1. Parameter validation (angleIndex must be 0, 1, or 2)
 * 2. Campaign status validation (must be 'positioning_complete')
 * 3. Strategy existence validation
 * 4. Messaging angles array validation
 * 5. Successful angle selection and database update
 * 6. Pipeline resumption triggering
 */

import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { selectMessagingAngle } from '../campaign'
import { prisma } from '@/db'
import { resumePipelineAfterAngleSelection } from '@/lib/pipeline/orchestrator'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/db', () => ({
  prisma: {
    strategy: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/lib/pipeline/orchestrator', () => ({
  resumePipelineAfterAngleSelection: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('selectMessagingAngle', () => {
  const mockCampaignId = 'campaign-123'
  const mockMessagingAngles = [
    {
      type: 'pain' as const,
      tagline: 'Stop guessing where your money went',
      coreMessage: 'Address the financial uncertainty',
      rationale: 'Focuses on the pain point'
    },
    {
      type: 'outcome' as const,
      tagline: 'Know your real numbers',
      coreMessage: 'Achieve financial clarity',
      rationale: 'Focuses on desired outcome'
    },
    {
      type: 'time' as const,
      tagline: 'Take bookkeeping off your to-do list',
      coreMessage: 'Save time on bookkeeping',
      rationale: 'Focuses on time saving'
    }
  ]

  const mockStrategy = {
    id: 'strategy-123',
    campaignId: mockCampaignId,
    productIntelligence: {},
    positioning: {},
    messagingAngles: mockMessagingAngles,
    selectedAngleIndex: null,
    campaign: {
      id: mockCampaignId,
      status: 'positioning_complete',
      name: 'Test Campaign'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods to reduce test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========================================================================
  // Parameter Validation Tests
  // ========================================================================

  describe('Parameter Validation', () => {
    it('should reject non-integer angleIndex', async () => {
      const result = await selectMessagingAngle(mockCampaignId, 1.5)

      expect(result).toEqual({
        success: false,
        error: 'Invalid angle index. Must be 0, 1, or 2.'
      })
      expect(prisma.strategy.findUnique).not.toHaveBeenCalled()
    })

    it('should reject negative angleIndex', async () => {
      const result = await selectMessagingAngle(mockCampaignId, -1)

      expect(result).toEqual({
        success: false,
        error: 'Invalid angle index. Must be 0, 1, or 2.'
      })
      expect(prisma.strategy.findUnique).not.toHaveBeenCalled()
    })

    it('should reject angleIndex > 2', async () => {
      const result = await selectMessagingAngle(mockCampaignId, 3)

      expect(result).toEqual({
        success: false,
        error: 'Invalid angle index. Must be 0, 1, or 2.'
      })
      expect(prisma.strategy.findUnique).not.toHaveBeenCalled()
    })

    it('should accept angleIndex 0', async () => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      (prisma.strategy.update as Mock).mockResolvedValue({ ...mockStrategy, selectedAngleIndex: 0 });
      (resumePipelineAfterAngleSelection as Mock).mockResolvedValue(undefined)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result.success).toBe(true)
    })

    it('should accept angleIndex 1', async () => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      (prisma.strategy.update as Mock).mockResolvedValue({ ...mockStrategy, selectedAngleIndex: 1 });
      (resumePipelineAfterAngleSelection as Mock).mockResolvedValue(undefined)

      const result = await selectMessagingAngle(mockCampaignId, 1)

      expect(result.success).toBe(true)
    })

    it('should accept angleIndex 2', async () => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      (prisma.strategy.update as Mock).mockResolvedValue({ ...mockStrategy, selectedAngleIndex: 2 });
      (resumePipelineAfterAngleSelection as Mock).mockResolvedValue(undefined)

      const result = await selectMessagingAngle(mockCampaignId, 2)

      expect(result.success).toBe(true)
    })
  })

  // ========================================================================
  // Strategy Existence Tests
  // ========================================================================

  describe('Strategy Existence Validation', () => {
    it('should return error when strategy not found', async () => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(null)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Campaign strategy not found'
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Campaign Status Validation Tests
  // ========================================================================

  describe('Campaign Status Validation', () => {
    it('should reject when status is draft', async () => {
      const draftStrategy = {
        ...mockStrategy,
        campaign: { ...mockStrategy.campaign, status: 'draft' }
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(draftStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: "Cannot select messaging angle. Campaign status is 'draft', expected 'positioning_complete'."
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })

    it('should reject when status is intelligence_complete', async () => {
      const intelligenceStrategy = {
        ...mockStrategy,
        campaign: { ...mockStrategy.campaign, status: 'intelligence_complete' }
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(intelligenceStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: "Cannot select messaging angle. Campaign status is 'intelligence_complete', expected 'positioning_complete'."
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })

    it('should reject when status is aida_complete', async () => {
      const aidaStrategy = {
        ...mockStrategy,
        campaign: { ...mockStrategy.campaign, status: 'aida_complete' }
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(aidaStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: "Cannot select messaging angle. Campaign status is 'aida_complete', expected 'positioning_complete'."
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })

    it('should accept when status is positioning_complete', async () => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      (prisma.strategy.update as Mock).mockResolvedValue({ ...mockStrategy, selectedAngleIndex: 0 });
      (resumePipelineAfterAngleSelection as Mock).mockResolvedValue(undefined)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result.success).toBe(true)
    })
  })

  // ========================================================================
  // Messaging Angles Validation Tests
  // ========================================================================

  describe('Messaging Angles Validation', () => {
    it('should reject when messagingAngles is not an array', async () => {
      const invalidStrategy = {
        ...mockStrategy,
        messagingAngles: {} // Not an array
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(invalidStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Campaign does not have valid messaging angles'
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })

    it('should reject when messagingAngles has fewer than 3 elements', async () => {
      const invalidStrategy = {
        ...mockStrategy,
        messagingAngles: [mockMessagingAngles[0], mockMessagingAngles[1]] // Only 2 angles
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(invalidStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Campaign does not have valid messaging angles'
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })

    it('should reject when messagingAngles has more than 3 elements', async () => {
      const invalidStrategy = {
        ...mockStrategy,
        messagingAngles: [...mockMessagingAngles, mockMessagingAngles[0]] // 4 angles
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(invalidStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Campaign does not have valid messaging angles'
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })

    it('should reject when selected angle does not exist at index', async () => {
      const sparseStrategy = {
        ...mockStrategy,
        messagingAngles: [mockMessagingAngles[0], undefined, mockMessagingAngles[2]] // Index 1 is undefined
      }
      ;(prisma.strategy.findUnique as Mock).mockResolvedValue(sparseStrategy)

      const result = await selectMessagingAngle(mockCampaignId, 1)

      expect(result).toEqual({
        success: false,
        error: 'Invalid angle index: 1'
      })
      expect(prisma.strategy.update).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Successful Selection Tests
  // ========================================================================

  describe('Successful Angle Selection', () => {
    beforeEach(() => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      (resumePipelineAfterAngleSelection as Mock).mockResolvedValue(undefined)
    })

    it('should update selectedAngleIndex in database', async () => {
      (prisma.strategy.update as Mock).mockResolvedValue({ 
        ...mockStrategy, 
        selectedAngleIndex: 1 
      })

      await selectMessagingAngle(mockCampaignId, 1)

      expect(prisma.strategy.update).toHaveBeenCalledWith({
        where: { campaignId: mockCampaignId },
        data: { 
          selectedAngleIndex: 1,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should trigger pipeline resumption with correct parameters', async () => {
      (prisma.strategy.update as Mock).mockResolvedValue({ 
        ...mockStrategy, 
        selectedAngleIndex: 2 
      })

      await selectMessagingAngle(mockCampaignId, 2)

      // Give a moment for the async call to be registered
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(resumePipelineAfterAngleSelection).toHaveBeenCalledWith(
        mockCampaignId,
        2
      )
    })

    it('should revalidate campaign dashboard path', async () => {
      (prisma.strategy.update as Mock).mockResolvedValue({ 
        ...mockStrategy, 
        selectedAngleIndex: 0 
      })

      await selectMessagingAngle(mockCampaignId, 0)

      expect(revalidatePath).toHaveBeenCalledWith(`/campaign/${mockCampaignId}`)
    })

    it('should return success result', async () => {
      (prisma.strategy.update as Mock).mockResolvedValue({ 
        ...mockStrategy, 
        selectedAngleIndex: 1 
      })

      const result = await selectMessagingAngle(mockCampaignId, 1)

      expect(result).toEqual({
        success: true,
        data: { success: true }
      })
    })

    it('should handle pipeline resumption errors gracefully', async () => {
      (prisma.strategy.update as Mock).mockResolvedValue({ 
        ...mockStrategy, 
        selectedAngleIndex: 0 
      });
      
      // Mock pipeline to reject
      (resumePipelineAfterAngleSelection as Mock).mockRejectedValue(
        new Error('Pipeline error')
      )

      const result = await selectMessagingAngle(mockCampaignId, 0)

      // Should still return success since pipeline runs async
      expect(result).toEqual({
        success: true,
        data: { success: true }
      })

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10))

      // Error should be logged but not thrown
      expect(console.error).toHaveBeenCalledWith(
        '[Server Action] Pipeline resumption failed:',
        expect.any(Error)
      )
    })
  })

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle database errors during strategy fetch', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.strategy.findUnique as Mock).mockRejectedValue(dbError)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Database connection failed'
      })
    })

    it('should handle database errors during update', async () => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      const updateError = new Error('Update failed');
      (prisma.strategy.update as Mock).mockRejectedValue(updateError)

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Update failed'
      })
    })

    it('should handle unexpected errors', async () => {
      (prisma.strategy.findUnique as Mock).mockRejectedValue('String error')

      const result = await selectMessagingAngle(mockCampaignId, 0)

      expect(result).toEqual({
        success: false,
        error: 'Failed to select messaging angle. Please try again.'
      })
    })
  })

  // ========================================================================
  // Requirements Coverage Tests
  // ========================================================================

  describe('Requirements Coverage', () => {
    beforeEach(() => {
      (prisma.strategy.findUnique as Mock).mockResolvedValue(mockStrategy);
      (prisma.strategy.update as Mock).mockResolvedValue({ 
        ...mockStrategy, 
        selectedAngleIndex: 1 
      });
      (resumePipelineAfterAngleSelection as Mock).mockResolvedValue(undefined)
    })

    it('should satisfy Req 3.3: Record selected messaging angle', async () => {
      // Req 3.3: WHEN the User selects exactly one Messaging_Angle, 
      // THE System SHALL record that selection
      
      const result = await selectMessagingAngle(mockCampaignId, 1)

      expect(result.success).toBe(true)
      expect(prisma.strategy.update).toHaveBeenCalledWith({
        where: { campaignId: mockCampaignId },
        data: { 
          selectedAngleIndex: 1,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should satisfy Req 3.5: Use selected angle as sole anchor', async () => {
      // Req 3.5: WHEN the User selects exactly one Messaging_Angle, 
      // THE System SHALL use it as the sole anchor for all subsequent Campaign_Asset copy
      // (verified by triggering resumePipelineAfterAngleSelection with the selected index)
      
      await selectMessagingAngle(mockCampaignId, 2)

      // Give a moment for the async call
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(resumePipelineAfterAngleSelection).toHaveBeenCalledWith(
        mockCampaignId,
        2
      )
    })
  })
})
