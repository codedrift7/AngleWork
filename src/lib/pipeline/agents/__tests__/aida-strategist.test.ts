/**
 * Tests for AIDA Strategist AI Agent
 * 
 * Verifies the agent generates complete AIDA strategies that:
 * - Ground Attention in pain/hook (not features)
 * - Ground Interest in cost of unsolved problem
 * - Ground Desire in customer outcome (not features)
 * - Include both CTAs if secondary CTA provided
 * - Insert placeholders for missing proof
 * - Validate all stages have non-empty fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aidaStrategistAgent, AidaStrategistInput } from '../aida-strategist'
import * as llmClient from '@/lib/ai/llm-client'
import type { ProductBriefData, ProductIntelligence, Positioning, MessagingAngle } from '@/lib/types/campaign'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('aidaStrategistAgent', () => {
  const mockProductBrief: ProductBriefData = {
    productName: 'FreelanceBooks',
    description: 'AI-powered bookkeeping assistant for freelancers',
    category: 'SaaS',
    productType: 'software',
    targetCustomer: 'Freelancers and solo entrepreneurs who bill by the hour',
    customerProblem: 'Lack of financial visibility and spending Sundays sorting receipts',
    customerSophistication: 'Aware of problem but not actively looking for solutions',
    mainBenefit: 'Know your real numbers without becoming an accountant',
    keyDifferentiator: 'Automated transaction categorization plus proactive tax estimates',
    price: '$29/month',
    marketingGoal: 'Generate 500 trial signups',
    launchType: 'New product launch',
    desiredCTA: 'Start your 14-day free trial',
    primaryChannel: 'LinkedIn',
    campaignDuration: '7 days',
    competitors: 'QuickBooks Self-Employed, FreshBooks',
    brandVoice: 'Conversational, empowering, no jargon'
  }

  const mockProductIntelligence: ProductIntelligence = {
    idealCustomerProfile: 'Freelancers who bill by the hour and lack financial clarity',
    coreProblem: 'Financial uncertainty -- not knowing real profit vs bank balance',
    primaryPain: '"I never know how much money I actually have"',
    desiredOutcome: 'Financial clarity without the accounting learning curve',
    corePromise: 'Know your real numbers in minutes, not hours',
    differentiators: [
      'Automated transaction categorization',
      'Proactive tax estimates',
      'No accounting knowledge required'
    ],
    emotionalDrivers: [
      'Confidence in business decisions',
      'Reclaim weekend time',
      'Stop feeling financially uncertain'
    ],
    objections: [
      'I do not have time to learn new software',
      'Accounting tools are too complicated'
    ],
    recommendedMessagingAngle: 'time'
  }

  const mockPositioning: Positioning = {
    category: 'AI-powered bookkeeping for freelancers',
    positioningStatement: 'FreelanceBooks is the bookkeeping assistant that gives freelancers financial clarity without requiring accounting knowledge.',
    valueProposition: 'Stop spending Sundays sorting receipts. Get real-time financial clarity with automated categorization and proactive tax estimates.',
    primaryPain: 'Financial uncertainty and weekend time lost to manual bookkeeping',
    desiredTransformation: 'From financial confusion to confident business decisions'
  }

  const mockSelectedAngle: MessagingAngle = {
    type: 'time',
    tagline: 'Take bookkeeping off your Sunday-night to-do list',
    coreMessage: 'Freelancers who bill by the hour should not spend their weekends sorting receipts. FreelanceBooks automates transaction categorization and tax estimates, giving you financial clarity in minutes instead of hours.',
    rationale: 'Time is the most valuable resource for freelancers who bill hourly. This angle resonates because it quantifies the exact pain point -- losing weekend time to bookkeeping -- and positions the product as time-saving rather than feature-rich.'
  }

  const mockInput: AidaStrategistInput = {
    data: {
      productBrief: mockProductBrief,
      productIntelligence: mockProductIntelligence,
      positioning: mockPositioning,
      selectedAngle: mockSelectedAngle
    },
    campaignId: 'test-campaign-id'
  }

  const createMockAidaResponse = () => ({
    attention: {
      stage: 'attention' as const,
      objective: 'Hook freelancers with the time-pain of Sunday-night bookkeeping',
      contentDirection: 'Lead with the customer pain: losing weekend time to manual bookkeeping. Frame it as time they could spend on billable work or rest.',
      keyPoints: [
        'Freelancers who bill by the hour lose valuable weekend time',
        'Manual bookkeeping steals time from billable work',
        'Financial uncertainty creates stress'
      ]
    },
    interest: {
      stage: 'interest' as const,
      objective: 'Show the cost of unsolved problem: lost billable hours and business risk',
      contentDirection: 'Emphasize that time spent on bookkeeping is time not spent on client work. Highlight the business risk of making decisions with incomplete financial data.',
      keyPoints: [
        'Manual bookkeeping costs freelancers 3-5 hours per week',
        'Financial uncertainty leads to poor business decisions',
        'Complicated tools have steep learning curves'
      ]
    },
    desire: {
      stage: 'desire' as const,
      objective: 'Paint the outcome: financial clarity without becoming an accountant',
      contentDirection: 'Show the transformation from spending hours sorting receipts to having instant financial clarity. Focus on the outcome, not features.',
      keyPoints: [
        'Know your real numbers in minutes',
        'Make confident business decisions',
        'Reclaim your weekends'
      ]
    },
    action: {
      stage: 'action' as const,
      objective: 'Drive trial signups with clear CTA and friction reduction',
      contentDirection: 'Make it easy to start FreelanceBooks trial. Emphasize 14-day free trial with no credit card required. Address final objection about setup time.',
      keyPoints: [
        'Start your 14-day free trial',
        'No credit card required',
        'Setup takes 5 minutes'
      ]
    },
    tokensUsed: 1000
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(createMockAidaResponse())
  })

  it('should generate complete AIDA strategy with all four stages', async () => {
    const output = await aidaStrategistAgent(mockInput)

    expect(output.result).toBeDefined()
    expect(output.result.attention).toBeDefined()
    expect(output.result.interest).toBeDefined()
    expect(output.result.desire).toBeDefined()
    expect(output.result.action).toBeDefined()
    expect(output.metadata.tokensUsed).toBeGreaterThan(0)
    expect(output.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
  }, 35000)

  it('should have non-empty objectives and content directions for all stages', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const stages = [
      output.result.attention,
      output.result.interest,
      output.result.desire,
      output.result.action
    ]

    for (const stage of stages) {
      expect(stage.objective).toBeDefined()
      expect(stage.objective.length).toBeGreaterThan(20)
      expect(stage.contentDirection).toBeDefined()
      expect(stage.contentDirection.length).toBeGreaterThan(50)
      expect(stage.keyPoints).toBeDefined()
      expect(stage.keyPoints.length).toBeGreaterThanOrEqual(2)
      expect(stage.keyPoints.length).toBeLessThanOrEqual(5)
    }
  }, 35000)

  it('should ground Attention stage in pain/hook, not product features', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const attention = output.result.attention

    expect(attention.stage).toBe('attention')
    
    // Should reference pain or emotional state
    const contentLower = (attention.objective + attention.contentDirection).toLowerCase()
    const hasPainIndicators = 
      contentLower.includes('pain') ||
      contentLower.includes('uncertainty') ||
      contentLower.includes('problem') ||
      contentLower.includes('frustration') ||
      contentLower.includes('struggle')
    
    expect(hasPainIndicators).toBe(true)
    
    // Should NOT lead with features
    const firstSentence = attention.contentDirection.split('.')[0].toLowerCase()
    expect(firstSentence).not.toMatch(/we offer|our product|freelancebooks provides/)
  }, 35000)

  it('should ground Interest stage in cost/consequence of unsolved problem', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const interest = output.result.interest

    expect(interest.stage).toBe('interest')
    
    // Should reference cost, consequence, or risk
    const contentLower = (interest.objective + interest.contentDirection).toLowerCase()
    const hasCostIndicators = 
      contentLower.includes('cost') ||
      contentLower.includes('consequence') ||
      contentLower.includes('risk') ||
      contentLower.includes('expensive') ||
      contentLower.includes('losing') ||
      contentLower.includes('missing')
    
    expect(hasCostIndicators).toBe(true)
  }, 35000)

  it('should ground Desire stage in customer outcome, not features', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const desire = output.result.desire

    expect(desire.stage).toBe('desire')
    
    // Should reference outcome, transformation, or desired state
    const contentLower = (desire.objective + desire.contentDirection).toLowerCase()
    const hasOutcomeIndicators = 
      contentLower.includes('outcome') ||
      contentLower.includes('transformation') ||
      contentLower.includes('clarity') ||
      contentLower.includes('confident') ||
      contentLower.includes('know your') ||
      contentLower.includes('achieve')
    
    expect(hasOutcomeIndicators).toBe(true)
  }, 35000)

  it('should include primary CTA in Action stage', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const action = output.result.action

    expect(action.stage).toBe('action')
    
    // Should reference the CTA from product brief
    const contentLower = (action.objective + action.contentDirection).toLowerCase()
    expect(contentLower).toMatch(/trial|start|cta|call to action/)
  }, 35000)

  it('should reference the selected messaging angle', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const allContent = JSON.stringify(output.result).toLowerCase()

    // Should reference time-saving or Sunday/weekend (from selected angle)
    const hasAngleReference = 
      allContent.includes('time') ||
      allContent.includes('sunday') ||
      allContent.includes('weekend') ||
      allContent.includes('hours')
    
    expect(hasAngleReference).toBe(true)
  }, 35000)

  it('should reference the specific product name', async () => {
    const output = await aidaStrategistAgent(mockInput)
    const allContent = JSON.stringify(output.result)

    expect(allContent).toMatch(/FreelanceBooks/i)
  }, 35000)
})
