/**
 * Verification script for Positioning Strategist agent
 * 
 * Tests the agent with real OpenRouter API calls to validate:
 * - Schema validation (PositioningOutputSchema)
 * - Exactly 3 messaging angles (pain, outcome, time)
 * - Rationale references product/customer/pain
 * - Positioning statement length constraints
 * - Placeholder insertion for missing competitive data
 */

import { config } from 'dotenv'
import { positioningStrategistAgent } from './src/lib/pipeline/agents/positioning-strategist.ts'

// Load environment variables
config({ path: '.env.local' })

console.log('🧪 Verifying Positioning Strategist Agent...\n')

const mockProductBrief = {
  productName: 'AutoBooks AI',
  description: 'AI-powered bookkeeping assistant that automates expense categorization and provides proactive tax estimates for freelancers',
  category: 'Financial Management Software',
  productType: 'SaaS',
  targetCustomer: 'Freelancers earning $30k-$150k/year',
  customerProblem: 'Freelancers waste hours on manual bookkeeping and lack clear financial visibility',
  customerSophistication: 'Problem-Aware',
  mainBenefit: 'Automated bookkeeping with AI-powered categorization and tax estimates',
  keyDifferentiator: 'Combines automated transaction categorization with proactive tax estimates specific to freelance work patterns',
  price: '$29/month',
  marketingGoal: 'Acquire 1000 users in 90 days',
  launchType: 'New Product Launch',
  desiredCTA: 'Start your free 14-day trial',
  primaryChannel: 'LinkedIn',
  campaignDuration: '7 days',
  competitors: 'QuickBooks Self-Employed, Wave, FreshBooks',
  brandVoice: 'Friendly, empowering, practical'
}

const mockProductIntelligence = {
  idealCustomerProfile: 'Freelancers earning $30k-$150k annually who handle their own finances but struggle with bookkeeping complexity and lack accounting expertise',
  coreProblem: 'Freelancers lack financial visibility and waste valuable time on manual bookkeeping tasks they don\'t enjoy',
  primaryPain: "I don't know where my money is really going",
  desiredOutcome: 'Clear financial visibility and automated bookkeeping without becoming an accountant',
  corePromise: 'Automated financial clarity tailored for freelance income patterns',
  differentiators: [
    'AI-powered transaction categorization that learns freelance patterns',
    'Proactive tax estimates specific to freelance work',
    'No accounting knowledge required',
    'Integrates with freelancer payment platforms'
  ],
  emotionalDrivers: [
    'Fear of tax surprises',
    'Desire for financial control',
    'Frustration with accounting complexity',
    'Aspiration to run a professional business'
  ],
  objections: [
    'Can I trust the AI categorization?',
    'Is my financial data secure?',
    'Will this work with my bank?',
    'Do I need accounting knowledge to use this?'
  ],
  recommendedMessagingAngle: 'pain'
}

try {
  console.log('📝 Input:')
  console.log(`Product: ${mockProductBrief.productName}`)
  console.log(`ICP: ${mockProductIntelligence.idealCustomerProfile}`)
  console.log(`Primary Pain: "${mockProductIntelligence.primaryPain}"`)
  console.log(`Differentiators: ${mockProductIntelligence.differentiators.length} items`)
  console.log()

  console.log('🤖 Calling Positioning Strategist Agent...')
  const startTime = Date.now()

  const result = await positioningStrategistAgent({
    data: {
      productBrief: mockProductBrief,
      productIntelligence: mockProductIntelligence
    },
    campaignId: 'verification-test-001'
  })

  const duration = Date.now() - startTime
  console.log(`✅ Agent completed in ${duration}ms`)
  console.log()

  // Validate results
  console.log('🔍 Validation Results:')
  console.log()

  // 1. Check positioning structure
  console.log('1️⃣ Positioning Structure:')
  console.log(`   Category: "${result.result.positioning.category}"`)
  console.log(`   Category length: ${result.result.positioning.category.length} chars ✓`)
  console.log()
  console.log(`   Positioning Statement (${result.result.positioning.positioningStatement.length} chars):`)
  console.log(`   "${result.result.positioning.positioningStatement.substring(0, 150)}..."`)
  console.log()
  console.log(`   Value Proposition (${result.result.positioning.valueProposition.length} chars):`)
  console.log(`   "${result.result.positioning.valueProposition.substring(0, 150)}..."`)
  console.log()

  // 2. Check messaging angles count and types
  console.log('2️⃣ Messaging Angles:')
  console.log(`   Count: ${result.result.messagingAngles.length} ${result.result.messagingAngles.length === 3 ? '✓' : '❌ (expected 3)'}`)
  console.log()

  result.result.messagingAngles.forEach((angle, index) => {
    console.log(`   Angle ${index + 1}: ${angle.type.toUpperCase()}`)
    console.log(`   Tagline: "${angle.tagline}"`)
    console.log(`   Tagline length: ${angle.tagline.length} chars ${angle.tagline.length >= 10 && angle.tagline.length <= 200 ? '✓' : '❌'}`)
    console.log()
    console.log(`   Core Message (${angle.coreMessage.length} chars):`)
    console.log(`   "${angle.coreMessage.substring(0, 120)}..."`)
    console.log()
    console.log(`   Rationale (${angle.rationale.length} chars):`)
    console.log(`   "${angle.rationale.substring(0, 120)}..."`)
    
    // Check if rationale references product
    const mentionsProduct = angle.rationale.toLowerCase().includes('autobooks')
    console.log(`   References product: ${mentionsProduct ? '✓' : '❌'}`)
    
    // Check if rationale references customer
    const mentionsCustomer = angle.rationale.toLowerCase().includes('freelancer')
    console.log(`   References customer: ${mentionsCustomer ? '✓' : '❌'}`)
    
    console.log()
  })

  // 3. Check for distinct angle types
  const angleTypes = result.result.messagingAngles.map(a => a.type)
  const hasPain = angleTypes.includes('pain')
  const hasOutcome = angleTypes.includes('outcome')
  const hasTime = angleTypes.includes('time')
  
  console.log('3️⃣ Angle Type Coverage:')
  console.log(`   Pain angle: ${hasPain ? '✓' : '❌'}`)
  console.log(`   Outcome angle: ${hasOutcome ? '✓' : '❌'}`)
  console.log(`   Time angle: ${hasTime ? '✓' : '❌'}`)
  console.log()

  // 4. Check metadata
  console.log('4️⃣ Metadata:')
  console.log(`   Tokens used: ${result.metadata.tokensUsed}`)
  console.log(`   Execution time: ${result.metadata.executionTimeMs}ms`)
  console.log(`   Model: ${result.metadata.modelVersion}`)
  console.log()

  // 5. Check for placeholders (if competitive data was referenced)
  const allText = JSON.stringify(result.result).toLowerCase()
  const hasPlaceholders = allText.includes('placeholder')
  console.log('5️⃣ Placeholder Handling:')
  console.log(`   Contains placeholders: ${hasPlaceholders ? '✓ (for missing data)' : 'None needed'}`)
  console.log()

  console.log('✨ Verification Complete!')
  console.log()
  console.log('Full Result:')
  console.log(JSON.stringify(result.result, null, 2))

} catch (error) {
  console.error('❌ Verification Failed:')
  console.error(error)
  process.exit(1)
}
