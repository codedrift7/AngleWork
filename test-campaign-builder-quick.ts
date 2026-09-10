/**
 * Quick verification script for Campaign Builder LinkedIn agent
 * Tests with realistic but simple data
 */

// Load environment variables
import 'dotenv/config'

import { campaignBuilderLinkedInAgent } from './src/lib/pipeline/agents/campaign-builder'

const testInput = {
  campaignId: 'quick-test-123',
  data: {
    productBrief: {
      productName: 'TestProduct',
      description: 'A test product for verification purposes with sufficient length',
      category: 'Software',
      productType: 'SaaS',
      targetCustomer: 'Test target customers who need solutions',
      customerProblem: 'They have a problem that needs solving urgently',
      customerSophistication: 'Aware of the problem',
      mainBenefit: 'Main benefit that solves their problem effectively',
      keyDifferentiator: 'Key differentiator that makes us unique in market',
      price: '$99/month',
      marketingGoal: 'Acquire users',
      launchType: 'Beta launch',
      desiredCTA: 'Start free trial',
      primaryChannel: 'LinkedIn',
      campaignDuration: '7 days'
    },
    productIntelligence: {
      idealCustomerProfile: 'Test customers who are aware of their problem and looking for solutions',
      coreProblem: 'Manual processes waste valuable time and create uncertainty about accuracy',
      primaryPain: 'Struggling with inefficient manual processes that waste time',
      desiredOutcome: 'Streamlined workflow with automated processes',
      corePromise: 'Save 10 hours per week with automated solutions',
      differentiators: ['Easy to use interface', 'Fast implementation'],
      emotionalDrivers: ['Relief from stress', 'Confidence in accuracy'],
      objections: ['Price concerns', 'Learning curve'],
      recommendedMessagingAngle: 'pain' as const
    },
    aidaStrategy: {
      attention: {
        stage: 'attention' as const,
        objective: 'Hook the audience with their main pain point and problem',
        contentDirection: 'Lead with the customer pain and make it relatable to them',
        keyPoints: ['Pain point one', 'Pain point two']
      },
      interest: {
        stage: 'interest' as const,
        objective: 'Show the cost of not solving this problem right now',
        contentDirection: 'Explain why this problem is expensive and risky',
        keyPoints: ['Cost one', 'Cost two']
      },
      desire: {
        stage: 'desire' as const,
        objective: 'Paint the picture of success after solving the problem',
        contentDirection: 'Show the transformation and desired outcome clearly',
        keyPoints: ['Outcome one', 'Outcome two'],
        proofRequirements: ['[TESTIMONIAL]']
      },
      action: {
        stage: 'action' as const,
        objective: 'Make it easy to take the next step with clear CTA',
        contentDirection: 'Introduce product and reduce friction to action',
        keyPoints: ['Easy to start', 'No risk trial']
      }
    },
    selectedAngle: {
      type: 'pain' as const,
      tagline: 'Stop struggling with test problems',
      coreMessage: 'Our solution eliminates the struggle completely',
      rationale: 'Pain-focused angle resonates with target audience'
    }
  }
}

async function runQuickTest() {
  console.log('🚀 Quick Campaign Builder Test\n')
  
  try {
    console.log('⏳ Calling agent...')
    const startTime = Date.now()
    
    const result = await campaignBuilderLinkedInAgent(testInput)
    
    const duration = Date.now() - startTime
    
    console.log(`✅ Success! (${duration}ms)`)
    console.log(`   Posts generated: ${result.result.length}`)
    console.log(`   Tokens used: ${result.metadata.tokensUsed}`)
    
    result.result.forEach((post, i) => {
      const content = post.content as any
      console.log(`\n   Post ${i + 1} (${post.stage}): ${content.content.length} chars`)
    })
    
    console.log('\n✅ Campaign Builder LinkedIn Agent is working correctly!')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

runQuickTest()
