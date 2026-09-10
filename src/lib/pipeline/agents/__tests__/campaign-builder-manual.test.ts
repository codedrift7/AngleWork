/**
 * Manual integration test for Campaign Builder AI Agent - LinkedIn Posts
 * 
 * This test validates the agent with real API calls (if OPENROUTER_API_KEY is set)
 * or with mock data for structure validation.
 * 
 * Run with: npx tsx src/lib/pipeline/agents/__tests__/campaign-builder-manual.test.ts
 */

import { campaignBuilderLinkedInAgent } from '../campaign-builder'
import type { CampaignBuilderLinkedInInput } from '../campaign-builder'
import type { ProductBriefData, AidaStrategy, MessagingAngle } from '@/lib/types/campaign'

// Test data
const mockProductBrief: ProductBriefData = {
  productName: 'FinanceBot',
  description: 'AI-powered bookkeeping assistant that automates financial tracking for freelancers',
  category: 'Financial Software',
  productType: 'SaaS',
  targetCustomer: 'Freelancers earning $30k-$150k/year who lack financial clarity',
  customerProblem: 'Spending hours on bookkeeping instead of billable client work',
  customerSophistication: 'Aware of problem, actively looking for solutions',
  mainBenefit: 'Know your real profit in minutes without becoming an accountant',
  keyDifferentiator: 'AI that understands freelance finances specifically, not generic accounting',
  price: '$29/month',
  marketingGoal: 'Acquire 100 beta users in first month',
  launchType: 'Soft launch to early adopters',
  desiredCTA: 'Start your 14-day free trial',
  primaryChannel: 'LinkedIn',
  campaignDuration: '7 days',
  competitors: 'QuickBooks Self-Employed, FreshBooks',
  brandVoice: 'Conversational, empowering, no accounting jargon'
}

const mockAidaStrategy: AidaStrategy = {
  attention: {
    stage: 'attention' as const,
    objective: 'Hook freelancers with the financial uncertainty they experience daily — the gap between bank balance and actual spendable money',
    contentDirection: 'Lead with the customer's current painful reality: looking at their bank balance but having no idea how much they can actually spend. Not a feature pitch — start with their lived experience of financial confusion.',
    keyPoints: [
      'Your bank balance is not the same as knowing how much you can spend',
      'Financial uncertainty keeps freelancers up at night',
      'The gap between "money in the bank" and "money you can actually use"'
    ]
  },
  interest: {
    stage: 'interest' as const,
    objective: 'Reveal the hidden cost of poor financial visibility — it is not just time, it is bad business decisions',
    contentDirection: 'The real cost is not the 3 hours every Sunday sorting receipts. It is the business decisions you are making with incomplete financial data. Which clients are profitable? Can you afford that tool? How much for taxes? You are flying blind.',
    keyPoints: [
      'Bad financial data leads to bad business decisions',
      'You are losing money without knowing it',
      'The Sunday night bookkeeping scramble is just a symptom'
    ]
  },
  desire: {
    stage: 'desire' as const,
    objective: 'Paint the picture of financial clarity and confidence — knowing your real numbers in minutes, not hours',
    contentDirection: 'Show life after solving the problem: knowing your real profit margin in 2 minutes. Not "bank balance minus a guess" — actual profit, after taxes, after expenses, after everything. No spreadsheets. No Sunday night panic. No accounting degree required. Just financial clarity that lets you make confident business decisions.',
    keyPoints: [
      'Know your real profit margin in 2 minutes',
      'Make confident business decisions with complete data',
      'Reclaim your weekends without sacrificing financial clarity'
    ],
    proofRequirements: ['[TESTIMONIAL]', '[STAT]']
  },
  action: {
    stage: 'action' as const,
    objective: 'Make it easy to start the 14-day free trial — reduce friction, address objections, clear next step',
    contentDirection: 'Introduce FinanceBot as the solution. Built specifically for freelance finances (not generic accounting software adapted). Highlight the no-friction trial: 14 days, no credit card required. Address the "I do not have time to learn new software" objection.',
    keyPoints: [
      'Built specifically for freelance finances from the ground up',
      '14-day trial, no credit card required',
      'Setup takes 5 minutes, not 5 hours'
    ]
  }
}

const mockSelectedAngle: MessagingAngle = {
  type: 'pain' as const,
  tagline: 'Stop guessing where your money went',
  coreMessage: 'Freelancers need financial clarity without becoming accountants. FinanceBot eliminates the guesswork by automating transaction categorization and providing real-time profit visibility.',
  rationale: 'Pain-focused angle directly addresses the primary frustration: financial uncertainty. "Stop guessing" resonates because it acknowledges the current painful state and implies a clear, certain alternative.'
}

const testInput: CampaignBuilderLinkedInInput = {
  campaignId: 'test-campaign-manual-123',
  data: {
    productBrief: mockProductBrief,
    aidaStrategy: mockAidaStrategy,
    selectedAngle: mockSelectedAngle
  }
}

