/**
 * Bug Condition Exploration Test for Bug #2: Product Analyst Timeout
 * 
 * **Property 1.2: Bug Condition** - Product Analyst Times Out at 30 Seconds
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * 
 * This test encodes the expected behavior: Product Analyst should complete successfully
 * for LLM response times between 30-120 seconds. On unfixed code with 30s timeout,
 * this test will FAIL, demonstrating the bug exists.
 * 
 * **GOAL**: Surface counterexamples that demonstrate 30-second timeout is insufficient
 * 
 * Requirements: 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { productAnalystAgent } from '../product-analyst'
import { ProductBriefData, ProductIntelligence } from '@/lib/types/campaign'
import * as llmClient from '@/lib/ai/llm-client'

// Mock the LLM client - we'll control withTimeout behavior ourselves
vi.mock('@/lib/ai/llm-client', async () => {
  const actual = await vi.importActual<typeof llmClient>('@/lib/ai/llm-client')
  return {
    callLLMWithStructuredOutput: vi.fn(),
    // Use the REAL withTimeout implementation to test actual timeout behavior
    withTimeout: actual.withTimeout
  }
})

describe('Bug #2: Product Analyst Times Out at 30 Seconds', () => {
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

  afterEach(() => {
    vi.clearAllTimers()
  })

  /**
   * Helper to create a delayed LLM response that simulates realistic response times
   */
  function createDelayedLLMResponse(delayMs: number) {
    return new Promise<ProductIntelligence & { tokensUsed: number }>((resolve) => {
      setTimeout(() => {
        resolve({
          ...mockProductIntelligence,
          tokensUsed: 1500
        })
      }, delayMs)
    })
  }

  /**
   * Bug Condition Test 1: LLM takes 35 seconds
   * 
   * On UNFIXED code: This should throw timeout error at 30 seconds
   * On FIXED code: This should complete successfully (timeout increased to 120s)
   * 
   * **EXPECTED OUTCOME on unfixed code**: Test FAILS - timeout error thrown
   */
  it('should complete successfully when LLM takes 35 seconds (currently times out at 30s)', async () => {
    // Mock LLM to take 35 seconds - slightly over current 30s timeout
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockImplementation(() => 
      createDelayedLLMResponse(35000)
    )

    // On unfixed code, this will throw: "Product Analyst agent exceeded 30 second timeout"
    // On fixed code (120s timeout), this will complete successfully
    const result = await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-35s'
    })

    // If we reach here, the agent completed successfully
    expect(result.result).toMatchObject(mockProductIntelligence)
    expect(result.metadata.tokensUsed).toBe(1500)
  }, 40000) // Test timeout: 40 seconds (allow time for 35s LLM call)

  /**
   * Bug Condition Test 2: LLM takes 45 seconds
   * 
   * On UNFIXED code: This should throw timeout error at 30 seconds
   * On FIXED code: This should complete successfully (timeout increased to 120s)
   * 
   * **EXPECTED OUTCOME on unfixed code**: Test FAILS - timeout error thrown
   */
  it('should complete successfully when LLM takes 45 seconds (currently times out at 30s)', async () => {
    // Mock LLM to take 45 seconds - typical for complex product briefs
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockImplementation(() => 
      createDelayedLLMResponse(45000)
    )

    // On unfixed code, this will throw: "Product Analyst agent exceeded 30 second timeout"
    // On fixed code (120s timeout), this will complete successfully
    const result = await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-45s'
    })

    expect(result.result).toMatchObject(mockProductIntelligence)
    expect(result.metadata.tokensUsed).toBe(1500)
  }, 50000) // Test timeout: 50 seconds

  /**
   * Bug Condition Test 3: LLM takes 60 seconds
   * 
   * On UNFIXED code: This should throw timeout error at 30 seconds
   * On FIXED code: This should complete successfully (timeout increased to 120s)
   * 
   * **EXPECTED OUTCOME on unfixed code**: Test FAILS - timeout error thrown
   */
  it('should complete successfully when LLM takes 60 seconds (currently times out at 30s)', async () => {
    // Mock LLM to take 60 seconds - realistic for comprehensive analysis
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockImplementation(() => 
      createDelayedLLMResponse(60000)
    )

    // On unfixed code, this will throw: "Product Analyst agent exceeded 30 second timeout"
    // On fixed code (120s timeout), this will complete successfully
    const result = await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-60s'
    })

    expect(result.result).toMatchObject(mockProductIntelligence)
    expect(result.metadata.tokensUsed).toBe(1500)
  }, 65000) // Test timeout: 65 seconds

  /**
   * Bug Condition Test 4: LLM takes 90 seconds
   * 
   * On UNFIXED code: This should throw timeout error at 30 seconds
   * On FIXED code: This should complete successfully (timeout increased to 120s)
   * 
   * **EXPECTED OUTCOME on unfixed code**: Test FAILS - timeout error thrown
   */
  it('should complete successfully when LLM takes 90 seconds (currently times out at 30s)', async () => {
    // Mock LLM to take 90 seconds - high end of realistic response times
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockImplementation(() => 
      createDelayedLLMResponse(90000)
    )

    // On unfixed code, this will throw: "Product Analyst agent exceeded 30 second timeout"
    // On fixed code (120s timeout), this will complete successfully
    const result = await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-90s'
    })

    expect(result.result).toMatchObject(mockProductIntelligence)
    expect(result.metadata.tokensUsed).toBe(1500)
  }, 95000) // Test timeout: 95 seconds

  /**
   * Verification Test: Confirm timeout error message
   * 
   * This test explicitly checks that the timeout error message is correct.
   * On unfixed code, this should pass (confirming the bug exists with the expected error message).
   * On fixed code, this test will need adjustment because 35s will no longer timeout.
   */
  it('should throw timeout error with correct message when LLM exceeds 30 seconds (bug confirmation)', async () => {
    // Mock LLM to take 35 seconds
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockImplementation(() => 
      createDelayedLLMResponse(35000)
    )

    // On unfixed code, this should throw the expected timeout error
    await expect(
      productAnalystAgent({
        data: mockProductBrief,
        campaignId: 'test-campaign-timeout-message'
      })
    ).rejects.toThrow('Product Analyst agent exceeded 30 second timeout')
  }, 40000) // Test timeout: 40 seconds
})
