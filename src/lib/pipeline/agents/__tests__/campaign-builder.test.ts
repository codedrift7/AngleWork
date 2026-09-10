/**
 * Unit tests for Campaign Builder AI Agent - LinkedIn Posts
 * 
 * Tests structured output validation, character limits, stage assignments,
 * placeholder insertion, and messaging angle consistency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { campaignBuilderLinkedInAgent } from '../campaign-builder'
import type { CampaignBuilderLinkedInInput } from '../campaign-builder'
import * as llmClient from '@/lib/ai/llm-client'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('campaignBuilderLinkedInAgent', () => {
  const mockInput: CampaignBuilderLinkedInInput = {
    campaignId: 'test-campaign-123',
    data: {
      productBrief: {
        productName: 'FinanceBot',
        description: 'AI-powered bookkeeping assistant for freelancers',
        category: 'Financial Software',
        productType: 'SaaS',
        targetCustomer: 'Freelancers earning $30k-$150k/year',
        customerProblem: 'Spending hours on bookkeeping instead of client work',
        customerSophistication: 'Aware of problem, unsure of solution',
        mainBenefit: 'Automated bookkeeping that takes 10 minutes per week',
        keyDifferentiator: 'AI that understands freelance finances specifically',
        price: '$29/month',
        marketingGoal: 'Acquire 100 beta users',
        launchType: 'Soft launch',
        desiredCTA: 'Start your 14-day free trial',
        primaryChannel: 'LinkedIn',
        campaignDuration: '30 days'
      },
      aidaStrategy: {
        attention: {
          stage: 'attention' as const,
          objective: 'Hook freelancers with the financial uncertainty they experience',
          contentDirection: 'Lead with the gap between bank balance and spendable money',
          keyPoints: [
            'Your bank balance isn\'t the same as knowing how much you can spend',
            'Financial uncertainty keeps you up at night'
          ]
        },
        interest: {
          stage: 'interest' as const,
          objective: 'Reveal the hidden cost of poor financial visibility',
          contentDirection: 'The real cost is making business decisions with incomplete data',
          keyPoints: [
            'Bad financial data leads to bad business decisions',
            'You\'re losing money without knowing it'
          ]
        },
        desire: {
          stage: 'desire' as const,
          objective: 'Paint the picture of financial clarity and confidence',
          contentDirection: 'Show life after: knowing real numbers in minutes',
          keyPoints: [
            'Know your real profit margin in 2 minutes',
            'Make confident business decisions'
          ],
          proofRequirements: ['[TESTIMONIAL]']
        },
        action: {
          stage: 'action' as const,
          objective: 'Make it easy to start the free trial',
          contentDirection: 'Introduce product, reduce friction, clear CTA',
          keyPoints: [
            'Built specifically for freelance finances',
            '14-day trial, no credit card required'
          ]
        }
      },
      selectedAngle: {
        type: 'pain' as const,
        tagline: 'Stop guessing where your money went',
        coreMessage: 'Freelancers deserve financial clarity without becoming accountants',
        rationale: 'Pain-focused angle resonates with the primary customer frustration'
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Valid structured output', () => {
    it('should generate exactly 4 LinkedIn posts with correct structure', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Your bank balance says $12,453.\n\nBut how much can you actually spend?\n\nIf you\'re a freelancer, you know these aren\'t the same number.\n\nBetween taxes, business expenses, and invoices still waiting to clear, that number in your account is mostly fiction.\n\nStop guessing where your money went.',
            strategicPurpose: 'Hook freelancers with the financial uncertainty gap they experience daily'
          },
          tokensUsed: 250
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'The real cost of messy bookkeeping isn\'t the 3 hours you spend every Sunday.\n\nIt\'s the business decisions you\'re making with incomplete data.\n\nYou\'re flying blind on:\n- Which clients are actually profitable\n- Whether you can afford that new tool\n- How much to set aside for taxes\n\nBad financial data leads to bad business decisions. And those mistakes are expensive.',
            strategicPurpose: 'Reveal the hidden cost of poor financial visibility for freelance businesses'
          },
          tokensUsed: 200
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Imagine knowing your real profit margin in 2 minutes.\n\nNot "bank balance minus a guess."\n\nActual profit. After taxes. After expenses. After everything.\n\nNo spreadsheets. No Sunday night panic. No accounting degree required.\n\nJust financial clarity that lets you make confident business decisions.\n\nAs one freelancer said: [Insert customer testimonial here]\n\nThat\'s the difference between guessing and knowing.',
            strategicPurpose: 'Paint the picture of financial clarity and confidence without becoming an accountant'
          },
          tokensUsed: 220
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'That\'s why we built FinanceBot.\n\nAI-powered bookkeeping that understands freelance finances specifically.\n\nNot generic accounting software adapted for freelancers. Built for you from the ground up.\n\n✓ Know your real numbers in minutes\n✓ Automated transaction categorization\n✓ Proactive tax estimates\n✓ No spreadsheets required\n\nStart your 14-day free trial. No credit card required.\n\nStop guessing. Start knowing.',
            strategicPurpose: 'Introduce FinanceBot as the solution with clear CTA and reduced friction'
          },
          tokensUsed: 230
        }
      ] as Array<any> & { tokensUsed?: number }
      
      // Add tokensUsed property to the array itself
      mockResponse.tokensUsed = 900

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      const result = await campaignBuilderLinkedInAgent(mockInput)

      expect(result.result).toHaveLength(4)
      expect(result.result[0].channel).toBe('linkedin')
      expect(result.result[0].assetType).toBe('post')
      expect(result.result[0].stage).toBe('attention')
      expect(result.metadata.tokensUsed).toBeGreaterThan(0)
      expect(result.metadata.executionTimeMs).toBeGreaterThan(0)
    })

    it('should validate all 4 AIDA stages are present in order', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Test attention post content with at least 50 characters to meet validation requirements.',
            strategicPurpose: 'Hook the audience with a relevant pain point'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Test interest post content with at least 50 characters to meet validation requirements.',
            strategicPurpose: 'Reveal the cost of inaction'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Test desire post content with at least 50 characters to meet validation requirements.',
            strategicPurpose: 'Show the transformation outcome'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'Test action post content with at least 50 characters to meet validation requirements.',
            strategicPurpose: 'Drive to the call-to-action'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      const result = await campaignBuilderLinkedInAgent(mockInput)

      expect(result.result[0].stage).toBe('attention')
      expect(result.result[1].stage).toBe('interest')
      expect(result.result[2].stage).toBe('desire')
      expect(result.result[3].stage).toBe('action')
    })
  })

  describe('Character limit enforcement (Req 5.2)', () => {
    it('should reject posts exceeding 3,000 characters', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'a'.repeat(3001), // Exceeds limit
            strategicPurpose: 'Hook the audience'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid content under 3000 characters',
            strategicPurpose: 'Reveal the cost'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Valid content under 3000 characters',
            strategicPurpose: 'Show transformation'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'Valid content under 3000 characters',
            strategicPurpose: 'Drive action'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      await expect(campaignBuilderLinkedInAgent(mockInput)).rejects.toThrow(
        /exceeds 3,000 character limit/
      )
    })

    it('should accept posts at exactly 3,000 characters', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'a'.repeat(3000), // Exactly at limit
            strategicPurpose: 'Hook the audience'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid content under 3000 characters',
            strategicPurpose: 'Reveal the cost'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Valid content under 3000 characters',
            strategicPurpose: 'Show transformation'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'Valid content under 3000 characters',
            strategicPurpose: 'Drive action'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      const result = await campaignBuilderLinkedInAgent(mockInput)

      expect(result.result[0].content.content).toHaveLength(3000)
    })
  })

  describe('Placeholder insertion (Req 5.7)', () => {
    it('should include placeholders when proof requirements exist but no testimonials provided', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Valid attention post content with enough characters to pass validation.',
            strategicPurpose: 'Hook the audience'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid interest post content with enough characters to pass validation.',
            strategicPurpose: 'Reveal the cost'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Know your real numbers in minutes. As one customer said: [Insert customer testimonial here]. That\'s the difference between guessing and knowing.',
            strategicPurpose: 'Show transformation with social proof placeholder'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'Valid action post content with enough characters to pass validation.',
            strategicPurpose: 'Drive action'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      const result = await campaignBuilderLinkedInAgent(mockInput)

      // Desire stage should contain placeholder since proof requirements exist
      const desirePost = result.result[2].content as { content: string }
      expect(desirePost.content).toContain('[Insert customer testimonial here]')
    })
  })

  describe('Error handling', () => {
    it('should throw error if fewer than 4 posts generated', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Valid content',
            strategicPurpose: 'Hook'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid content',
            strategicPurpose: 'Educate'
          }
        }
        // Missing desire and action posts
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      await expect(campaignBuilderLinkedInAgent(mockInput)).rejects.toThrow(
        /Expected 4 LinkedIn posts but got 2/
      )
    })

    it('should throw error if post has incorrect channel', async () => {
      const mockResponse = [
        {
          channel: 'email', // Wrong channel
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Hook'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Educate'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Transform'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Act'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      await expect(campaignBuilderLinkedInAgent(mockInput)).rejects.toThrow(
        /incorrect channel/
      )
    })

    it('should throw error if post has incorrect stage order', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'interest', // Wrong stage (should be attention)
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Educate'
          }
        },
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Hook'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Transform'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'Valid content with at least 50 characters',
            strategicPurpose: 'Act'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      await expect(campaignBuilderLinkedInAgent(mockInput)).rejects.toThrow(
        /incorrect stage/
      )
    })
  })

  describe('Messaging angle consistency (Req 5.6)', () => {
    it('should reference the selected messaging angle tagline in posts', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Your bank balance says one thing. But where did your money actually go? Stop guessing where your money went. That gap between knowing and guessing keeps you up at night.',
            strategicPurpose: 'Hook with the messaging angle: stop guessing'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'When you\'re guessing about your finances, every business decision is a gamble. Stop guessing where your money went and start making decisions with confidence.',
            strategicPurpose: 'Reinforce the angle in education'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Imagine: no more guessing. Know exactly where your money is, where it went, and what you can spend. That\'s financial clarity.',
            strategicPurpose: 'Paint the outcome of stopping the guessing'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'FinanceBot helps you stop guessing where your money went. Start your 14-day free trial today.',
            strategicPurpose: 'Connect product to the messaging angle'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      const result = await campaignBuilderLinkedInAgent(mockInput)

      // Check that the messaging angle tagline appears in multiple posts
      const allContent = result.result
        .map(post => (post.content as { content: string }).content)
        .join(' ')
      
      expect(allContent.toLowerCase()).toContain('stop guessing')
      expect(allContent.toLowerCase()).toContain('guessing')
    })
  })

  describe('Product-specific differentiators (Req 5.8)', () => {
    it('should reference actual product name and specific differentiators', async () => {
      const mockResponse = [
        {
          channel: 'linkedin',
          stage: 'attention',
          assetType: 'post',
          title: 'Attention LinkedIn Post',
          content: {
            stage: 'attention',
            content: 'Valid attention post that meets minimum character requirements for testing.',
            strategicPurpose: 'Hook'
          }
        },
        {
          channel: 'linkedin',
          stage: 'interest',
          assetType: 'post',
          title: 'Interest LinkedIn Post',
          content: {
            stage: 'interest',
            content: 'Valid interest post that meets minimum character requirements for testing.',
            strategicPurpose: 'Educate'
          }
        },
        {
          channel: 'linkedin',
          stage: 'desire',
          assetType: 'post',
          title: 'Desire LinkedIn Post',
          content: {
            stage: 'desire',
            content: 'Valid desire post that meets minimum character requirements for testing.',
            strategicPurpose: 'Transform'
          }
        },
        {
          channel: 'linkedin',
          stage: 'action',
          assetType: 'post',
          title: 'Action LinkedIn Post',
          content: {
            stage: 'action',
            content: 'FinanceBot is AI-powered bookkeeping built specifically for freelancers. Not adapted. Built for you. Start your 14-day free trial.',
            strategicPurpose: 'Introduce product with specific differentiator'
          }
        }
      ]

      vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResponse)

      const result = await campaignBuilderLinkedInAgent(mockInput)

      // Action post should reference actual product name
      const actionPost = result.result[3].content as { content: string }
      expect(actionPost.content).toContain('FinanceBot')
      expect(actionPost.content).toContain('freelancers')
    })
  })
})
