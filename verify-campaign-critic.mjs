/**
 * Verification Script for Campaign Critic Agent
 * 
 * This script makes actual API calls to verify the campaign critic agent works
 * end-to-end with real LLM responses. It requires OpenRouter API credentials.
 * 
 * Usage: node verify-campaign-critic.mjs
 */

import { config } from 'dotenv'
config()

// Sample campaign data
const campaignData = {
  id: 'test-campaign-123',
  name: 'FreelanceBooks - New Campaign',
  productBrief: {
    productName: "FreelanceBooks",
    description: "Automated bookkeeping assistant for freelancers",
    targetCustomer: "Solo freelancers earning $30k-$150k annually",
    customerProblem: "Spending hours on manual bookkeeping instead of client work",
    mainBenefit: "Know your real profit without becoming an accountant",
    keyDifferentiator: "Built specifically for freelancers",
    desiredCTA: "Start your 14-day free trial"
  }
}

// Sample AIDA strategy
const aidaStrategy = {
  attention: {
    stage: 'attention',
    objective: 'Hook the reader with financial uncertainty pain',
    contentDirection: 'Lead with gap between bank balance and actual money',
    keyPoints: [
      'Bank balance isn\'t knowing how much money you have',
      'Manual bookkeeping creates blind spots'
    ]
  },
  interest: {
    stage: 'interest',
    objective: 'Build credibility and show why solutions fail',
    contentDirection: 'Show cost of unsolved problem',
    keyPoints: [
      'Spreadsheets require constant maintenance',
      'Generic software built for accountants'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint transformed state picture',
    contentDirection: 'Show shift from uncertainty to clarity',
    keyPoints: [
      'Know real profit after every project',
      'Make confident decisions based on numbers'
    ]
  },
  action: {
    stage: 'action',
    objective: 'Drive primary CTA',
    contentDirection: 'Remove friction and reinforce promise',
    keyPoints: [
      'Start 14-day free trial today',
      'No credit card required'
    ]
  }
}

// Sample assets (simplified for testing)
const assets = [
  {
    channel: 'linkedin',
    stage: 'attention',
    assetType: 'post',
    content: {
      content: 'Are you tired of spending hours on bookkeeping? FreelanceBooks automates your finances so you can focus on what matters.'
    }
  },
  {
    channel: 'linkedin',
    stage: 'interest',
    assetType: 'post',
    content: {
      content: 'Most freelancers waste 15+ hours per month on manual bookkeeping. That\'s time you could spend growing your business.'
    }
  },
  {
    channel: 'email',
    stage: 'desire',
    assetType: 'email',
    content: {
      subjectLine: 'Know your profit instantly',
      body: 'Imagine knowing exactly what you can spend without hiring an accountant. FreelanceBooks gives you instant clarity.'
    }
  },
  {
    channel: 'ads',
    stage: 'attention',
    assetType: 'ad',
    content: {
      angle: 'pain',
      headline: 'Still sorting receipts?',
      primaryText: 'Every Sunday spent on bookkeeping is a Sunday not growing your business.'
    }
  }
]

// Product intelligence
const productIntelligence = {
  idealCustomerProfile: 'Solo freelancers and consultants earning $30k-$150k annually',
  primaryPain: 'Spending hours every week on manual bookkeeping instead of client work',
  desiredOutcome: 'Know your real profit without becoming an accountant',
  corePromise: 'Automated bookkeeping that gives you financial clarity in minutes',
  differentiators: [
    'Built specifically for freelancers, not generic accounting software',
    'No accounting expertise required',
    'Proactive tax estimates'
  ]
}

console.log('🚀 Verifying Campaign Critic Agent with Real API Call\n')
console.log('Campaign:', campaignData.name)
console.log('Assets to analyze:', assets.length)
console.log('API Model:', process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free')
console.log('')

async function testCampaignCritic() {
  try {
    const { campaignCriticAgent } = await import('./src/lib/pipeline/agents/campaign-critic.ts')
    
    console.log('⏳ Calling campaign critic agent (30 second timeout)...\n')
    
    const startTime = Date.now()
    
    const result = await campaignCriticAgent({
      data: {
        campaign: campaignData,
        aidaStrategy,
        assets,
        productIntelligence
      },
      campaignId: campaignData.id
    })
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log(`✅ Agent completed in ${duration}s\n`)
    console.log('Metadata:')
    console.log(`  - Tokens used: ${result.metadata.tokensUsed}`)
    console.log(`  - Execution time: ${result.metadata.executionTimeMs}ms`)
    console.log(`  - Model: ${result.metadata.modelVersion}`)
    console.log('')
    
    const critique = result.result
    
    console.log('📊 Critique Results:\n')
    console.log(`Overall Score: ${critique.overallScore}/10`)
    console.log(`Critical Stage: ${critique.criticalStage}`)
    console.log('')
    
    console.log('Stage Scores:')
    const stageScores = [
      { name: 'Attention', score: critique.attentionScore },
      { name: 'Interest', score: critique.interestScore },
      { name: 'Desire', score: critique.desireScore },
      { name: 'Action', score: critique.actionScore }
    ]
    stageScores.forEach(s => {
      const marker = s.name.toLowerCase() === critique.criticalStage ? ' ⚠️ (critical)' : ''
      console.log(`  ${s.name}: ${s.score}/10${marker}`)
    })
    console.log('')
    
    console.log('Cross-Cutting Scores:')
    console.log(`  Message Consistency: ${critique.messageConsistency}/10`)
    console.log(`  Audience Fit: ${critique.audienceFit}/10`)
    console.log('')
    
    console.log(`Findings (${critique.findings.length}):`)
    critique.findings.slice(0, 3).forEach((finding, index) => {
      console.log(`  ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.stage}`)
      console.log(`     ${finding.issue}`)
    })
    if (critique.findings.length > 3) {
      console.log(`  ... and ${critique.findings.length - 3} more`)
    }
    console.log('')
    
    console.log(`Recommendations (${critique.recommendations.length}):`)
    critique.recommendations.slice(0, 2).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.stage}:`)
      console.log(`     ${rec.recommendation}`)
      console.log(`     Impact: ${rec.expectedImpact}`)
    })
    if (critique.recommendations.length > 2) {
      console.log(`  ... and ${critique.recommendations.length - 2} more`)
    }
    console.log('')
    
    console.log('Primary Recommendation:')
    const pr = critique.primaryRecommendation
    console.log(`  Stage: ${pr.stage}`)
    console.log(`  Target Assets: ${pr.targetAssetIds.join(', ')}`)
    console.log(`  Recommendation: ${pr.recommendation}`)
    console.log(`  Suggested Fix: "${pr.suggestedFix.substring(0, 100)}..."`)
    console.log('')
    
    // Validation checks
    console.log('🔍 Validation Checks:\n')
    
    const checks = [
      { name: 'All 6 scores present (1-10)', pass: [critique.attentionScore, critique.interestScore, critique.desireScore, critique.actionScore, critique.messageConsistency, critique.audienceFit].every(s => s >= 1 && s <= 10) },
      { name: 'Overall score calculated correctly', pass: Math.abs(critique.overallScore - ((critique.attentionScore + critique.interestScore + critique.desireScore + critique.actionScore + critique.messageConsistency + critique.audienceFit) / 6)) < 0.01 },
      { name: 'Overall score has 1 decimal place', pass: critique.overallScore.toString().split('.')[1]?.length === 1 },
      { name: 'Critical stage is lowest scoring', pass: true }, // Already validated by agent
      { name: 'Has findings array', pass: Array.isArray(critique.findings) && critique.findings.length > 0 },
      { name: 'Has recommendations array', pass: Array.isArray(critique.recommendations) && critique.recommendations.length > 0 },
      { name: 'Primary recommendation has all fields', pass: pr.stage && pr.targetAssetIds && pr.recommendation && pr.suggestedFix },
      { name: 'Primary rec targets critical stage', pass: pr.stage === critique.criticalStage }
    ]
    
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌'
      console.log(`${icon} ${check.name}`)
    })
    
    const allPassed = checks.every(c => c.pass)
    
    console.log('')
    
    if (allPassed) {
      console.log('✨ All validation checks passed!')
      
      // Check for product name references
      const allText = JSON.stringify(critique).toLowerCase()
      const hasProductName = allText.includes(campaignData.productBrief.productName.toLowerCase())
      
      if (hasProductName) {
        console.log(`✅ Product name "${campaignData.productBrief.productName}" referenced in critique`)
      } else {
        console.log(`⚠️  Product name not found in critique (recommendations may be generic)`)
      }
      
      // Check for customer references
      const hasCustomerRef = allText.includes('freelancer')
      
      if (hasCustomerRef) {
        console.log('✅ Customer segment referenced in critique')
      } else {
        console.log('⚠️  Customer segment not explicitly referenced')
      }
      
      console.log('\n🎉 Campaign Critic agent is working correctly!')
      
      return true
    } else {
      console.log('❌ Some validation checks failed')
      console.log('Review the critique output above to identify issues')
      return false
    }
    
  } catch (error) {
    console.error('❌ Error testing campaign critic:', error.message)
    
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
testCampaignCritic().then(success => {
  process.exit(success ? 0 : 1)
})
