/**
 * Demo showing CampaignCritiquePanel component
 * This is a standalone file demonstrating the component with sample critique data
 */

import { CampaignCritiquePanel } from './src/components/CampaignCritiquePanel'
import { Critique } from './src/lib/types/campaign'

// Sample critique data for FreelanceBooks campaign
const sampleCritique: Critique = {
  overallScore: 7.2,
  attentionScore: 6,
  interestScore: 7,
  desireScore: 8,
  actionScore: 9,
  messageConsistency: 8,
  audienceFit: 7,
  criticalStage: 'attention',
  findings: [
    {
      stage: 'attention',
      issue: 'LinkedIn post opens with "FreelanceBooks offers automated bookkeeping" instead of leading with the customer\'s pain point of spending hours on manual bookkeeping',
      severity: 'high'
    },
    {
      stage: 'attention',
      issue: 'Pain-based ad headline "Still sorting receipts?" doesn\'t emphasize the time cost or urgency strongly enough',
      severity: 'medium'
    },
    {
      stage: 'overall',
      issue: 'Some assets reference competitors without clearly articulating FreelanceBooks\' specific differentiators for freelancers',
      severity: 'low'
    },
    {
      stage: 'desire',
      issue: 'Desire-stage email lists features ("automated categorization, tax estimates") instead of painting the outcome picture ("know your profit instantly")',
      severity: 'medium'
    }
  ],
  recommendations: [
    {
      stage: 'attention',
      recommendation: 'Replace feature-focused openings with the primary pain: "Spending hours every week on manual bookkeeping instead of client work". Open with the gap between their bank balance and knowing their real profit.',
      expectedImpact: 'Immediately resonates with target freelancers earning $30k-$150k, creates urgency by mirroring their exact language and frustration'
    },
    {
      stage: 'desire',
      recommendation: 'Strengthen outcome transformation by showing the "after" state more vividly: "Know your real profit after every project closes" instead of listing features like "automated expense categorization"',
      expectedImpact: 'Shifts focus from features to customer transformation, increases emotional resonance and desire for the solution'
    },
    {
      stage: 'overall',
      recommendation: 'When mentioning competitors or alternatives, explicitly state FreelanceBooks\' differentiator: "Built specifically for freelancers, not generic accounting software designed for accountants"',
      expectedImpact: 'Strengthens positioning and helps justify the purchase decision against alternative solutions'
    }
  ],
  primaryRecommendation: {
    stage: 'attention',
    targetAssetIds: ['asset-linkedin-attention', 'asset-ad-pain'],
    recommendation: 'The LinkedIn attention post and pain-based ad for FreelanceBooks open with product features ("FreelanceBooks offers automated bookkeeping") instead of the customer\'s pain point. Replace the opening with the primary pain from Product Intelligence: "Spending hours every week on manual bookkeeping instead of client work"',
    suggestedFix: 'Are you a freelancer earning $30k-$150k annually? Spending hours every week on manual bookkeeping instead of client work. Most freelancers spend 15+ hours per month just trying to understand their financial position — time you could spend growing your business. You\'re not alone — and there\'s a better way.'
  }
}

// Demo component
export default function CampaignCritiquePanelDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          CampaignCritiquePanel Component Demo
        </h1>
        
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Demo Context</h2>
          <p className="text-blue-800 mb-4">
            This demo shows the critique panel for a FreelanceBooks campaign after 
            the Campaign Critic (Stage 5) has analyzed all generated assets.
          </p>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• <strong>Overall Score:</strong> 7.2/10 (Good - but room for improvement)</li>
            <li>• <strong>Critical Stage:</strong> Attention (lowest score at 6/10)</li>
            <li>• <strong>Findings:</strong> 4 issues identified across multiple stages</li>
            <li>• <strong>Recommendations:</strong> 3 actionable improvements suggested</li>
            <li>• <strong>Primary Fix:</strong> Update attention-stage assets to lead with pain</li>
          </ul>
        </div>
        
        <CampaignCritiquePanel 
          critique={sampleCritique} 
          campaignId="demo-campaign-123" 
        />
        
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-900">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-800">
            <div>
              <h3 className="font-semibold mb-2">Display Features:</h3>
              <ul className="space-y-1 text-sm">
                <li>✓ Overall score with color coding</li>
                <li>✓ All 6 component scores</li>
                <li>✓ Critical stage highlighting</li>
                <li>✓ Findings with severity badges</li>
                <li>✓ Recommendations with impact</li>
                <li>✓ Primary recommendation prominence</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Interactive Features:</h3>
              <ul className="space-y-1 text-sm">
                <li>✓ "Apply Recommendation" button</li>
                <li>✓ Loading state during application</li>
                <li>✓ Success message on completion</li>
                <li>✓ Error message on failure</li>
                <li>✓ Automatic dashboard refresh</li>
                <li>✓ Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-900">Score Color Guide</h2>
          <div className="space-y-2 text-purple-800">
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-bold text-lg">8-10</span>
              <span>Excellent - Campaign performs very well in this dimension</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600 font-bold text-lg">6-7</span>
              <span>Good - Solid performance with room for optimization</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-orange-600 font-bold text-lg">4-5</span>
              <span>Needs Work - Significant improvements recommended</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-600 font-bold text-lg">1-3</span>
              <span>Critical - Immediate attention required</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">Try It Out</h2>
          <p className="text-yellow-800 mb-4">
            Click the "Apply Recommendation" button to see the interaction:
          </p>
          <ul className="space-y-2 text-yellow-800 text-sm">
            <li>1. Button enters loading state with spinner</li>
            <li>2. applyCritiqueRecommendation action is called</li>
            <li>3. Target assets (LinkedIn post + pain ad) are updated</li>
            <li>4. Success message appears briefly</li>
            <li>5. Campaign dashboard refreshes automatically</li>
            <li>6. Updated assets show new content</li>
          </ul>
          <p className="text-yellow-800 mt-4 text-sm italic">
            Note: In this demo, the button is connected to the actual action but won't 
            find real assets. In production, it updates the specified assets in the database.
          </p>
        </div>
      </div>
    </div>
  )
}
