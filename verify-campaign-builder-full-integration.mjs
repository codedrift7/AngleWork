/**
 * Full Integration Verification for Campaign Builder
 * 
 * This script tests the complete Campaign Builder agent with all four channels:
 * - LinkedIn (4 posts)
 * - Email (4 emails)
 * - Landing Page (1 page)
 * - Ads (3 ad concepts)
 * 
 * It verifies resilient execution, retry logic, and partial success handling.
 * 
 * Usage: node verify-campaign-builder-full-integration.mjs
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
    contentDirection: 'Lead with the gap between bank balance and actual available money',
    keyPoints: [
      'Your bank balance isn\'t the same as knowing how much money you have',
      'Manual bookkeeping creates blind spots in your finances'
    ]
  },
  interest: {
    stage: 'interest',
    objective: 'Build credibility and explain why current solutions fail',
    contentDirection: 'Show the cost of the unsolved problem',
    keyPoints: [
      'Spreadsheets require constant maintenance',
      'Generic accounting software is built for accountants'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint the picture of the transformed state',
    contentDirection: 'Show the shift from uncertainty to clarity',
    keyPoints: [
      'Know your real profit after every project closes',
      'Make confident decisions based on actual numbers'
    ]
  },
  action: {
    stage: 'action',
    objective: 'Drive the primary CTA',
    contentDirection: 'Remove friction and reinforce the core promise',
    keyPoints: [
      'Start your 14-day free trial today',
      'No credit card required'
    ]
  }
}

// Selected messaging angle
const selectedAngle = {
  type: 'pain-focused',
  tagline: 'Stop guessing. Start knowing.',
  coreMessage: 'Freelancers deserve to know their real profit without spending hours on bookkeeping',
  rationale: 'Speaks directly to the frustration of financial uncertainty'
}

console.log('🚀 Testing Full Campaign Builder Integration\n')
console.log('Product:', productBrief.productName)
console.log('Selected Angle:', selectedAngle.tagline)
console.log('API Model:', process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free')
console.log('\nThis will generate assets across all 4 channels:')
console.log('  - LinkedIn: 4 posts')
console.log('  - Email: 4 emails')
console.log('  - Landing Page: 1 page')
console.log('  - Ads: 3 ad concepts')
console.log('\nExpected total: 12 assets')
console.log('Expected time: 50-60 seconds (parallel execution)')
console.log('\n⏳ Starting campaign builder...\n')

async function testFullIntegration() {
  try {
    const { campaignBuilderAgent } = await import('./src/lib/pipeline/agents/campaign-builder.ts')
    
    const startTime = Date.now()
    
    const result = await campaignBuilderAgent({
      data: {
        productBrief,
        aidaStrategy,
        selectedAngle
      },
      campaignId: 'test-campaign-full'
    })
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log(`✅ Campaign builder completed in ${duration}s\n`)
    
    // Analyze results
    const assets = result.result
    const metadata = result.metadata
    
    console.log('📊 Results Summary:\n')
    console.log(`Total Assets Generated: ${assets.length}`)
    console.log(`Expected: 12 (LinkedIn=4, Email=4, LandingPage=1, Ads=3)`)
    console.log(`Execution Time: ${metadata.executionTimeMs}ms`)
    console.log('')
    
    // Break down by channel
    const channels = {
      linkedin: assets.filter(a => a.channel === 'linkedin'),
      email: assets.filter(a => a.channel === 'email'),
      'landing-page': assets.filter(a => a.channel === 'landing-page'),
      ads: assets.filter(a => a.channel === 'ads')
    }
    
    console.log('Assets by Channel:')
    console.log(`  LinkedIn: ${channels.linkedin.length} / 4 expected`)
    console.log(`  Email: ${channels.email.length} / 4 expected`)
    console.log(`  Landing Page: ${channels['landing-page'].length} / 1 expected`)
    console.log(`  Ads: ${channels.ads.length} / 3 expected`)
    console.log('')
    
    // Break down by stage
    const stages = {
      attention: assets.filter(a => a.stage === 'attention'),
      interest: assets.filter(a => a.stage === 'interest'),
      desire: assets.filter(a => a.stage === 'desire'),
      action: assets.filter(a => a.stage === 'action'),
      'multi-stage': assets.filter(a => a.stage === 'multi-stage')
    }
    
    console.log('Assets by Stage:')
    console.log(`  Attention: ${stages.attention.length}`)
    console.log(`  Interest: ${stages.interest.length}`)
    console.log(`  Desire: ${stages.desire.length}`)
    console.log(`  Action: ${stages.action.length}`)
    console.log(`  Multi-stage: ${stages['multi-stage'].length}`)
    console.log('')
    
    // Validation checks
    console.log('🔍 Validation Checks:\n')
    
    const checks = [
      { name: 'Total assets >= 8 (minimum viable)', pass: assets.length >= 8 },
      { name: 'Total assets <= 12 (maximum expected)', pass: assets.length <= 12 },
      { name: 'LinkedIn channel present', pass: channels.linkedin.length > 0 },
      { name: 'Email channel present', pass: channels.email.length > 0 },
      { name: 'Landing page channel present', pass: channels['landing-page'].length > 0 },
      { name: 'Ads channel present', pass: channels.ads.length > 0 },
      { name: 'All assets have valid channel', pass: assets.every(a => ['linkedin', 'email', 'landing-page', 'ads'].includes(a.channel)) },
      { name: 'All assets have valid stage', pass: assets.every(a => ['attention', 'interest', 'desire', 'action', 'multi-stage'].includes(a.stage)) },
      { name: 'All assets have content', pass: assets.every(a => a.content !== null && a.content !== undefined) },
      { name: 'Metadata has totalAssets', pass: metadata.totalAssets === assets.length },
      { name: 'Metadata has executionTimeMs', pass: typeof metadata.executionTimeMs === 'number' }
    ]
    
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌'
      console.log(`${icon} ${check.name}`)
    })
    
    const allPassed = checks.every(c => c.pass)
    
    console.log('')
    
    if (allPassed) {
      console.log('✨ All validation checks passed!')
      
      // Show sample assets from each channel
      console.log('\n📝 Sample Assets:\n')
      
      if (channels.linkedin.length > 0) {
        const post = channels.linkedin[0]
        console.log(`LinkedIn Post (${post.stage}):`)
        console.log(`  "${post.content.content.substring(0, 100)}..."`)
        console.log('')
      }
      
      if (channels.email.length > 0) {
        const email = channels.email[0]
        console.log(`Email (${email.stage}):`)
        console.log(`  Subject: "${email.content.subjectLine}"`)
        console.log(`  Preview: "${email.content.previewText}"`)
        console.log('')
      }
      
      if (channels['landing-page'].length > 0) {
        const page = channels['landing-page'][0]
        console.log('Landing Page:')
        console.log(`  Headline: "${page.content.heroSection.headline}"`)
        console.log('')
      }
      
      if (channels.ads.length > 0) {
        const ad = channels.ads[0]
        console.log(`Ad Concept (${ad.content.angle}):`)
        console.log(`  Headline: "${ad.content.headline}"`)
        console.log(`  CTA: "${ad.content.cta}"`)
        console.log('')
      }
      
      console.log('🎉 Campaign Builder full integration working correctly!')
      
      // Check for partial failures
      if (assets.length < 12) {
        console.log('\n⚠️  Note: Some channels may have failed (partial success)')
        console.log('This is expected behavior per Req 5.10 (resilient execution)')
        
        if (channels.email.length < 4) {
          console.log('   - Email channel may have timed out (known issue with free model)')
        }
        
        console.log('   - The pipeline continues with available assets')
        console.log('   - User can regenerate failed channels later')
      }
      
      return true
    } else {
      console.log('❌ Some validation checks failed')
      console.log('Review the output above to identify issues')
      return false
    }
    
  } catch (error) {
    console.error('❌ Error testing campaign builder:', error.message)
    
    if (error.message.includes('All channels failed')) {
      console.error('\n🚨 Complete failure - all channels failed')
      console.error('This should only happen if:')
      console.error('   - API credentials are invalid')
      console.error('   - Network is down')
      console.error('   - Model is unavailable')
      console.error('\nCheck your .env file and API configuration')
    }
    
    return false
  }
}

// Run the test
testFullIntegration().then(success => {
  process.exit(success ? 0 : 1)
})
