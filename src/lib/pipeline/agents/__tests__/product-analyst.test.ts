/**
 * Tests for Product Analyst AI Agent
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { productAnalystAgent } from '../product-analyst'
import { ProductBriefData, ProductIntelligence } from '@/lib/types/campaign'
import * as llmClient from '@/lib/ai/llm-client'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('Product Analyst Agent', () => {
  const mockProductBrief: ProductBriefData = {
    productName: 'AI Bookkeeping Assistant',
    description: 'An AI-powered bookkeeping tool that automatically categorizes expenses and generates tax estimates for freelancers.',
    category: 'Financial Software',
    productType: 'SaaS',
    targetCustomer: 'Freelancers earning $30k–$150k/year',
    customerProblem: 'Freelancers struggle to keep track of their finances and prepare for taxes, leading to stress and potential tax issues.',
    customerSophistication: 'Beginner to Intermediate',
    mainBenefit: 'Know your real numbers without becoming an accountant',
    keyDifferentiator: 'Automated transaction categorization plus proactive tax estimates',
    price: '$29/month',
    marketingGoal: 'Acquire 1000 paid users in 90 days',
    launchType: 'New Product Launch',
    desiredCTA: 'Start Free Trial',
    primaryChannel: 'LinkedIn',
    campaignDuration: '7 days',
    competitors: 'QuickBooks, FreshBooks, Wave',
    brandVoice: 'Friendly, approachable, empowering'
  }

  const mockProductIntelligence: ProductIntelligence = {
    idealCustomerProfile: 'Freelancers earning $30k–$150k/year who are overwhelmed by bookkeeping',
    coreProblem: 'Freelancers lack visibility into their true financial position and struggle with tax preparation',
    primaryPain: "I don't know where my money is really going",
    desiredOutcome: 'Have accurate financial records without spending hours on bookkeeping',
    corePromise: 'Automated bookkeeping that gives you financial clarity without the accounting headache',
    differentiators: [
      'Automated transaction categorization',
      'Proactive tax estimates',
      'Built specifically for freelancers'
    ],
    emotionalDrivers: [
      'Fear of tax penalties',
      'Desire for financial control',
      'Aspiration to focus on their craft'
    ],
    objections: [
      'Can I trust the numbers?',
      'Is my financial data secure?',
      'Will this work with my bank?'
    ],
    recommendedMessagingAngle: 'pain'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call LLM with correct system and user prompts', async () => {
    const mockLLMResponse = {
      ...mockProductIntelligence,
      tokensUsed: 1500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockLLMResponse)

    await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-id'
    })

    expect(llmClient.callLLMWithStructuredOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: expect.any(Object),
        systemPrompt: expect.stringContaining('product intelligence analyst'),
        userPrompt: expect.stringContaining('AI Bookkeeping Assistant'),
        temperature: 0.7,
        maxRetries: 3
      })
    )
  })

  it('should return structured ProductIntelligence with metadata', async () => {
    const mockLLMResponse = {
      ...mockProductIntelligence,
      tokensUsed: 1500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockLLMResponse)

    const result = await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-id'
    })

    expect(result.result).toMatchObject(mockProductIntelligence)
    expect(result.metadata).toMatchObject({
      tokensUsed: 1500,
      executionTimeMs: expect.any(Number),
      modelVersion: expect.any(String)
    })
  })

  it('should include all product brief fields in user prompt', async () => {
    const mockLLMResponse = {
      ...mockProductIntelligence,
      tokensUsed: 1500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockLLMResponse)

    await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-id'
    })

    const callArgs = vi.mocked(llmClient.callLLMWithStructuredOutput).mock.calls[0][0]
    const userPrompt = callArgs.userPrompt

    // Check that key fields are included in the prompt
    expect(userPrompt).toContain(mockProductBrief.productName)
    expect(userPrompt).toContain(mockProductBrief.description)
    expect(userPrompt).toContain(mockProductBrief.targetCustomer)
    expect(userPrompt).toContain(mockProductBrief.keyDifferentiator)
    expect(userPrompt).toContain(mockProductBrief.competitors!)
  })

  it('should wrap LLM call with 30-second timeout', async () => {
    const mockLLMResponse = {
      ...mockProductIntelligence,
      tokensUsed: 1500
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockLLMResponse)

    await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-id'
    })

    expect(llmClient.withTimeout).toHaveBeenCalledWith(
      expect.any(Promise),
      30000,
      'Product Analyst agent exceeded 30 second timeout'
    )
  })

  it('should handle optional fields gracefully', async () => {
    const briefWithoutOptionals: ProductBriefData = {
      productName: 'Test Product',
      description: 'A test product for unit testing',
      category: 'Software',
      productType: 'SaaS',
      targetCustomer: 'Test users',
      customerProblem: 'They have a test problem',
      customerSophistication: 'Intermediate',
      mainBenefit: 'Test benefit',
      keyDifferentiator: 'Test differentiator',
      price: '$10/month',
      marketingGoal: 'Test goal',
      launchType: 'Test launch',
      desiredCTA: 'Test CTA',
      primaryChannel: 'Email',
      campaignDuration: '7 days'
    }

    const mockLLMResponse = {
      ...mockProductIntelligence,
      tokensUsed: 1200
    }

    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(mockLLMResponse)

    const result = await productAnalystAgent({
      data: briefWithoutOptionals,
      campaignId: 'test-campaign-id'
    })

    expect(result.result).toMatchObject(mockProductIntelligence)
  })

  it('should propagate errors from LLM client', async () => {
    const error = new Error('LLM API error')
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockRejectedValue(error)

    await expect(
      productAnalystAgent({
        data: mockProductBrief,
        campaignId: 'test-campaign-id'
      })
    ).rejects.toThrow('LLM API error')
  })
})
