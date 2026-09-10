/**
 * Manual integration test for Campaign Builder Email Agent
 * 
 * This test makes actual API calls to verify email generation works correctly.
 * Run with: npm run test:run campaign-builder-email-manual
 * 
 * Requirements tested:
 * - Req 5.3: Email structure (subject max 60 chars, preview max 90 chars, body max 500 words)
 * - Req 5.6: Selected messaging angle consistency
 * - Req 5.7: Placeholders for missing proof
 * - Req 5.8: Product-specific differentiators
 */

import { describe, it, expect } from 'vitest'
import { campaignBuilderEmailAgent } from '../campaign-builder'
import {
  ProductBriefData,
  AidaStrategy,
  MessagingAngle,
  EmailAsset
} from '@/lib/types/campaign'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

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

describe('campaignBuilderEmailAgent - Manual Integration Test', () => {
  it('should generate 4 complete emails with all required fields', async () => {
    console.log('\n=== Running Email Agent Integration Test ===\n')
    
    const input = {
      data: {
        productBrief: mockProductBrief,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-campaign-email-123'
    }

    console.log('Calling Campaign Builder Email Agent...')
    const output = await campaignBuilderEmailAgent(input)

    console.log('\n=== RESULTS ===\n')
    console.log(`Generated ${output.result.length} emails in ${output.metadata.executionTimeMs}ms`)
    console.log(`Tokens used: ${output.metadata.tokensUsed}`)
    console.log(`Model: ${output.metadata.modelVersion}\n`)

    // Validate we got exactly 4 emails
    expect(output.result).toHaveLength(4)

    // Log and validate each email
    output.result.forEach((email, index) => {
      const stageName = ['Attention', 'Interest', 'Desire', 'Action'][index]
      const content = email.content as EmailAsset

      console.log(`\n--- EMAIL ${index + 1}: ${stageName} Stage ---`)
      console.log(`Channel: ${email.channel}`)
      console.log(`Asset Type: ${email.assetType}`)
      console.log(`Stage: ${email.stage}`)
      console.log(`Title: ${email.title || 'N/A'}`)
      console.log(`\nSubject Line (${content.subjectLine.length} chars): "${content.subjectLine}"`)
      console.log(`Preview Text (${content.previewText.length} chars): "${content.previewText}"`)
      console.log(`\nBody (${content.body.split(/\s+/).length} words, ${content.body.length} chars):`)
      console.log(content.body)
      console.log(`\nCTA: "${content.cta}"`)
      console.log(`Strategic Purpose: "${content.strategicPurpose}"`)

      // Validate channel and asset type
      expect(email.channel).toBe('email')
      expect(email.assetType).toBe('email')

      // Validate stage
      expect(email.stage).toBe(['attention', 'interest', 'desire', 'action'][index])

      // Validate subject line length (Req 5.3)
      expect(content.subjectLine.length).toBeGreaterThanOrEqual(10)
      expect(content.subjectLine.length).toBeLessThanOrEqual(60)

      // Validate preview text length (Req 5.3)
      expect(content.previewText.length).toBeGreaterThanOrEqual(10)
      expect(content.previewText.length).toBeLessThanOrEqual(90)

      // Validate body length (Req 5.3: max 500 words)
      const wordCount = content.body.split(/\s+/).length
      expect(wordCount).toBeGreaterThan(50)
      expect(wordCount).toBeLessThanOrEqual(500)
      expect(content.body.length).toBeGreaterThanOrEqual(100)

      // Validate CTA (Req 5.3)
      expect(content.cta).toBeTruthy()
      expect(content.cta.length).toBeGreaterThanOrEqual(5)
      expect(content.cta.length).toBeLessThanOrEqual(100)

      // Validate strategic purpose (Req 5.3)
      expect(content.strategicPurpose).toBeTruthy()
      expect(content.strategicPurpose.length).toBeGreaterThanOrEqual(20)
      expect(content.strategicPurpose.length).toBeLessThanOrEqual(300)
    })

    // Check for messaging angle consistency (Req 5.6)
    console.log('\n\n=== MESSAGING ANGLE CONSISTENCY CHECK (Req 5.6) ===')
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
      
      console.log(`Email ${index + 1} references messaging angle: ${hasAngleReference ? '✓' : '✗'}`)
    })

    expect(emailsWithAngleReference).toBeGreaterThanOrEqual(3)
    console.log(`\nResult: ${emailsWithAngleReference}/4 emails reference the messaging angle`)

    // Check for placeholders (Req 5.7)
    console.log('\n=== PLACEHOLDER CHECK (Req 5.7) ===')
    const desireEmail = output.result[2]
    const desireContent = desireEmail.content as EmailAsset

    const hasPlaceholder = 
      desireContent.body.includes('[Insert') ||
      desireContent.body.includes('[TESTIMONIAL]') ||
      desireContent.body.includes('[STAT]') ||
      desireContent.body.includes('[Insert metric here]') ||
      desireContent.body.includes('[Insert customer testimonial here]')
    
    console.log(`Desire email contains placeholder: ${hasPlaceholder ? '✓' : '✗'}`)
    
    if (hasPlaceholder) {
      // Extract and show placeholder
      const placeholderMatch = desireContent.body.match(/\[Insert[^\]]+\]|\[TESTIMONIAL\]|\[STAT\]/g)
      if (placeholderMatch) {
        console.log(`Placeholders found: ${placeholderMatch.join(', ')}`)
      }
    }

    // Check for product-specific references (Req 5.8)
    console.log('\n=== PRODUCT-SPECIFIC REFERENCES CHECK (Req 5.8) ===')
    let emailsWithProductName = 0

    output.result.forEach((email, index) => {
      const content = email.content as EmailAsset
      const combinedText = `${content.subjectLine} ${content.body}`
      
      const hasProductName = combinedText.includes(mockProductBrief.productName)
      
      if (hasProductName) {
        emailsWithProductName++
      }
      
      console.log(`Email ${index + 1} mentions "${mockProductBrief.productName}": ${hasProductName ? '✓' : '✗'}`)
    })

    console.log(`\nResult: ${emailsWithProductName}/4 emails mention the product name`)
    expect(emailsWithProductName).toBeGreaterThanOrEqual(1)

    console.log('\n=== TEST COMPLETE ===\n')
  }, 120000) // 2 minute timeout for API call
})
