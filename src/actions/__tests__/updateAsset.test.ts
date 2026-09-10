/**
 * Unit tests for updateAsset server action
 * 
 * Tests Requirements 8.3 and 8.4:
 * - Updates asset content in the database
 * - Sets manuallyEdited flag to true
 * - Increments asset version
 * - Revalidates campaign dashboard path
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { updateAsset } from '../campaign'
import { prisma } from '@/db'
import { revalidatePath } from 'next/cache'

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

// Mock Prisma
vi.mock('@/db', () => ({
  prisma: {
    asset: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

describe('updateAsset server action', () => {
  const mockCampaignId = 'campaign-123'
  const mockAssetId = 'asset-123'

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
  // Successful Update Tests
  // ========================================================================

  describe('Successful Update', () => {
    it('should successfully update asset content with valid parameters', async () => {
      // Arrange
      const originalVersion = 1
      const newContent = {
        headline: 'Updated Headline',
        body: 'Updated body content'
      }

      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        channel: 'linkedin',
        stage: 'attention',
        assetType: 'post',
        version: originalVersion,
        manuallyEdited: false,
        content: { headline: 'Old Headline', body: 'Old body' }
      }

      const mockUpdatedAsset = {
        ...mockAsset,
        content: newContent,
        version: originalVersion + 1,
        manuallyEdited: true
      }

      ;(prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any)
      ;(prisma.asset.update as Mock).mockResolvedValue(mockUpdatedAsset as any)

      // Act
      const result = await updateAsset(mockAssetId, JSON.stringify(newContent))

      // Assert
      expect(result.success).toBe(true)
      expect(prisma.asset.findUnique).toHaveBeenCalledWith({
        where: { id: mockAssetId }
      })
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: {
          content: newContent,
          manuallyEdited: true,
          version: originalVersion + 1,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should set manuallyEdited to true per Req 8.4', async () => {
      // Arrange
      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        version: 1,
        manuallyEdited: false,
        content: { text: 'old' }
      }

      ;(prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any)
      ;(prisma.asset.update as Mock).mockResolvedValue({
        ...mockAsset,
        manuallyEdited: true
      } as any)

      // Act
      await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      // Assert
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: expect.objectContaining({
          manuallyEdited: true
        })
      })
    })

    it('should increment asset version', async () => {
      // Arrange
      const originalVersion = 5
      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        version: originalVersion,
        content: { text: 'old' }
      }

      ;(prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any)
      ;(prisma.asset.update as Mock).mockResolvedValue({
        ...mockAsset,
        version: originalVersion + 1
      } as any)

      // Act
      await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      // Assert
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: expect.objectContaining({
          version: originalVersion + 1
        })
      })
    })

    it('should revalidate campaign dashboard path', async () => {
      // Arrange
      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        version: 1,
        content: { text: 'old' }
      }

      ;(prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any)
      ;(prisma.asset.update as Mock).mockResolvedValue({
        ...mockAsset,
        content: { text: 'new' }
      } as any)

      // Act
      await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith(`/campaign/${mockCampaignId}`)
    })

    it('should update complex nested content structures', async () => {
      // Arrange
      const complexContent = {
        headline: 'New Headline',
        subheadline: 'New Subheadline',
        sections: [
          { title: 'Section 1', content: 'Content 1' },
          { title: 'Section 2', content: 'Content 2' }
        ],
        metadata: {
          author: 'User',
          timestamp: Date.now()
        }
      }

      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        version: 1,
        content: { old: 'content' }
      }

      ;(prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any)
      ;(prisma.asset.update as Mock).mockResolvedValue({
        ...mockAsset,
        content: complexContent
      } as any)

      // Act
      const result = await updateAsset(mockAssetId, JSON.stringify(complexContent))

      // Assert
      expect(result.success).toBe(true)
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: expect.objectContaining({
          content: complexContent
        })
      })
    })
  })

  // ========================================================================
  // Parameter Validation Tests
  // ========================================================================

  describe('Parameter Validation', () => {
    it('should return error for empty assetId', async () => {
      // Act
      const result = await updateAsset('', JSON.stringify({ text: 'test' }))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid asset ID')
      expect(prisma.asset.findUnique).not.toHaveBeenCalled()
    })

    it('should return error for empty content', async () => {
      // Act
      const result = await updateAsset(mockAssetId, '')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid content')
      expect(prisma.asset.findUnique).not.toHaveBeenCalled()
    })

    it('should return error for invalid JSON content', async () => {
      // Act
      const result = await updateAsset(mockAssetId, 'not valid JSON')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid content format')
      expect(prisma.asset.findUnique).not.toHaveBeenCalled()
    })

    it('should return error if asset not found', async () => {
      // Arrange
      ;(prisma.asset.findUnique as Mock).mockResolvedValue(null)

      // Act
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'test' }))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Asset not found')
      expect(prisma.asset.update).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle database errors during asset fetch', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (prisma.asset.findUnique as Mock).mockRejectedValue(dbError)

      // Act
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'test' }))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle database errors during update', async () => {
      // Arrange
      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        version: 1,
        content: { text: 'old' }
      }
      const updateError = new Error('Update failed');
      
      (prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any);
      (prisma.asset.update as Mock).mockRejectedValue(updateError)

      // Act
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })

    it('should handle unexpected errors', async () => {
      // Arrange
      ;(prisma.asset.findUnique as Mock).mockRejectedValue('String error')

      // Act
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'test' }))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update asset. Please try again.')
    })
  })

  // ========================================================================
  // Requirements Coverage Tests
  // ========================================================================

  describe('Requirements Coverage', () => {
    beforeEach(() => {
      const mockAsset = {
        id: mockAssetId,
        campaignId: mockCampaignId,
        version: 1,
        manuallyEdited: false,
        content: { text: 'old' }
      }

      ;(prisma.asset.findUnique as Mock).mockResolvedValue(mockAsset as any)
      ;(prisma.asset.update as Mock).mockResolvedValue({
        ...mockAsset,
        content: { text: 'new' },
        manuallyEdited: true,
        version: 2
      } as any)
    })

    it('should satisfy Req 8.3: Make assets editable and persist changes within 2 seconds', async () => {
      // Req 8.3: THE System SHALL make all generated Campaign_Assets editable by the User 
      // directly in the Campaign Dashboard; WHEN the User saves an edit, THE System SHALL 
      // persist the change within 2 seconds
      
      const startTime = Date.now()
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(2000)
      expect(prisma.asset.update).toHaveBeenCalled()
    })

    it('should satisfy Req 8.4: Mark asset as manually modified', async () => {
      // Req 8.4: WHEN a User edits a Campaign_Asset, THE System SHALL preserve the User's edit, 
      // mark the asset with a visible "manually modified" indicator, and exclude the asset from 
      // any AI batch regeneration operation unless the User explicitly selects it.
      
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      expect(result.success).toBe(true)
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: expect.objectContaining({
          manuallyEdited: true
        })
      })
    })

    it('should satisfy Req 8.4: Increment version for tracking', async () => {
      // Version increment helps track edit history
      
      const result = await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      expect(result.success).toBe(true)
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: expect.objectContaining({
          version: 2
        })
      })
    })

    it('should revalidate dashboard after update', async () => {
      // Ensure dashboard shows updated content immediately
      
      await updateAsset(mockAssetId, JSON.stringify({ text: 'new' }))

      expect(revalidatePath).toHaveBeenCalledWith(`/campaign/${mockCampaignId}`)
    })
  })
})
