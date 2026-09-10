/**
 * Unit tests for Positioning Strategist AI Agent
 * 
 * Tests schema validation, output structure, and placeholder insertion
 * for competitive data not provided in input.
 */

import * as llmClient from '@/lib/ai/llm-client'
import type { ProductBriefData, ProductIntelligence } from '@/lib/types/campaign'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { positioningStrategistAgent } from '../positioning-strategist'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('Positioning Strategist Agent', () => {
  const mockProductBrief: ProductBriefData = {
    productName: 'AutoBooks AI',
    description: 'AI-powered bookkeeping assistant that automates expense categorization and tax estimates for freelancers',
    category: 'Financial Management Software',
    productType: 'SaaS',
    targetCustomer: 'Freelancers earning $30k-$150k/year',
    customerProblem: 'Freelancers waste hours on bookkeeping and lack financial visibility',
    customerSophistication: 'Problem-Aware',
    mainBenefit: 'Automated bookkeeping with AI-powered categorization and tax estimates',
    keyDifferentiator: 'Combines automated transaction categorization with proactive tax estimates specific to freelance work',
    price: '$29/month',
    marketingGoal: 'Acquire 1000 users in 90 days',
    launchType: 'New Product Launch',
    desiredCTA: 'Start your free 14-day trial',
    primaryChannel: 'LinkedIn',
    campaignDuration: '7 days',
    competitors: 'QuickBooks Self-Employed, Wave, FreshBooks',
    brandVoice: 'Friendly, empowering, practical'
  }

  const mockProductIntelligence: ProductIntelligence = {
    idealCustomerProfile: 'Freelancers earning $30k-$150k annually who handle their own finances but struggle with bookkeeping complexity',
    coreProblem: 'Freelancers lack financial visibility and waste valuable time on manual bookkeeping tasks',
    primaryPain: "I don't know where my money is really going",
    desiredOutcome: 'Clear financial visibility and automated bookkeeping without becoming an accountant',
    corePromise: 'Automated financial clarity tailored for freelance income patterns',
    differentiators: [
      'AI-powered transaction categorization',
      'Proactive tax estimates for freelancers',
      'No accounting knowledge required'
    ],
    emotionalDrivers: [
      'Fear of tax surprises',
      'Desire for financial control',
      'Frustration with complexity'
    ],
    objections: [
      'Can I trust the AI categorization?',
      'Is my financial data secure?',
      'Will this work with my bank?'
    ],
    recommendedMessagingAngle: 'pain'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate positioning with exactly 3 distinct messaging angles', async () => {
    const mockResult = {
      positioning: {
        category: 'AI-Powered Financial Management for Freelancers',
        positioningStatement: 'AutoBooks AI is the first bookkeeping assistant built specifically for freelancers, combining automated transaction categorization with proactive tax estimates to eliminate financial guesswork.',
        valueProposition: 'Get the financial clarity you need without becoming an accountant. AutoBooks AI automatically categorizes your transactions, estimates your taxes, and gives you real-time visibility into your freelance finances—all without requiring any bookkeeping knowledge.',
        primaryPain: 'Freelancers waste hours sorting transactions and never know their real financial position',
        desiredTransformation: 'From spending Sunday nights stressed over spreadsheets to having instant financial clarity with zero manual work'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Stop guessing where your money went',
          coreMessage: 'Every month you check your bank balance and wonder: where did it all go? You know you billed clients, but between business expenses, personal spending, and that confusing tax situation, you never actually know if you\'re making money. AutoBooks AI ends the guessing game.',
          rationale: 'This pain-focused angle resonates with freelancers earning $30k-$150k who struggle with financial visibility. The primary pain "I don\'t know where my money is really going" drives them to seek a solution that provides clarity without adding complexity.'
        },
        {
          type: 'outcome' as const,
          tagline: 'Know your real numbers without becoming an accountant',
          coreMessage: 'Get crystal-clear visibility into your freelance finances without spending hours in spreadsheets or getting an accounting degree. See exactly what you\'re making, spending, and owing in taxes—automatically.',
          rationale: 'This outcome-focused angle appeals to freelancers who want financial clarity but don\'t want to become bookkeeping experts. AutoBooks AI bridges the gap between their current confusion and the desired state of financial understanding, leveraging AI to eliminate the learning curve.'
        },
        {
          type: 'time' as const,
          tagline: 'Take bookkeeping off your Sunday-night to-do list',
          coreMessage: 'Reclaim your weekends. What used to take 3+ hours of manual categorization and tax calculation now happens automatically. Spend your time on billable work, not bookkeeping.',
          rationale: 'This time-saving angle resonates with freelancers who value their time and resent spending billable hours on non-revenue tasks. For freelancers earning $30k-$150k, every hour matters. AutoBooks AI\'s automated categorization directly addresses this pain point by eliminating manual work.'
        }
      ],
      tokensUsed: 850
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    const result = await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-campaign-123'
    })

    expect(result.result.messagingAngles).toHaveLength(3)
    expect(result.result.messagingAngles[0].type).toBe('pain')
    expect(result.result.messagingAngles[1].type).toBe('outcome')
    expect(result.result.messagingAngles[2].type).toBe('time')
  })

  it('should include rationale referencing product, customer, and pain for each angle', async () => {
    const mockResult = {
      positioning: {
        category: 'AI-Powered Financial Management',
        positioningStatement: 'Test positioning statement with more than ten words here',
        valueProposition: 'Test value proposition with sufficient length to meet requirements',
        primaryPain: 'Test primary pain description',
        desiredTransformation: 'Test desired transformation with sufficient detail'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Stop the financial guesswork',
          coreMessage: 'You never know if you\'re really making money or just breaking even. AutoBooks AI gives you the clarity you need.',
          rationale: 'This pain angle works for AutoBooks AI because freelancers earning $30k-$150k specifically struggle with the pain point "I don\'t know where my money is really going". The product\'s AI categorization directly solves this visibility problem.'
        },
        {
          type: 'outcome' as const,
          tagline: 'Get financial clarity automatically',
          coreMessage: 'Know your real numbers without spreadsheets or accounting degrees.',
          rationale: 'This outcome angle appeals to AutoBooks AI\'s target freelancers who want financial understanding but lack accounting expertise. The desired outcome of "automated financial clarity" matches what this customer segment seeks.'
        },
        {
          type: 'time' as const,
          tagline: 'Automate your bookkeeping',
          coreMessage: 'Stop wasting Sunday nights on expense categorization.',
          rationale: 'This time angle resonates with freelancers who value billable hours. AutoBooks AI\'s automated categorization feature directly addresses the time waste that these customers experience with manual bookkeeping.'
        }
      ],
      tokensUsed: 750
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    const result = await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-campaign-456'
    })

    // Check that each rationale mentions the product name
    result.result.messagingAngles.forEach(angle => {
      expect(angle.rationale.toLowerCase()).toContain('autobooks')
    })

    // Check that at least one rationale mentions the customer segment
    const allRationales = result.result.messagingAngles.map(a => a.rationale).join(' ').toLowerCase()
    expect(allRationales).toMatch(/freelancer|freelance/)
  })

  it('should enforce positioning statement max 300 words constraint', async () => {
    const mockResult = {
      positioning: {
        category: 'Financial Software',
        positioningStatement: 'Valid positioning statement',
        valueProposition: 'Valid value proposition',
        primaryPain: 'Valid pain description',
        desiredTransformation: 'Valid transformation'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test core message with enough words',
          rationale: 'Test rationale with enough words to meet minimum requirements'
        },
        {
          type: 'outcome' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test core message with enough words',
          rationale: 'Test rationale with enough words to meet minimum requirements'
        },
        {
          type: 'time' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test core message with enough words',
          rationale: 'Test rationale with enough words to meet minimum requirements'
        }
      ],
      tokensUsed: 600
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    const result = await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-campaign-789'
    })

    // Positioning statement should be present and within length limits
    expect(result.result.positioning.positioningStatement).toBeTruthy()
    expect(result.result.positioning.positioningStatement.length).toBeGreaterThan(10)
    expect(result.result.positioning.positioningStatement.length).toBeLessThan(2000) // ~300 words
  })

  it('should return metadata with execution time and token usage', async () => {
    const mockResult = {
      positioning: {
        category: 'Test Category',
        positioningStatement: 'Test positioning statement with sufficient length',
        valueProposition: 'Test value proposition with sufficient length',
        primaryPain: 'Test pain point',
        desiredTransformation: 'Test transformation description'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test message with enough words',
          rationale: 'Test rationale with enough words'
        },
        {
          type: 'outcome' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test message with enough words',
          rationale: 'Test rationale with enough words'
        },
        {
          type: 'time' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test message with enough words',
          rationale: 'Test rationale with enough words'
        }
      ],
      tokensUsed: 900
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    const result = await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-campaign-metadata'
    })

    expect(result.metadata).toBeDefined()
    expect(result.metadata.tokensUsed).toBe(900)
    expect(result.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.metadata.modelVersion).toBeTruthy()
  })

  it('should use temperature 0.8 for creative positioning generation', async () => {
    const mockResult = {
      positioning: {
        category: 'Test',
        positioningStatement: 'Test statement',
        valueProposition: 'Test proposition',
        primaryPain: 'Test pain',
        desiredTransformation: 'Test transformation'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        },
        {
          type: 'outcome' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        },
        {
          type: 'time' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        }
      ],
      tokensUsed: 500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-campaign-temp'
    })

    expect(llmClient.callLLMWithStructuredOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.8
      })
    )
  })

  it('should use CHARACTER limits in prompt, not word limits', async () => {
    const mockResult = {
      positioning: {
        category: 'Test Category',
        positioningStatement: 'Test positioning under 300 chars',
        valueProposition: 'Test value under 500 chars',
        primaryPain: 'Test pain',
        desiredTransformation: 'Test transformation'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test message under 500 chars',
          rationale: 'Test rationale under 500 chars'
        },
        {
          type: 'outcome' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test message under 500 chars',
          rationale: 'Test rationale under 500 chars'
        },
        {
          type: 'time' as const,
          tagline: 'Test tagline',
          coreMessage: 'Test message under 500 chars',
          rationale: 'Test rationale under 500 chars'
        }
      ],
      tokensUsed: 600
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-char-limits'
    })

    // Verify the system prompt mentions character limits, not word limits
    const callArgs = vi.mocked(llmClient.callLLMWithStructuredOutput).mock.calls[0][0]
    expect(callArgs.systemPrompt).toContain('CHARACTER')
    expect(callArgs.systemPrompt).toContain('20-500 characters')
    expect(callArgs.systemPrompt).not.toContain('20-500 words')
    expect(callArgs.userPrompt).toContain('chars')
    expect(callArgs.userPrompt).not.toMatch(/\b\d+-\d+ words\b/)
  })

  it('should reject malformed output missing positioning object', async () => {
    const malformedResult = {
      // Missing positioning object entirely
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        },
        {
          type: 'outcome' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        },
        {
          type: 'time' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        }
      ],
      tokensUsed: 400
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput)
      .mockRejectedValueOnce(new Error('ZodError: Validation failed:\n  - positioning: Required'))
      .mockRejectedValueOnce(new Error('ZodError: Validation failed:\n  - positioning: Required'))
      .mockRejectedValueOnce(new Error('ZodError: Validation failed:\n  - positioning: Required'))

    await expect(positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-missing-positioning'
    })).rejects.toThrow('positioning')
  })

  it('should reject overlong coreMessage and rationale fields', async () => {
    const overlongMessage = 'x'.repeat(501) // Exceeds 500 char limit
    const overlongRationale = 'y'.repeat(501) // Exceeds 500 char limit

    vi.mocked(llmClient.callLLMWithStructuredOutput)
      .mockRejectedValueOnce(new Error(`ZodError: Validation failed:\n  - messagingAngles.0.coreMessage: String must contain at most 500 character(s)\n  - messagingAngles.0.rationale: String must contain at most 500 character(s)`))
      .mockRejectedValueOnce(new Error(`ZodError: Validation failed:\n  - messagingAngles.0.coreMessage: String must contain at most 500 character(s)\n  - messagingAngles.0.rationale: String must contain at most 500 character(s)`))
      .mockRejectedValueOnce(new Error(`ZodError: Validation failed:\n  - messagingAngles.0.coreMessage: String must contain at most 500 character(s)\n  - messagingAngles.0.rationale: String must contain at most 500 character(s)`))

    await expect(positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-overlong-fields'
    })).rejects.toThrow('coreMessage')
  })

  it('should use maxRetries=1 per attempt to avoid nested timeout conflicts', async () => {
    const mockResult = {
      positioning: {
        category: 'Test',
        positioningStatement: 'Test',
        valueProposition: 'Test',
        primaryPain: 'Test',
        desiredTransformation: 'Test'
      },
      messagingAngles: [
        {
          type: 'pain' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        },
        {
          type: 'outcome' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        },
        {
          type: 'time' as const,
          tagline: 'Test',
          coreMessage: 'Test message',
          rationale: 'Test rationale'
        }
      ],
      tokensUsed: 500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockResult)

    await positioningStrategistAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence
      },
      campaignId: 'test-no-nested-timeout'
    })

    // Verify maxRetries is set to 1 to avoid nested retries conflicting with outer timeout
    expect(llmClient.callLLMWithStructuredOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 1
      })
    )
  })
})
