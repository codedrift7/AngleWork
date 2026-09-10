/**
 * Demo showing AidaStrategyDisplay component
 * This is a standalone file demonstrating the component with sample data
 */

import { AidaStrategyDisplay } from './src/components/AidaStrategyDisplay'
import { AidaStrategy } from './src/lib/types/campaign'

// Sample AIDA strategy data for a freelance bookkeeping assistant
const sampleAidaStrategy: AidaStrategy = {
  attention: {
    stage: 'attention',
    objective: 'Hook the reader with the primary pain point of financial uncertainty',
    contentDirection: 'Lead with the gap between bank balance and actual available money. Use customer language about not knowing where money is going.',
    keyPoints: [
      'Your bank balance isn\'t the same as knowing how much money you have',
      'Manual bookkeeping creates blind spots in your finances',
      'Sunday nights spent sorting receipts instead of resting'
    ],
    proofRequirements: ['[STAT: % of freelancers who don\'t know their real profit]', '[TESTIMONIAL: customer describing financial confusion]']
  },
  interest: {
    stage: 'interest',
    objective: 'Build credibility and explain why current solutions fail for freelancers',
    contentDirection: 'Show the cost of the unsolved problem and why traditional accounting tools don\'t work for freelancers earning $30k-$150k/year',
    keyPoints: [
      'Spreadsheets require constant maintenance and break down when you get busy',
      'Generic accounting software is built for accountants, not freelancers',
      'Guessing at your numbers leads to bad business decisions'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint the picture of the transformed state: clarity without expertise',
    contentDirection: 'Show the shift from uncertainty to knowing your real numbers. Focus on the outcome (financial clarity) without requiring accounting expertise.',
    keyPoints: [
      'Know your real profit after every project closes',
      'See proactive tax estimates before the deadline sneaks up',
      'Make confident decisions based on actual numbers, not guesses'
    ],
    proofRequirements: ['[CASE_STUDY: specific customer transformation story]']
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

// Demo component
export default function AidaStrategyDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          AidaStrategyDisplay Component Demo
        </h1>
        
        <AidaStrategyDisplay aidaStrategy={sampleAidaStrategy} />
        
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Component Features</h2>
          <ul className="space-y-2 text-blue-800">
            <li>✓ Displays all 4 AIDA stages (Attention, Interest, Desire, Action)</li>
            <li>✓ Shows stage objectives with clear visual hierarchy</li>
            <li>✓ Renders content directions for each stage</li>
            <li>✓ Lists key points with bullet formatting</li>
            <li>✓ Conditionally displays proof requirements when present</li>
            <li>✓ Follows ProductIntelligenceCard styling patterns</li>
            <li>✓ Uses consistent typography and spacing</li>
            <li>✓ Includes stage-specific emoji icons for visual clarity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