async function runTest() {
  console.log('🧪 Campaign Builder LinkedIn Agent - Manual Test\n')
  console.log('='.repeat(60))
  
  try {
    console.log('📋 Test Input:')
    console.log(`  Product: ${testInput.data.productBrief.productName}`)
    console.log(`  Messaging Angle: ${testInput.data.selectedAngle.tagline}`)
    console.log(`  Campaign ID: ${testInput.campaignId}\n`)

    console.log('⏳ Calling campaignBuilderLinkedInAgent...\n')
    
    const startTime = Date.now()
    const result = await campaignBuilderLinkedInAgent(testInput)
    const duration = Date.now() - startTime

    console.log('✅ Agent call successful!')
    console.log(`⏱️  Execution time: ${duration}ms`)
    console.log(`🔢 Tokens used: ${result.metadata.tokensUsed}`)
    console.log(`🤖 Model: ${result.metadata.modelVersion}\n`)

    console.log('='.repeat(60))
    console.log('📊 Validation Results:\n')

    // Validate structure
    const tests = []

    // Test 1: Exactly 4 posts
    const test1 = result.result.length === 4
    tests.push({ name: 'Generated exactly 4 LinkedIn posts', pass: test1 })
    console.log(`${test1 ? '✅' : '❌'} Generated exactly 4 LinkedIn posts (got ${result.result.length})`)

    // Test 2: All posts are for LinkedIn
    const test2 = result.result.every(post => post.channel === 'linkedin')
    tests.push({ name: 'All posts have channel=linkedin', pass: test2 })
    console.log(`${test2 ? '✅' : '❌'} All posts have channel=linkedin`)

    // Test 3: Correct stages in order
    const expectedStages = ['attention', 'interest', 'desire', 'action']
    const test3 = result.result.every((post, i) => post.stage === expectedStages[i])
    tests.push({ name: 'Stages in correct order', pass: test3 })
    console.log(`${test3 ? '✅' : '❌'} Stages in correct order: ${result.result.map(p => p.stage).join(', ')}`)

    // Test 4: Character limits
    const characterChecks = result.result.map((post, i) => {
      const content = post.content as { content: string }
      const length = content.content.length
      const valid = length >= 50 && length <= 3000
      return { stage: post.stage, length, valid }
    })
    const test4 = characterChecks.every(c => c.valid)
    tests.push({ name: 'All posts within 50-3000 character limit', pass: test4 })
    console.log(`${test4 ? '✅' : '❌'} All posts within 50-3000 character limit:`)
    characterChecks.forEach(c => {
      console.log(`    ${c.valid ? '✅' : '❌'} ${c.stage}: ${c.length} chars`)
    })

    // Test 5: Strategic purpose present
    const test5 = result.result.every(post => {
      const content = post.content as { strategicPurpose: string }
      return content.strategicPurpose && content.strategicPurpose.length >= 20
    })
    tests.push({ name: 'All posts have strategic purpose (≥20 chars)', pass: test5 })
    console.log(`${test5 ? '✅' : '❌'} All posts have strategic purpose (≥20 chars)`)

    // Test 6: Product name referenced
    const allContent = result.result
      .map(post => JSON.stringify(post.content))
      .join(' ')
    const test6 = allContent.includes('FinanceBot')
    tests.push({ name: 'Product name "FinanceBot" referenced', pass: test6 })
    console.log(`${test6 ? '✅' : '❌'} Product name "FinanceBot" referenced in posts`)

    // Test 7: Messaging angle referenced
    const test7 = allContent.toLowerCase().includes('guessing') || 
                  allContent.toLowerCase().includes('stop guessing')
    tests.push({ name: 'Messaging angle reflected in content', pass: test7 })
    console.log(`${test7 ? '✅' : '❌'} Messaging angle ("stop guessing") reflected in content`)

    // Test 8: Placeholder for missing proof (Desire stage should have it)
    const desirePost = result.result[2].content as { content: string }
    const test8 = desirePost.content.includes('[Insert') || 
                  desirePost.content.includes('[TESTIMONIAL]') ||
                  desirePost.content.includes('testimonial')
    tests.push({ name: 'Placeholder inserted for missing proof (Desire stage)', pass: test8 })
    console.log(`${test8 ? '✅' : '❌'} Placeholder inserted for missing proof (Desire stage)`)

    console.log('\n' + '='.repeat(60))
    console.log('📝 Generated LinkedIn Posts:\n')

    result.result.forEach((post, i) => {
      const content = post.content as { content: string; strategicPurpose: string }
      console.log(`\n📌 POST ${i + 1} - ${post.stage.toUpperCase()}`)
      console.log(`   Title: ${post.title}`)
      console.log(`   Length: ${content.content.length} characters`)
      console.log(`   Strategic Purpose: ${content.strategicPurpose}`)
      console.log(`\n   Content Preview (first 200 chars):`)
      console.log(`   ${content.content.substring(0, 200)}${content.content.length > 200 ? '...' : ''}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary:\n')
    
    const passed = tests.filter(t => t.pass).length
    const total = tests.length
    const passRate = ((passed / total) * 100).toFixed(1)
    
    console.log(`   Tests Passed: ${passed}/${total} (${passRate}%)`)
    
    if (passed === total) {
      console.log('\n✅ All tests passed! Campaign Builder LinkedIn Agent is working correctly.')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some tests failed. Review the output above for details.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test
runTest()
