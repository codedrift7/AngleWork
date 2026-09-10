/**
 * Direct test script for email generation - bypasses timeout to diagnose issues
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { campaignBuilderEmailAgent } from './src/lib/pipeline/agents/campaign-builder'
import type { AidaStrategy, MessagingAngle, ProductBriefData } from './src/lib/types/campaign'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const mockProductBrief: ProductBriefData = {
  productName: 'BookkeepAI',
  description: 'AI-powered bookkeeping assistant for freelancers',
  category: 'Financial Software',
  productType: 'SaaS',
  targetCustomer: 'Freelancers earning $30k–$150k/year',
  customerProblem: 'Spend hours on bookkeeping, never confident numbers are right',
  customerSophistication: 'Aware of problem, tried spreadsheets',
  mainBenefit: 'Know your profit in minutes without becoming an accountant',
  keyDifferentiator: 'Automated categorization plus tax estimates',
  price: '$29/month',
  marketingGoal: 'Generate 500 trial signups',
  launchType: 'New product launch',
  desiredCTA: 'Start your free 14-day trial',
  primaryChannel: 'Email',
  campaignDuration: '30 days'
}

const mockAidaStrategy: AidaStrategy = {
  attention: {
    stage: 'attention',
    objective: 'Hook with financial uncertainty',
    contentDirection: 'Open with bank balance vs spendable money gap',
    keyPoints: [
      'Bank balance isn\'t same as knowing what you can spend',
      'Financial uncertainty keeps you up at night'
    ]
  },
  interest: {
    stage: 'interest',
    objective: 'Reveal hidden cost of uncertainty',
    contentDirection: 'Show how incomplete data leads to bad decisions',
    keyPoints: [
      'Making pricing decisions blind',
      'Tax season becomes 12-month reconstruction'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint picture of financial clarity',
    contentDirection: 'Show life with confident decisions and tax-ready books',
    keyPoints: [
      'Know profit margin in 2 minutes',
      'Confident pricing and spending decisions'
    ],
    proofRequirements: ['[TESTIMONIAL]']
  },
  action: {
    stage: 'action',
    objective: 'Make starting effortless',
    contentDirection: 'Emphasize 14-day trial and 5-minute setup',
    keyPoints: [
      'Connects in 60 seconds',
      'AI categorizes automatically',
      '14-day free trial, no card'
    ]
  }
}

const mockMessagingAngle: MessagingAngle = {
  type: 'pain',
  tagline: 'Stop guessing where your money went',
  coreMessage: 'Your bank balance isn\'t the same as knowing how much money you have',
  rationale: 'Addresses daily anxiety of financial uncertainty'
}

const mockProductIntelligence = {
  idealCustomerProfile: 'Freelancers earning $30k–$150k/year who struggle with bookkeeping confidence',
  coreProblem: 'Financial uncertainty prevents confident business decisions and creates stress',
  primaryPain: 'Spend hours on bookkeeping, never confident numbers are right',
  desiredOutcome: 'Know your profit in minutes without becoming an accountant',
  corePromise: 'Financial clarity without accounting expertise',
  differentiators: ['Automated categorization', 'Proactive tax estimates'],
  emotionalDrivers: ['Relief from financial anxiety', 'Confidence in decisions'],
  objections: ['Trust in accuracy', 'Time to set up'],
  recommendedMessagingAngle: 'pain' as const
}

async function main() {
  console.log('Testing Email Agent (no timeout wrapper)...\n')
  
  try {
    const startTime = Date.now()
    
    const output = await campaignBuilderEmailAgent({
      data: {
        productBrief: mockProductBrief,
        productIntelligence: mockProductIntelligence,
        aidaStrategy: mockAidaStrategy,
        selectedAngle: mockMessagingAngle
      },
      campaignId: 'test-email-direct'
    })
    
    const duration = Date.now() - startTime
    
    console.log(`✓ Success! Generated ${output.result.length} emails in ${duration}ms`)
    console.log(`Tokens: ${output.metadata.tokensUsed}`)
    console.log(`Model: ${output.metadata.modelVersion}\n`)
    
    output.result.forEach((email, i) => {
      const content = email.content as any
      console.log(`\nEmail ${i + 1}: ${email.stage}`)
      console.log(`Subject (${content.subjectLine.length} chars): "${content.subjectLine}"`)
      console.log(`Preview (${content.previewText.length} chars): "${content.previewText}"`)
      console.log(`Body: ${content.body.split(/\s+/).length} words`)
    })
    
  } catch (error) {
    console.error('✗ Error:', error)
    process.exit(1)
  }
}

main()
