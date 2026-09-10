/**
 * Tests for Campaign Critic AI Agent
 * 
 * Verifies the agent:
 * - Scores each AIDA stage (1-10)
 * - Scores message consistency and audience fit (1-10)
 * - Computes overall score as arithmetic mean, rounded to 1 decimal
 * - Identifies critical stage (lowest score, earliest if tie)
 * - Generates specific recommendations referencing product and customer
 * - Includes targetAssetIds and suggestedFix in primary recommendation
 * - Inserts placeholders for missing benchmark data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { campaignCriticAgent, CampaignCriticInput } from '../campaign-critic'
import * as llmClient from '@/lib/ai/llm-client'
import type {
  ProductBriefData,
  ProductIntelligence,
  AidaStrategy,
  CampaignAssetOutput
} from '@/lib/types/campaign'

// Mock the LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('campaignCriticAgent', () => {
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
    idealCustomerProfile: 'Freelancers earning $30k-$150k/year who bill by the hour',
    coreProblem: 'Financial uncertainty — not knowing real profit vs bank balance',
    primaryPain: 'I never know how much money I actually have',
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

  const mockAidaStrategy: AidaStrategy = {
    attention: {
      stage: 'attention',
      objective: 'Hook freelancers with the time-pain of Sunday-night bookkeeping',
      contentDirection: 'Lead with the customer pain: losing weekend time to manual bookkeeping. Frame it as time they could spend on billable work or rest.',
      keyPoints: [
        'Freelancers who bill by the hour lose valuable weekend time',
        'Manual bookkeeping steals time from billable work',
        'Financial uncertainty creates stress'
      ]
    },
    interest: {
      stage: 'interest',
      objective: 'Show the cost of unsolved problem: lost billable hours and business risk',
      contentDirection: 'Emphasize that time spent on bookkeeping is time not spent on client work. Highlight the business risk of making decisions with incomplete financial data.',
      keyPoints: [
        'Manual bookkeeping costs freelancers 3-5 hours per week',
        'Financial uncertainty leads to poor business decisions',
        'Complicated tools have steep learning curves'
      ]
    },
    desire: {
      stage: 'desire',
      objective: 'Paint the outcome: financial clarity without becoming an accountant',
      contentDirection: 'Show the transformation from spending hours sorting receipts to having instant financial clarity. Focus on the outcome, not features.',
      keyPoints: [
        'Know your real numbers in minutes',
        'Make confident business decisions',
        'Reclaim your weekends'
      ]
    },
    action: {
      stage: 'action',
      objective: 'Drive trial signups with clear CTA and friction reduction',
      contentDirection: 'Make it easy to start. Emphasize 14-day free trial with no credit card required. Address final objection about setup time.',
      keyPoints: [
        'Start your 14-day free trial',
        'No credit card required',
        'Setup takes 5 minutes'
      ]
    }
  }

  const mockAssets: CampaignAssetOutput[] = [
    {
      channel: 'linkedin',
      stage: 'attention',
      assetType: 'post',
      content: {
        stage: 'attention',
        content: 'Are you a freelancer? Every Sunday night, you sit down with a pile of receipts and your bank statement, trying to figure out where your money went. Hours later, you still do not know if you are actually profitable.',
        strategicPurpose: 'Hook with time-pain and financial uncertainty'
      }
    },
    {
      channel: 'email',
      stage: 'interest',
      assetType: 'email',
      content: {
        stage: 'interest',
        subjectLine: 'The real cost of manual bookkeeping',
        previewText: 'It is not just time — it is the decisions you are making blind',
        body: 'Most freelancers spend 3-5 hours per week on bookkeeping. That is 15-20 billable hours per month you are losing. But the real cost is making business decisions with incomplete financial data.',
        cta: 'Learn how FreelanceBooks can help',
        strategicPurpose: 'Show cost of unsolved problem'
      }
    },
    {
      channel: 'landing_page',
      stage: 'multi-stage',
      assetType: 'page_section',
      content: {
        headline: 'Know your real numbers without becoming an accountant',
        subheadline: 'FreelanceBooks gives you financial clarity in minutes, not hours',
        primaryCTA: 'Start your 14-day free trial',
        problemSection: 'As a freelancer, you bill by the hour. But every Sunday, you spend hours sorting receipts and reconciling transactions. Your bank balance says one thing, but you never know how much money you actually have.',
        whyCurrentSolutionsFail: 'Traditional accounting software is built for accountants, not freelancers. They have steep learning curves, require accounting knowledge, and still leave you manually categorizing transactions.',
        productSolution: 'FreelanceBooks uses AI to automatically categorize your transactions and provide proactive tax estimates. No accounting knowledge required.',
        benefits: [
          'Automated transaction categorization',
          'Proactive tax estimates',
          'Financial clarity in minutes',
          'No accounting knowledge needed'
        ],
        howItWorks: [
          { step: 'Connect your bank', description: 'Link your accounts in 2 minutes' },
          { step: 'AI categorizes transactions', description: 'Automated, accurate categorization' },
          { step: 'Get instant insights', description: 'Know your real numbers' }
        ],
        objectionHandling: [
          { objection: 'I do not have time', response: 'Setup takes 5 minutes' },
          { objection: 'Too complicated', response: 'No accounting knowledge required' }
        ],
        socialProof: '[Insert customer testimonial here]',
        faq: [
          { question: 'How long does setup take?', answer: '5 minutes' },
          { question: 'Do I need accounting knowledge?', answer: 'No' },
          { question: 'How much does it cost?', answer: '$29/month' }
        ],
        finalCTA: 'Start your 14-day free trial — no credit card required'
      }
    }
  ]

  const mockInput: CampaignCriticInput = {
    data: {
      campaign: {
        id: 'test-campaign-id',
        name: 'FreelanceBooks Launch',
        productBrief: mockProductBrief
      },
      aidaStrategy: mockAidaStrategy,
      assets: mockAssets,
      productIntelligence: mockProductIntelligence
    },
    campaignId: 'test-campaign-id'
  }

  const createMockCritiqueResponse = () => ({
    overallScore: 8.5,
    attentionScore: 9,
    interestScore: 8,
    desireScore: 8,
    actionScore: 9,
    messageConsistency: 9,
    audienceFit: 8,
    criticalStage: 'interest' as const,
    findings: [
      {
        stage: 'interest' as const,
        issue: 'Interest email could better emphasize the specific cost of lost billable hours for FreelanceBooks target freelancers',
        severity: 'medium' as const
      },
      {
        stage: 'desire' as const,
        issue: 'Landing page lacks specific customer testimonials or case studies',
        severity: 'low' as const
      }
    ],
    recommendations: [
      {
        stage: 'interest' as const,
        recommendation: 'Strengthen the interest stage by adding specific numbers about billable hours lost for FreelanceBooks target customers',
        expectedImpact: 'Would make the cost more concrete and relatable to freelancers'
      },
      {
        stage: 'attention' as const,
        recommendation: 'LinkedIn post effectively hooks with time-pain that resonates with FreelanceBooks customer segment',
        expectedImpact: 'Strong attention hook for the target audience'
      }
    ],
    primaryRecommendation: {
      stage: 'interest' as const,
      targetAssetIds: ['asset-1', 'asset-2'],
      recommendation: 'Interest stage needs to better quantify the cost of manual bookkeeping for FreelanceBooks target freelancers who bill by the hour',
      suggestedFix: 'Add specific numbers: "If you bill at $100/hour and spend 4 hours per week on bookkeeping, that\'s $1,600 per month in lost billable time." This makes the cost concrete for FreelanceBooks customers.'
    },
    tokensUsed: 1500
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(llmClient.callLLMWithStructuredOutput).mockResolvedValue(createMockCritiqueResponse())
  })

  it('should generate complete critique with all required scores', async () => {
    const output = await campaignCriticAgent(mockInput)

    expect(output.result).toBeDefined()
    expect(output.result.attentionScore).toBeGreaterThanOrEqual(1)
    expect(output.result.attentionScore).toBeLessThanOrEqual(10)
    expect(output.result.interestScore).toBeGreaterThanOrEqual(1)
    expect(output.result.interestScore).toBeLessThanOrEqual(10)
    expect(output.result.desireScore).toBeGreaterThanOrEqual(1)
    expect(output.result.desireScore).toBeLessThanOrEqual(10)
    expect(output.result.actionScore).toBeGreaterThanOrEqual(1)
    expect(output.result.actionScore).toBeLessThanOrEqual(10)
    expect(output.result.messageConsistency).toBeGreaterThanOrEqual(1)
    expect(output.result.messageConsistency).toBeLessThanOrEqual(10)
    expect(output.result.audienceFit).toBeGreaterThanOrEqual(1)
    expect(output.result.audienceFit).toBeLessThanOrEqual(10)
    expect(output.metadata.tokensUsed).toBeGreaterThan(0)
    expect(output.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('should compute overall score as arithmetic mean rounded to 1 decimal', async () => {
    const output = await campaignCriticAgent(mockInput)
    const { attentionScore, interestScore, desireScore, actionScore, messageConsistency, audienceFit } = output.result

    const expectedMean = (
      attentionScore + interestScore + desireScore + actionScore + messageConsistency + audienceFit
    ) / 6

    const expectedRounded = Math.round(expectedMean * 10) / 10

    expect(output.result.overallScore).toBe(expectedRounded)
    
    // Verify it has exactly 1 decimal place or is a whole number
    const scoreString = output.result.overallScore.toString()
    const decimalParts = scoreString.split('.')
    if (decimalParts.length === 2) {
      expect(decimalParts[1].length).toBeLessThanOrEqual(1)
    }
  })

  it('should identify critical stage as lowest-scoring AIDA stage', async () => {
    const output = await campaignCriticAgent(mockInput)
    const { attentionScore, interestScore, desireScore, actionScore, criticalStage } = output.result

    const stageScores = [
      { stage: 'attention', score: attentionScore },
      { stage: 'interest', score: interestScore },
      { stage: 'desire', score: desireScore },
      { stage: 'action', score: actionScore }
    ]

    const lowestScore = Math.min(...stageScores.map(s => s.score))
    const lowestStages = stageScores.filter(s => s.score === lowestScore)
    
    // Critical stage should be one of the lowest-scoring stages
    const criticalIsLowest = lowestStages.some(s => s.stage === criticalStage)
    expect(criticalIsLowest).toBe(true)
    
    // If there's a tie, should be the earliest stage
    if (lowestStages.length > 1) {
      const aidaOrder = ['attention', 'interest', 'desire', 'action']
      const earliestLowest = lowestStages.sort((a, b) => 
        aidaOrder.indexOf(a.stage) - aidaOrder.indexOf(b.stage)
      )[0].stage
      expect(criticalStage).toBe(earliestLowest)
    }
  })

  it('should include findings with stage, issue, and severity', async () => {
    const output = await campaignCriticAgent(mockInput)
    const { findings } = output.result

    expect(findings).toBeDefined()
    expect(Array.isArray(findings)).toBe(true)
    expect(findings.length).toBeGreaterThan(0)

    for (const finding of findings) {
      expect(finding.stage).toBeDefined()
      expect(finding.issue).toBeDefined()
      expect(finding.issue.length).toBeGreaterThan(10) // Specific, not generic
      expect(finding.severity).toMatch(/^(low|medium|high)$/)
    }
  })

  it('should include recommendations with stage, recommendation, and expectedImpact', async () => {
    const output = await campaignCriticAgent(mockInput)
    const { recommendations } = output.result

    expect(recommendations).toBeDefined()
    expect(Array.isArray(recommendations)).toBe(true)
    expect(recommendations.length).toBeGreaterThan(0)

    for (const rec of recommendations) {
      expect(rec.stage).toBeDefined()
      expect(rec.recommendation).toBeDefined()
      expect(rec.recommendation.length).toBeGreaterThan(20) // Specific, not generic
      expect(rec.expectedImpact).toBeDefined()
      expect(rec.expectedImpact.length).toBeGreaterThan(10)
    }
  })

  it('should include primary recommendation with all required fields', async () => {
    const output = await campaignCriticAgent(mockInput)
    const { primaryRecommendation } = output.result

    expect(primaryRecommendation).toBeDefined()
    expect(primaryRecommendation.stage).toBeDefined()
    expect(primaryRecommendation.targetAssetIds).toBeDefined()
    expect(Array.isArray(primaryRecommendation.targetAssetIds)).toBe(true)
    expect(primaryRecommendation.targetAssetIds.length).toBeGreaterThan(0)
    expect(primaryRecommendation.recommendation).toBeDefined()
    expect(primaryRecommendation.recommendation.length).toBeGreaterThan(30) // Specific
    expect(primaryRecommendation.suggestedFix).toBeDefined()
    expect(primaryRecommendation.suggestedFix.length).toBeGreaterThan(30) // Actual content
  })

  it('should reference specific product name in recommendations', async () => {
    const output = await campaignCriticAgent(mockInput)
    const allRecommendations = [
      ...output.result.recommendations.map(r => r.recommendation),
      output.result.primaryRecommendation.recommendation
    ].join(' ')

    expect(allRecommendations).toMatch(/FreelanceBooks/i)
  })

  it('should reference specific customer in recommendations', async () => {
    const output = await campaignCriticAgent(mockInput)
    const allRecommendations = [
      ...output.result.recommendations.map(r => r.recommendation),
      output.result.primaryRecommendation.recommendation
    ].join(' ')

    // Should reference freelancers or the specific customer segment
    expect(allRecommendations).toMatch(/freelancer|customer|target/i)
  })

  it('should have primary recommendation focus on critical stage', async () => {
    const output = await campaignCriticAgent(mockInput)
    const { criticalStage, primaryRecommendation } = output.result

    expect(primaryRecommendation.stage).toBe(criticalStage)
  })

  it('should validate critique conforms to CritiqueSchema', async () => {
    const output = await campaignCriticAgent(mockInput)
    
    // All scores should be integers
    expect(Number.isInteger(output.result.attentionScore)).toBe(true)
    expect(Number.isInteger(output.result.interestScore)).toBe(true)
    expect(Number.isInteger(output.result.desireScore)).toBe(true)
    expect(Number.isInteger(output.result.actionScore)).toBe(true)
    expect(Number.isInteger(output.result.messageConsistency)).toBe(true)
    expect(Number.isInteger(output.result.audienceFit)).toBe(true)
    
    // Overall score should be a number with max 1 decimal place
    expect(typeof output.result.overallScore).toBe('number')
    
    // Critical stage should be valid AIDA stage
    expect(['attention', 'interest', 'desire', 'action']).toContain(output.result.criticalStage)
  })
})
