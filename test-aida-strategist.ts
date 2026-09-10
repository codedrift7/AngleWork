/**
 * Quick verification for AIDA Strategist Agent
 */

import { aidaStrategistAgent } from './src/lib/pipeline/agents/aida-strategist'
import type { AidaStrategistInput } from './src/lib/pipeline/agents/aida-strategist'

const mockInput: AidaStrategistInput = {
  data: {
    productBrief: {
      productName: 'FreelanceBooks',
      description: 'AI-powered bookkeeping assistant for freelancers',
      category: 'SaaS',
      productType: 'software',
      targetCustomer: 'Freelancers and solo entrepreneurs who bill by the hour',
      customerProblem: 'Lack of financial visibility and spending Sundays sorting receipts',
      customerSophistication: 'Aware of problem but not actively looking for solutions',
      mainBenefit: 'Know your real numbers without becoming an accountant',
      keyDifferentiator: 'Automated transaction categorization plus proactive tax estimates',
      price: '$29/month',
      marketingGoal: 'Generate 500 trial signups',
      launchType: 'New product launch',
      desiredCTA: 'Start your 14-day free trial',
      primaryChannel: 'LinkedIn',
      campaignDuration: '7 days',
      competitors: 'QuickBooks Self-Employed, FreshBooks',
      brandVoice: 'Conversational, empowering, no jargon'
    },
    productIntelligence: {
      idealCustomerProfile: 'Freelancers who bill by the hour and lack financial clarity',
      coreProblem: 'Financial uncertainty — not knowing real profit vs bank balance',
      primaryPain: 'I never know how much money I actually have',
      desiredOutcome: 'Financial clarity without the accounting learning curve',
      corePromise: 'Know your real numbers in minutes, not hours',
      differentiators: [
        'Automated transaction categorization',
        'Proactive tax estimates',
        'No accounting knowledge required'
      ],
      emotionalDrivers: [
        'Confidence in business decisions',
        'Reclaim weekend time',
        'Stop feeling financially uncertain'
      ],
      objections: [
        'I do not have time to learn new software',
        'Accounting tools are too complicated'
      ],
      recommendedMessagingAngle: 'time'
    },
    positioning: {
      category: 'AI-powered bookkeeping for freelancers',
      positioningStatement: 'FreelanceBooks is the bookkeeping assistant that gives freelancers financial clarity without requiring accounting knowledge.',
      valueProposition: 'Stop spending Sundays sorting receipts. Get real-time financial clarity with automated categorization and proactive tax estimates.',
      primaryPain: 'Financial uncertainty and weekend time lost to manual bookkeeping',
      desiredTransformation: 'From financial confusion to confident business decisions'
    },
    selectedAngle: {
      type: 'time',
      tagline: 'Take bookkeeping off your Sunday-night to-do list',
      coreMessage: 'Freelancers who bill by the hour should not spend their weekends sorting receipts. FreelanceBooks automates transaction categorization and tax estimates, giving you financial clarity in minutes instead of hours.',
      rationale: 'Time is the most valuable resource for freelancers who bill hourly. This angle resonates because it quantifies the exact pain point — losing weekend time to bookkeeping — and positions the product as time-saving rather than feature-rich.'
    }
  },
  campaignId: 'verify-test'
}

console.log('Testing AIDA Strategist Agent...')
console.log()

const start = Date.now()
const output = await aidaStrategistAgent(mockInput)
const elapsed = Date.now() - start

console.log('SUCCESS! Generated in', elapsed, 'ms')
console.log()
console.log('ATTENTION:', output.result.attention.objective.substring(0, 100))
console.log()
console.log('INTEREST:', output.result.interest.objective.substring(0, 100))
console.log()
console.log('DESIRE:', output.result.desire.objective.substring(0, 100))
console.log()
console.log('ACTION:', output.result.action.objective.substring(0, 100))
