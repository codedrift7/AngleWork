/**
 * Verification Script for Ads Agent
 * 
 * This script makes actual API calls to verify the ads agent works end-to-end
 * with real LLM responses. It requires OpenRouter API credentials.
 * 
 * Usage: node verify-ads-agent.mjs
 */

import { config } from 'dotenv'
config()

// Sample product brief
const productBrief = {
  productName: "FreelanceBooks",
  description: "Automated bookkeeping assistant for freelancers earning $30k-$150k/year",
  category: "SaaS",
  productType: "subscription",
  targetCustomer: "Solo freelancers and consultants earning $30k-$150k annually",
  customerProblem: "Spending hours every week on manual bookkeeping instead of client work",
  customerSophistication: "aware",
  mainBenefit: "Know your real profit without becoming an accountant",
  keyDifferentiator: "Built specifically for freelancers, not generic accounting software",
  price: "$29/month",
  marketingGoal: "acquisition",
  launchType: "new",
  desiredCTA: "Start your 14-day free trial",
  primaryChannel: "linkedin",
  campaignDuration: "ongoing"
}

// Sample AIDA strategy
const aidaStrategy = {
  attention: {
    stage: 'attention',
    objective: 'Hook the reader with the primary pain point of financial uncertainty',
    contentDirection: 'Lead with the gap between bank balance and actual available money. Use customer language.',
    keyPoints: [
      'Your bank balance isn\'t the same as knowing how much money you have',
      'Manual bookkeeping creates blind spots in your finances',
      'Sunday nights spent sorting receipts instead of resting'
    ]
  },
  interest: {
    stage: 'interest',
    objective: 'Build credibility and explain why current solutions fail for freelancers',
    contentDirection: 'Show the cost of the unsolved problem and why traditional tools don\'t work',
    keyPoints: [
      'Spreadsheets require constant maintenance and break down when you get busy',
      'Generic accounting software is built for accountants, not freelancers',
      'Guessing at your numbers leads to bad business decisions'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint the picture of the transformed state: clarity without expertise',
    contentDirection: 'Show the shift from uncertainty to knowing your real numbers',
    keyPoints: [
      'Know your real profit after every project closes',
      'See proactive tax estimates before the deadline sneaks up',
      'Make confident decisions based on actual numbers, not guesses'
    ]
  },
  action: {
    stage: 'action',
    objective: 'Drive the primary CTA: Start your 14-day free trial',
    contentDirection: 'Remove friction and reinforce the core promise. Emphasize no credit card required.',
    keyPoints: [
      'Start your 14-day free trial today',
      'No credit card required',
      'Know your real numbers without becoming an accountant'
    ]
  }
}

// Selected messaging angle
const selectedAngle = {
  type: 'pain-focused',
  tagline: 'Stop guessing. Start knowing.',
  coreMessage: 'Freelancers deserve to know their real profit without spending hours on bookkeeping or hiring expensive accountants.',
  rationale: 'This angle speaks directly to the core frustration of financial uncertainty that freelancers experience daily.'
}

console.log('🚀 Verifying Ads Agent with Real API Call\n')
console.log('Product:', productBrief.productName)
console.log('Selected Angle:', selectedAngle.tagline)
console.log('API Model:', process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free')
console.log('')

// Import the ads agent
async function testAdsAgent() {
  try {
    // Dynamically import the agent
    const { campaignBuilderAdsAgent } = await import('./src/lib/pipeline/agents/campaign-builder.ts')
    
    console.log('⏳ Calling ads agent (30 second timeout)...\n')
    
    const startTime = Date.now()
    
    const result = await campaignBuilderAdsAgent({
      data: {
        productBrief,
        aidaStrategy,
        selectedAngle
      },
      campaignId: 'test-campaign-123'
    })
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log(`✅ Agent completed in ${duration}s\n`)
    console.log('Metadata:')
    console.log(`  - Tokens used: ${result.metadata.tokensUsed}`)
    console.log(`  - Execution time: ${result.metadata.executionTimeMs}ms`)
    console.log(`  - Model: ${result.metadata.modelVersion}`)
    console.log('')
    
    // Validate the results
    const ads = result.result
    console.log(`Generated ${ads.length} ad concepts:\n`)
    
    ads.forEach((ad, index) => {
      const content = ad.content
      console.log(`${index + 1}. ${ad.title} (${content.angle} angle)`)
      console.log(`   Stage: ${ad.stage}`)
      console.log(`   Headline: "${content.headline}" (${content.headline.length} chars)`)
      console.log(`   Primary Text: "${content.primaryText.substring(0, 100)}..." (${content.primaryText.length} chars)`)
      console.log(`   CTA: "${content.cta}"`)
      console.log(`   Target: ${content.targetAudience}`)
      console.log(`   Rationale: ${content.rationale}`)
      console.log('')
    })
    
    // Validation checks
    console.log('🔍 Validation Checks:\n')
    
    const checks = [
      { name: 'Has exactly 3 ads', pass: ads.length === 3 },
      { name: 'Ad 1 is pain-based', pass: ads[0]?.content.angle === 'pain' },
      { name: 'Ad 2 is outcome-based', pass: ads[1]?.content.angle === 'outcome' },
      { name: 'Ad 3 is identity-based', pass: ads[2]?.content.angle === 'identity' },
      { name: 'Ad 1 stage is attention', pass: ads[0]?.stage === 'attention' },
      { name: 'Ad 2 stage is desire', pass: ads[1]?.stage === 'desire' },
      { name: 'Ad 3 stage is action', pass: ads[2]?.stage === 'action' },
      { name: 'All ads have channel=ads', pass: ads.every(a => a.channel === 'ads') },
      { name: 'All ads have assetType=ad', pass: ads.every(a => a.assetType === 'ad') },
      { name: 'All headlines 10-100 chars', pass: ads.every(a => a.content.headline.length >= 10 && a.content.headline.length <= 100) },
      { name: 'All primaryText 50-300 chars', pass: ads.every(a => a.content.primaryText.length >= 50 && a.content.primaryText.length <= 300) },
      { name: 'All CTAs 5-50 chars', pass: ads.every(a => a.content.cta.length >= 5 && a.content.cta.length <= 50) }
    ]
    
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌'
      console.log(`${icon} ${check.name}`)
    })
    
    const allPassed = checks.every(c => c.pass)
    
    console.log('')
    
    if (allPassed) {
      console.log('✨ All validation checks passed!')
      console.log('🎉 Ads agent is working correctly!')
      
      // Check for product-specific references
      const allContent = ads.map(a => JSON.stringify(a.content)).join(' ')
      const hasProductName = allContent.includes(productBrief.productName)
      
      if (hasProductName) {
        console.log(`✅ Product name "${productBrief.productName}" referenced in ads`)
      } else {
        console.log(`⚠️  Product name "${productBrief.productName}" not found in ads (may be acceptable)`)
      }
      
      // Check for messaging angle consistency
      const angleKeywords = selectedAngle.tagline.toLowerCase().split(' ')
      const hasAngleKeywords = angleKeywords.some(keyword => 
        allContent.toLowerCase().includes(keyword)
      )
      
      if (hasAngleKeywords) {
        console.log('✅ Messaging angle keywords found in ads')
      } else {
        console.log('⚠️  Messaging angle keywords not explicitly found (may still be consistent in theme)')
      }
      
      return true
    } else {
      console.log('❌ Some validation checks failed')
      console.log('Review the ads output above to identify issues')
      return false
    }
    
  } catch (error) {
    console.error('❌ Error testing ads agent:', error.message)
    
    if (error.message.includes('timeout')) {
      console.error('\n⏱️  Timeout occurred. This may be due to:')
      console.error('   - Free model rate limiting')
      console.error('   - API latency issues')
      console.error('   - Network connectivity')
      console.error('\nSuggestions:')
      console.error('   - Try again in a few minutes')
      console.error('   - Use a paid model for faster response')
      console.error('   - Check your internet connection')
    }
    
    return false
  }
}

// Run the test
testAdsAgent().then(success => {
  process.exit(success ? 0 : 1)
})
