/**
 * Manual Test for Campaign Builder Landing Page Agent
 * 
 * This test makes a real API call to OpenRouter to generate a landing page.
 * Run with: npm test -- campaign-builder-landing-page-manual.test.ts --run
 * 
 * IMPORTANT: This test is skipped by default to avoid unnecessary API calls.
 * Remove .skip to run it manually when needed.
 */

import { describe, it, expect } from 'vitest'
import { campaignBuilderLandingPageAgent } from '../campaign-builder'
import {
  ProductBriefData,
  AidaStrategy,
  MessagingAngle,
  LandingPage
} from '@/lib/types/campaign'

describe.skip('Campaign Builder Landing Page Agent - Manual Test', () => {
  it('should generate a real landing page via OpenRouter API', async () => {
    const productBrief: ProductBriefData = {
      productName: 'BookkeepAI',
      description: 'AI-powered bookkeeping assistant that automatically categorizes transactions and provides real-time financial insights for freelancers',
      category: 'Financial Software',
      productType: 'SaaS',
      targetCustomer: 'Freelancers and solopreneurs earning $30k-$150k annually',
      customerProblem: 'Spending hours every week on manual bookkeeping and struggling with financial visibility',
      customerSophistication: 'Solution-aware but overwhelmed by complexity of traditional bookkeeping software',
      mainBenefit: 'Get complete financial clarity in minutes without becoming an accountant',
      keyDifferentiator: 'AI-powered transaction categorization with proactive tax estimates specifically built for non-accountants',
      price: '$29/month',
      marketingGoal: 'Acquire 1,000 new users in 90 days',
      launchType: 'New product launch',
      desiredCTA: 'Start Your Free 14-Day Trial',
      primaryChannel: 'Landing page + email nurture',
      campaignDuration: '90 days',
      competitors: 'QuickBooks, FreshBooks, Wave',
      brandVoice: 'Friendly, empowering, jargon-free - speaks to business owners, not accountants'
    }

    const selectedAngle: MessagingAngle = {
      type: 'pain',
      tagline: 'Stop guessing where your money went',
      coreMessage: 'Your bank balance is not the same as knowing how much money you have. Financial uncertainty is killing your business decisions.',
      rationale: 'Pain-focused angle resonates with freelancers who feel lost in their finances despite having money in the bank'
    }

    const aidaStrategy: AidaStrategy = {
      attention: {
        stage: 'attention',
        objective: 'Hook with the gap between bank balance and spendable cash',
        contentDirection: 'Open with relatable scenario: You have $12,453 in the bank but no idea if you can afford that new laptop or if you should chase late invoices first',
        keyPoints: [
          'Your bank balance does not equal money you can spend',
          'Making business decisions blind is dangerous',
          'Financial uncertainty creates stress and poor decisions'
        ]
      },
      interest: {
        stage: 'interest',
        objective: 'Show the hidden costs of poor financial visibility',
        contentDirection: 'Explain business decisions made with incomplete data lead to missed deductions, poor pricing, cash flow surprises',
        keyPoints: [
          'Missed tax deductions cost freelancers thousands yearly',
          'Pricing decisions based on guesswork leave money on table',
          'Cash flow surprises force emergency borrowing',
          'Manual bookkeeping steals 3+ hours every Sunday'
        ]
      },
      desire: {
        stage: 'desire',
        objective: 'Paint picture of confident decision-making with complete financial clarity',
        contentDirection: 'Show transformation from guessing to knowing: instant profit visibility, never missing deductions, confident pricing',
        keyPoints: [
          'Know your real profit margin in 2 minutes',
          'Never miss a tax deduction again',
          'Make pricing decisions with confidence',
          'Reclaim your Sundays'
        ],
        proofRequirements: ['[TESTIMONIAL]', '[STAT]']
      },
      action: {
        stage: 'action',
        objective: 'Make starting easy and risk-free',
        contentDirection: 'Position BookkeepAI as the simplest path to clarity: 5-minute setup, free trial, cancel anytime',
        keyPoints: [
          'Setup complete in 5 minutes',
          '14-day free trial, no credit card required',
          'Cancel anytime with one click',
          'Built for freelancers, not accountants'
        ]
      }
    }

    console.log('\n🚀 Generating landing page via OpenRouter...\n')

    const result = await campaignBuilderLandingPageAgent({
      data: {
        productBrief,
        aidaStrategy,
        selectedAngle
      },
      campaignId: 'manual-test-' + Date.now()
    })

    console.log('\n✅ Landing page generated successfully!\n')
    console.log('📊 Metadata:')
    console.log('  - Tokens used:', result.metadata.tokensUsed)
    console.log('  - Execution time:', result.metadata.executionTimeMs, 'ms')
    console.log('  - Model:', result.metadata.modelVersion)
    console.log('\n')

    const content = result.result.content as LandingPage

    console.log('📄 LANDING PAGE CONTENT:\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('HEADLINE:', content.headline)
    console.log('SUBHEADLINE:', content.subheadline)
    console.log('PRIMARY CTA:', content.primaryCTA)
    console.log('\n━━━ PROBLEM SECTION ━━━')
    console.log(content.problemSection)
    console.log('\n━━━ WHY CURRENT SOLUTIONS FAIL ━━━')
    console.log(content.whyCurrentSolutionsFail)
    console.log('\n━━━ PRODUCT SOLUTION ━━━')
    console.log(content.productSolution)
    console.log('\n━━━ BENEFITS ━━━')
    content.benefits.forEach((b, i) => console.log(`  ${i + 1}. ${b}`))
    console.log('\n━━━ HOW IT WORKS ━━━')
    content.howItWorks.forEach((step, i) => {
      console.log(`  Step ${i + 1}: ${step.step}`)
      console.log(`    ${step.description}`)
    })
    console.log('\n━━━ OBJECTION HANDLING ━━━')
    content.objectionHandling.forEach((obj, i) => {
      console.log(`  ${i + 1}. ${obj.objection}`)
      console.log(`     → ${obj.response}`)
    })
    console.log('\n━━━ SOCIAL PROOF ━━━')
    console.log(content.socialProof)
    console.log('\n━━━ FAQ ━━━')
    content.faq.forEach((faq, i) => {
      console.log(`  ${i + 1}. ${faq.question}`)
      console.log(`     ${faq.answer}`)
    })
    console.log('\nFINAL CTA:', content.finalCTA)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Validate structure
    expect(result.result.channel).toBe('landing_page')
    expect(result.result.stage).toBe('multi-stage')
    expect(result.result.assetType).toBe('page_section')

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

    // Validate array lengths match requirements (Req 5.4)
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
    expect(content.primaryCTA.length).toBeGreaterThanOrEqual(5)
    expect(content.primaryCTA.length).toBeLessThanOrEqual(50)
    expect(content.problemSection.length).toBeGreaterThanOrEqual(100)
    expect(content.problemSection.length).toBeLessThanOrEqual(1000)
    expect(content.whyCurrentSolutionsFail.length).toBeGreaterThanOrEqual(100)
    expect(content.whyCurrentSolutionsFail.length).toBeLessThanOrEqual(1000)
    expect(content.productSolution.length).toBeGreaterThanOrEqual(100)
    expect(content.productSolution.length).toBeLessThanOrEqual(1000)
    expect(content.socialProof.length).toBeGreaterThanOrEqual(50)
    expect(content.socialProof.length).toBeLessThanOrEqual(500)
    expect(content.finalCTA.length).toBeGreaterThanOrEqual(5)
    expect(content.finalCTA.length).toBeLessThanOrEqual(50)

    // Validate messaging angle is reflected (Req 5.6)
    const headlineAndSubheadline = (content.headline + ' ' + content.subheadline).toLowerCase()
    const angleReflected = headlineAndSubheadline.includes('stop guessing') || 
                          headlineAndSubheadline.includes('where your money went') ||
                          headlineAndSubheadline.includes('know your') ||
                          headlineAndSubheadline.includes('clarity')
    expect(angleReflected).toBe(true)

    // Validate product name is used (Req 5.8)
    expect(content.productSolution).toContain('BookkeepAI')

    // Validate placeholders for missing proof (Req 5.7)
    expect(content.socialProof).toContain('[Insert')

    console.log('✅ All validation checks passed!')
  }, 120000) // 2 minute timeout for API call
})
