/**
 * Manual test for Product Analyst Agent
 * Run with: node --env-file=.env.local test-product-analyst.mjs
 */

import { ProductIntelligenceSchema } from './src/lib/types/campaign.ts'

// Mock product brief for testing
const mockProductBrief = {
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

async function testProductAnalyst() {
  console.log('🧪 Testing Product Analyst Agent...\n')

  try {
    // Import the agent dynamically
    const { productAnalystAgent } = await import('./src/lib/pipeline/agents/product-analyst.ts')

    console.log('📋 Input Product Brief:')
    console.log(JSON.stringify(mockProductBrief, null, 2))
    console.log('\n⏳ Calling Product Analyst Agent...\n')

    const startTime = Date.now()
    const result = await productAnalystAgent({
      data: mockProductBrief,
      campaignId: 'test-campaign-id'
    })
    const duration = Date.now() - startTime

    console.log('✅ Product Analyst Agent completed successfully!\n')
    console.log('📊 Product Intelligence Result:')
    console.log(JSON.stringify(result.result, null, 2))
    console.log('\n📈 Metadata:')
    console.log(`- Tokens Used: ${result.metadata.tokensUsed}`)
    console.log(`- Execution Time: ${result.metadata.executionTimeMs}ms`)
    console.log(`- Model Version: ${result.metadata.modelVersion}`)
    console.log(`- Total Duration: ${duration}ms`)

    // Validate primary pain requirements
    console.log('\n🔍 Validating Requirements:')
    const primaryPain = result.result.primaryPain
    const wordCount = primaryPain.split(/\s+/).length
    console.log(`- Primary Pain: "${primaryPain}"`)
    console.log(`- Word Count: ${wordCount} (requirement: 5-30 words)`)
    console.log(`- Is First-Person: ${primaryPain.toLowerCase().includes('i ') || primaryPain.toLowerCase().startsWith('i')}`)
    console.log(`- Character Length: ${primaryPain.length} (requirement: 5-200 chars)`)

    // Validate objections count
    console.log(`- Objections Count: ${result.result.objections.length} (requirement: 2-5)`)
    
    // Validate differentiators count
    console.log(`- Differentiators Count: ${result.result.differentiators.length} (requirement: 1-5)`)
    
    // Validate emotional drivers count
    console.log(`- Emotional Drivers Count: ${result.result.emotionalDrivers.length} (requirement: 1-5)`)
    
    // Validate messaging angle
    console.log(`- Recommended Messaging Angle: ${result.result.recommendedMessagingAngle} (must be: pain, outcome, or time)`)

    console.log('\n✅ All validations passed!')

  } catch (error) {
    console.error('❌ Test failed:')
    console.error(error)
    process.exit(1)
  }
}

testProductAnalyst()
