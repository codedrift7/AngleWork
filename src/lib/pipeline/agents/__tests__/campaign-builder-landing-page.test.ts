/**
 * Tests for Campaign Builder Landing Page Agent
 * 
 * Validates that the landing page generation:
 * - Produces all required sections per Req 5.4
 * - Uses the selected messaging angle per Req 5.6
 * - Inserts placeholders for missing proof per Req 5.7
 * - References product-specific differentiators per Req 5.8
 * - Validates output against LandingPageSchema
 */

import { describe, it, expect } from 'vitest'
import { campaignBuilderLandingPageAgent } from '../campaign-builder'
import {
  ProductBriefData,
  AidaStrategy,
  MessagingAngle,
  LandingPage
} from '@/lib/types/campaign'

// Mock LLM client
vi.mock('@/lib/ai/llm-client', () => ({
  callLLMWithStructuredOutput: vi.fn(),
  withTimeout: vi.fn((promise) => promise)
}))

describe('Campaign Builder Landing Page Agent', () => {
  // Sample test data
  const mockProductBrief: ProductBriefData = {
    productName: 'BookkeepAI',
    description: 'AI-powered bookkeeping assistant for freelancers',
    category: 'SaaS',
    productType: 'software',
    targetCustomer: 'Freelancers earning $30k-$150k/year',
    customerProblem: 'Spending hours on bookkeeping instead of client work',
    customerSophistication: 'aware',
    mainBenefit: 'Automate bookkeeping in minutes',
    keyDifferentiator: 'AI categorization with proactive tax estimates',
    price: '$29/month',
    marketingGoal: 'acquisition',
    launchType: 'new',
    desiredCTA: 'Start Your Free Trial',
    primaryChannel: 'email',
    campaignDuration: '30 days'
  }

  const mockSelectedAngle: MessagingAngle = {
    type: 'pain',
    tagline: 'Stop guessing where your money went',
    coreMessage: 'Financial uncertainty is killing your business decisions',
    rationale: 'Freelancers struggle with incomplete financial visibility'
  }

  const mockAidaStrategy: AidaStrategy = {
    attention: {
      stage: 'attention',
      objective: 'Hook with financial uncertainty',
      contentDirection: 'Lead with the gap between bank balance and spendable cash',
      keyPoints: [
        'Bank balance ≠ money you can spend',
        'Making decisions blind is dangerous'
      ]
    },
    interest: {
      stage: 'interest',
      objective: 'Show cost of poor financial visibility',
      contentDirection: 'Explain business decisions made with incomplete data',
      keyPoints: [
        'Missed tax deductions',
        'Poor pricing decisions',
        'Cash flow surprises'
      ]
    },
    desire: {
      stage: 'desire',
      objective: 'Paint picture of financial clarity',
      contentDirection: 'Show transformation to confident decision-making',
      keyPoints: [
        'Know real profit margin instantly',
        'Never miss a deduction',
        'Make pricing decisions with confidence'
      ],
      proofRequirements: ['[TESTIMONIAL]', '[STAT]']
    },
    action: {
      stage: 'action',
      objective: 'Make starting easy and risk-free',
      contentDirection: 'Introduce product with frictionless onboarding',
      keyPoints: [
        'Setup in 5 minutes',
        'Free trial, no credit card',
        'Cancel anytime'
      ]
    }
  }

  it('should generate landing page with all required sections', async () => {
    // Mock the LLM response
    const mockLandingPage = {
      channel: 'landing_page',
      stage: 'multi-stage',
      assetType: 'page_section',
      title: 'Landing Page',
      content: {
        headline: 'Stop Guessing Where Your Money Went',
        subheadline: 'Know your real numbers without becoming an accountant',
        primaryCTA: 'Start Your Free Trial',
        problemSection: 'You are a freelancer earning $75k/year. Your bank says $12,453, but you have no idea how much you can actually spend. Bills are due, taxes are looming, and you are making business decisions in the dark.',
        whyCurrentSolutionsFail: 'Spreadsheets take 3 hours every Sunday. Generic bookkeeping software is built for accountants, not business owners. You just want to know if you can afford that new laptop or need to chase late invoices first.',
        productSolution: 'BookkeepAI is AI-powered bookkeeping built for freelancers. It automatically categorizes every transaction and gives you proactive tax estimates so you always know your real profit margin.',
        benefits: [
          'Know your real profit margin in 2 minutes',
          'Never miss a tax deduction',
          'Make pricing decisions with confidence',
          'Reclaim 3 hours every Sunday'
        ],
        howItWorks: [
          { step: 'Connect your bank', description: 'Link your accounts securely in 60 seconds' },
          { step: 'AI categorizes everything', description: 'Every transaction is automatically sorted and tax-coded' },
          { step: 'See your real numbers', description: 'Dashboard shows profit, expenses, and tax estimates in real-time' }
        ],
        objectionHandling: [
          { objection: 'Can I trust the numbers?', response: 'Every transaction is verified against your bank records with 99.9% accuracy' },
          { objection: 'What if I need help?', response: 'Live chat support responds in under 2 minutes, 7 days a week' }
        ],
        socialProof: 'Join [Insert number] freelancers who use BookkeepAI. "[Insert customer testimonial here]" — [Insert customer name and title]',
        faq: [
          { question: 'How long does setup take?', answer: 'Most users are up and running in under 5 minutes.' },
          { question: 'Is my financial data secure?', answer: 'We use bank-level encryption and never store your login credentials.' },
          { question: 'Can I cancel anytime?', answer: 'Yes, cancel with one click. No questions asked.' }
        ],
        finalCTA: 'Start Your Free Trial',
        tokensUsed: 1500
      },
      tokensUsed: 1500
    }

    const { callLLMWithStructuredOutput } = await import('@/lib/ai/llm-client')
    ;(callLLMWithStructuredOutput as any).mockResolvedValue(mockLandingPage)

    const result = await campaignBuilderLandingPageAgent({
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockSelectedAngle
      },
      campaignId: 'test-campaign-123'
    })

    // Validate structure
    expect(result.result.channel).toBe('landing_page')
    expect(result.result.stage).toBe('multi-stage')
    expect(result.result.assetType).toBe('page_section')

    const content = result.result.content as LandingPage

    // Validate all required sections exist
    expect(content.headline).toBeDefined()
    expect(content.subheadline).toBeDefined()
    expect(content.primaryCTA).toBeDefined()
    expect(content.problemSection).toBeDefined()
    expect(content.whyCurrentSolutionsFail).toBeDefined()
    expect(content.productSolution).toBeDefined()
    expect(content.benefits).toBeDefined()
    expect(content.howItWorks).toBeDefined()
    expect(content.objectionHandling).toBeDefined()
    expect(content.socialProof).toBeDefined()
    expect(content.faq).toBeDefined()
    expect(content.finalCTA).toBeDefined()

    // Validate array lengths (Req 5.4)
    expect(content.benefits.length).toBeGreaterThanOrEqual(3)
    expect(content.benefits.length).toBeLessThanOrEqual(7)
    expect(content.howItWorks.length).toBeGreaterThanOrEqual(3)
    expect(content.howItWorks.length).toBeLessThanOrEqual(5)
    expect(content.objectionHandling.length).toBeGreaterThanOrEqual(2)
    expect(content.objectionHandling.length).toBeLessThanOrEqual(5)
    expect(content.faq.length).toBeGreaterThanOrEqual(3)
    expect(content.faq.length).toBeLessThanOrEqual(7)

    // Validate character lengths
    expect(content.headline.length).toBeGreaterThanOrEqual(10)
    expect(content.headline.length).toBeLessThanOrEqual(100)
    expect(content.subheadline.length).toBeGreaterThanOrEqual(20)
    expect(content.subheadline.length).toBeLessThanOrEqual(200)

    // Validate messaging angle is reflected in headline (Req 5.6)
    expect(content.headline.toLowerCase()).toContain('stop guessing')

    // Validate product-specific references (Req 5.8)
    expect(content.productSolution).toContain('BookkeepAI')
    expect(content.productSolution.toLowerCase()).toContain('categor') // "categorizes" or "categorization"

    // Validate placeholder insertion for missing proof (Req 5.7)
    expect(content.socialProof).toContain('[Insert')

    expect(result.metadata.tokensUsed).toBeGreaterThanOrEqual(0)
    expect(result.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('should validate headline reflects messaging angle', async () => {
    const mockLandingPage = {
      channel: 'landing_page',
      stage: 'multi-stage',
      assetType: 'page_section',
      title: 'Landing Page',
      content: {
        headline: 'Know Your Real Numbers Without Becoming an Accountant',
        subheadline: 'AI-powered bookkeeping designed for freelancers',
        primaryCTA: 'Start Your Free Trial',
        problemSection: 'You spend hours every Sunday trying to figure out where your money went. Bank statements do not tell you what you can actually spend, and tax season is a nightmare of missing receipts.',
        whyCurrentSolutionsFail: 'Spreadsheets are manual and time-consuming. Traditional bookkeeping software is overkill for freelancers. You need something that just works without requiring an accounting degree.',
        productSolution: 'BookkeepAI gives you instant financial clarity. Connect your bank, and our AI automatically categorizes transactions and estimates taxes. No manual data entry, no guesswork.',
        benefits: [
          'See real profit in real-time',
          'Automated tax estimates',
          'Zero manual data entry'
        ],
        howItWorks: [
          { step: 'Connect', description: 'Link your bank in 60 seconds' },
          { step: 'Categorize', description: 'AI sorts every transaction' },
          { step: 'Understand', description: 'View profit, expenses, taxes instantly' }
        ],
        objectionHandling: [
          { objection: 'Is it secure?', response: 'Bank-level encryption, never store credentials' },
          { objection: 'Is it accurate?', response: '99.9% transaction accuracy verified against your bank' }
        ],
        socialProof: '[Insert number] freelancers trust BookkeepAI. "[Insert testimonial here]" — [Insert name]',
        faq: [
          { question: 'How much does it cost?', answer: '$29/month with a 14-day free trial' },
          { question: 'Can I cancel?', answer: 'Yes, anytime with one click' },
          { question: 'Do I need accounting knowledge?', answer: 'No, it is designed for non-accountants' }
        ],
        finalCTA: 'Start Your Free Trial',
        tokensUsed: 1400
      },
      tokensUsed: 1400
    }

    const { callLLMWithStructuredOutput } = await import('@/lib/ai/llm-client')
    ;(callLLMWithStructuredOutput as any).mockResolvedValue(mockLandingPage)

    // Use outcome-focused angle
    const outcomeAngle: MessagingAngle = {
      type: 'outcome',
      tagline: 'Know your real numbers without becoming an accountant',
      coreMessage: 'Financial clarity without the complexity',
      rationale: 'Freelancers want results without learning accounting'
    }

    const result = await campaignBuilderLandingPageAgent({
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: outcomeAngle
      },
      campaignId: 'test-campaign-456'
    })

    const content = result.result.content as LandingPage

    // Validate headline reflects outcome angle (Req 5.6)
    expect(content.headline.toLowerCase()).toContain('know')
    expect(content.headline.toLowerCase()).toContain('real numbers')
  })

  it('should throw error if required section is missing or out of bounds', async () => {
    const invalidLandingPage = {
      channel: 'landing_page',
      stage: 'multi-stage',
      assetType: 'page_section',
      title: 'Landing Page',
      content: {
        headline: 'Too Short', // Only 9 characters, minimum is 10
        subheadline: 'Valid subheadline that meets the character requirements',
        primaryCTA: 'Start',
        problemSection: 'You have a problem and it needs solving urgently because time is money and you cannot afford to waste either one.',
        whyCurrentSolutionsFail: 'Current solutions fail because they are not good enough and you deserve better than what is currently available to you.',
        productSolution: 'Our product solves your problem by providing a solution that works better than anything else available on the market today.',
        benefits: ['Benefit 1', 'Benefit 2'], // Only 2, minimum is 3
        howItWorks: [
          { step: 'Step 1', description: 'Do this' },
          { step: 'Step 2', description: 'Then this' },
          { step: 'Step 3', description: 'Finally this' }
        ],
        objectionHandling: [
          { objection: 'Concern 1', response: 'Answer 1' },
          { objection: 'Concern 2', response: 'Answer 2' }
        ],
        socialProof: 'Customers love us and say great things about our product.',
        faq: [
          { question: 'Q1?', answer: 'A1' },
          { question: 'Q2?', answer: 'A2' },
          { question: 'Q3?', answer: 'A3' }
        ],
        finalCTA: 'Go',
        tokensUsed: 1000
      },
      tokensUsed: 1000
    }

    const { callLLMWithStructuredOutput } = await import('@/lib/ai/llm-client')
    ;(callLLMWithStructuredOutput as any).mockResolvedValue(invalidLandingPage)

    await expect(
      campaignBuilderLandingPageAgent({
        data: {
          productBrief: mockProductBrief,
          aidaStrategy: mockAidaStrategy,
          selectedAngle: mockSelectedAngle
        },
        campaignId: 'test-campaign-789'
      })
    ).rejects.toThrow('headline must be 10-100 characters')
  })
})
