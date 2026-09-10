/**
 * Unit tests for Campaign Builder Email Agent
 * 
 * Tests email generation with AIDA strategy validation:
 * - Generates exactly 4 emails (one per AIDA stage)
 * - Enforces subject line max 60 characters (Req 5.3)
 * - Enforces preview text max 90 characters (Req 5.3)
 * - Enforces body max 500 words (Req 5.3)
 * - Includes CTA, stage label, strategic purpose (Req 5.3)
 * - Uses selected messaging angle consistently (Req 5.6)
 * - Inserts placeholders for missing proof (Req 5.7)
 * - References product-specific differentiators (Req 5.8)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { campaignBuilderEmailAgent } from '../campaign-builder'
import * as llmClient from '@/lib/ai/llm-client'
import {
  ProductBriefData,
  AidaStrategy,
  MessagingAngle,
  EmailAsset
} from '@/lib/types/campaign'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

// Mock product brief for AI bookkeeping assistant
const mockProductBrief: ProductBriefData = {
  productName: 'BookkeepAI',
  description: 'AI-powered bookkeeping assistant for freelancers that automates transaction categorization and generates tax-ready reports',
  category: 'Financial Software',
  productType: 'SaaS',
  targetCustomer: 'Freelancers earning $30k–$150k/year',
  customerProblem: 'Freelancers spend hours every week on bookkeeping and never feel confident their numbers are right',
  customerSophistication: 'Aware of problem, tried spreadsheets and basic tools',
  mainBenefit: 'Know your real profit margin in minutes without becoming an accountant',
  keyDifferentiator: 'Automated transaction categorization plus proactive tax estimates',
  price: '$29/month',
  marketingGoal: 'Generate 500 trial signups in first month',
  launchType: 'New product launch',
  desiredCTA: 'Start your free 14-day trial',
  primaryChannel: 'Email',
  campaignDuration: '30 days',
  brandVoice: 'Friendly, empathetic, practical'
}

// Mock AIDA strategy
const mockAidaStrategy: AidaStrategy = {
  attention: {
    stage: 'attention',
    objective: 'Hook freelancers with the financial uncertainty they experience daily',
    contentDirection: 'Open with the gap between bank balance and actual spendable money — the "where did it all go?" feeling every freelancer knows',
    keyPoints: [
      'Your bank balance says $12,453. But how much can you actually spend?',
      'Every freelancer has felt this: money in the account, but no idea if you can afford that new laptop',
      'The real problem isn\'t tracking expenses — it\'s knowing your true financial position'
    ]
  },
  interest: {
    stage: 'interest',
    objective: 'Reveal the hidden cost of financial uncertainty',
    contentDirection: 'Show how incomplete financial data leads to bad business decisions and constant anxiety',
    keyPoints: [
      'Without real-time profit visibility, you\'re making pricing decisions blind',
      'Tax season becomes a scramble to reconstruct 12 months of transactions',
      'You either overspend (and panic later) or underspend (and miss growth opportunities)'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint the picture of financial clarity and confidence',
    contentDirection: 'Show life after solving this: confident business decisions, tax-ready books, Sundays without bookkeeping',
    keyPoints: [
      'Know your real profit margin in 2 minutes, any time you need it',
      'Make pricing and spending decisions with confidence',
      'Tax season becomes a non-event: export and send to your accountant',
      'Reclaim your Sunday nights for literally anything else'
    ],
    proofRequirements: ['[TESTIMONIAL]', '[STAT]']
  },
  action: {
    stage: 'action',
    objective: 'Make starting effortless and risk-free',
    contentDirection: 'Position BookkeepAI as the solution, emphasize 14-day free trial and 5-minute setup',
    keyPoints: [
      'Connects to your bank in 60 seconds',
      'AI categorizes transactions automatically (you just approve)',
      '14-day free trial, no credit card required',
      'Cancel anytime, keep your data'
    ]
  }
}

// Mock messaging angle
const mockMessagingAngle: MessagingAngle = {
  type: 'pain',
  tagline: 'Stop guessing where your money went',
  coreMessage: 'Your bank balance isn\'t the same as knowing how much money you have. BookkeepAI closes that gap in minutes, not hours.',
  rationale: 'Freelancers are drowning in financial uncertainty — they know their bank balance but not their real financial position. This pain-focused angle addresses the daily anxiety of not knowing if they can afford purchases or make smart pricing decisions.'
}

// Helper function to create mock email responses
const createMockEmailResponse = () => {
  const mockResponse = [
    {
      channel: 'email',
      stage: 'attention',
      assetType: 'email',
      title: 'Attention Email',
      content: {
        stage: 'attention',
        subjectLine: 'Where did your money go?',
        previewText: 'Your bank balance doesn\'t tell the whole story',
        body: 'Your bank balance says one thing, but do you actually know where your money went this month? Most freelancers don\'t. And that uncertainty keeps them up at night, wondering if they can afford their next business investment or personal expense.',
        cta: 'Start your free 14-day trial',
        strategicPurpose: 'Hook freelancers with financial uncertainty they experience daily'
      },
      tokensUsed: 200
    },
    {
      channel: 'email',
      stage: 'interest',
      assetType: 'email',
      title: 'Interest Email',
      content: {
        stage: 'interest',
        subjectLine: 'The hidden cost of guessing your finances',
        previewText: 'Bad financial data leads to expensive business mistakes',
        body: 'When you\'re guessing about your finances, every business decision becomes a gamble. Should you raise your rates? Can you afford that new tool? How much should you set aside for taxes? Without real-time profit visibility, you\'re making these critical decisions blind. And those mistakes add up fast.',
        cta: 'See how BookkeepAI helps',
        strategicPurpose: 'Reveal the hidden cost of poor financial visibility'
      },
      tokensUsed: 180
    },
    {
      channel: 'email',
      stage: 'desire',
      assetType: 'email',
      title: 'Desire Email',
      content: {
        stage: 'desire',
        subjectLine: 'Know your real numbers in 2 minutes',
        previewText: 'Financial clarity without becoming an accountant',
        body: 'Imagine knowing your real profit margin in 2 minutes. Not "bank balance minus a guess." Actual profit. After taxes. After expenses. After everything. No spreadsheets. No Sunday night panic. No accounting degree required. Just financial clarity that lets you make confident business decisions. [Insert customer testimonial here] showing 3x faster bookkeeping. That\'s the difference between guessing and knowing where your money really is.',
        cta: 'Try BookkeepAI free for 14 days',
        strategicPurpose: 'Paint the picture of financial clarity and confidence'
      },
      tokensUsed: 220
    },
    {
      channel: 'email',
      stage: 'action',
      assetType: 'email',
      title: 'Action Email',
      content: {
        stage: 'action',
        subjectLine: 'Start knowing instead of guessing',
        previewText: 'BookkeepAI: Financial clarity built for freelancers',
        body: 'That\'s why we built BookkeepAI. Automated transaction categorization. Proactive tax estimates. Real-time profit visibility. All built specifically for freelance finances. Connect your bank in 60 seconds. AI categorizes transactions automatically. 14-day free trial, no credit card required. Stop guessing where your money went. Start knowing.',
        cta: 'Start your free 14-day trial',
        strategicPurpose: 'Make starting effortless and risk-free'
      },
      tokensUsed: 190
    }
  ] as Array<any> & { tokensUsed?: number }
  
  // Add tokensUsed property to the array itself
  mockResponse.tokensUsed = 790
  
  return mockResponse
}

describe('campaignBuilderEmailAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock implementation
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(createMockEmailResponse())
  })

  it('should generate exactly 4 emails (one per AIDA stage)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    expect(output.result).toHaveLength(4)
    expect(output.result[0].stage).toBe('attention')
    expect(output.result[1].stage).toBe('interest')
    expect(output.result[2].stage).toBe('desire')
    expect(output.result[3].stage).toBe('action')
  })

  it('should enforce subject line max 60 characters (Req 5.3)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      expect(content.subjectLine.length).toBeLessThanOrEqual(60)
      expect(content.subjectLine.length).toBeGreaterThanOrEqual(10)
      console.log(`Email ${index + 1} subject (${content.subjectLine.length} chars): "${content.subjectLine}"`)
    })
  })

  it('should enforce preview text max 90 characters (Req 5.3)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      expect(content.previewText.length).toBeLessThanOrEqual(90)
      expect(content.previewText.length).toBeGreaterThanOrEqual(10)
      console.log(`Email ${index + 1} preview (${content.previewText.length} chars): "${content.previewText}"`)
    })
  })

  it('should enforce body max 500 words (Req 5.3)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      const wordCount = content.body.split(/\s+/).length
      expect(wordCount).toBeLessThanOrEqual(500)
      expect(content.body.length).toBeGreaterThanOrEqual(100)
      console.log(`Email ${index + 1} body: ${wordCount} words, ${content.body.length} chars`)
    })
  })

  it('should include CTA, stage label, and strategic purpose for each email (Req 5.3)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      
      // CTA must be present and within length constraints
      expect(content.cta).toBeTruthy()
      expect(content.cta.length).toBeGreaterThanOrEqual(5)
      expect(content.cta.length).toBeLessThanOrEqual(100)
      
      // Stage label must match expected stage
      expect(content.stage).toBe(['attention', 'interest', 'desire', 'action'][index])
      
      // Strategic purpose must be present and within length constraints
      expect(content.strategicPurpose).toBeTruthy()
      expect(content.strategicPurpose.length).toBeGreaterThanOrEqual(20)
      expect(content.strategicPurpose.length).toBeLessThanOrEqual(300)
      
      console.log(`Email ${index + 1} CTA: "${content.cta}"`)
      console.log(`Email ${index + 1} strategic purpose: "${content.strategicPurpose}"`)
    })
  })

  it('should reference the selected messaging angle consistently (Req 5.6)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    // Check that at least 3 out of 4 emails reference the messaging angle's core theme
    const angleKeywords = ['guessing', 'know', 'knowing', 'money', 'balance', 'clarity', 'uncertain']
    let emailsWithAngleReference = 0

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      const combinedText = `${content.subjectLine} ${content.body}`.toLowerCase()
      
      const hasAngleReference = angleKeywords.some(keyword => 
        combinedText.includes(keyword)
      )
      
      if (hasAngleReference) {
        emailsWithAngleReference++
      }
      
      console.log(`Email ${index + 1} references messaging angle: ${hasAngleReference}`)
    })

    // At least 3 out of 4 emails should reference the angle
    expect(emailsWithAngleReference).toBeGreaterThanOrEqual(3)
  })

  it('should insert placeholders for missing proof (Req 5.7)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    // Find emails that should contain social proof (typically Desire and Action stages)
    const desireEmail = output.result[2] // Desire stage
    const desireContent = desireEmail.content as EmailAsset

    // Check if body contains placeholders when proof requirements exist
    if (mockAidaStrategy.desire.proofRequirements && mockAidaStrategy.desire.proofRequirements.length > 0) {
      const hasPlaceholder = 
        desireContent.body.includes('[Insert') ||
        desireContent.body.includes('[TESTIMONIAL]') ||
        desireContent.body.includes('[STAT]') ||
        desireContent.body.includes('[Insert metric here]') ||
        desireContent.body.includes('[Insert customer testimonial here]')
      
      console.log('Desire email body:', desireContent.body)
      console.log('Contains placeholder:', hasPlaceholder)
      
      // At least one email should contain a placeholder for missing proof
      expect(hasPlaceholder).toBe(true)
    }
  })

  it('should reference product-specific differentiators (Req 5.8)', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    // Check that emails reference the actual product name
    let emailsWithProductName = 0

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      const combinedText = `${content.subjectLine} ${content.body}`
      
      const hasProductName = combinedText.includes(mockProductBrief.productName)
      
      if (hasProductName) {
        emailsWithProductName++
      }
      
      console.log(`Email ${index + 1} mentions "${mockProductBrief.productName}": ${hasProductName}`)
    })

    // At least the Action email should mention the product name
    expect(emailsWithProductName).toBeGreaterThanOrEqual(1)
  })

  it('should set correct metadata fields', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    expect(output.metadata.tokensUsed).toBeGreaterThan(0)
    expect(output.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
    expect(output.metadata.modelVersion).toBeTruthy()
    
    console.log('Metadata:', output.metadata)
  })

  it('should validate all emails have correct channel and assetType', async () => {
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-123'
    }

    const output = await campaignBuilderEmailAgent(input)

    output.result.forEach((email, index) => {
      expect(email.channel).toBe('email')
      expect(email.assetType).toBe('email')
      console.log(`Email ${index + 1}: channel=${email.channel}, assetType=${email.assetType}`)
    })
  })
})
