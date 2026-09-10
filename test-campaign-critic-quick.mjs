/**
 * Quick Test Script for Campaign Critic Agent
 * 
 * This script validates the critique output structure without making API calls.
 * It uses mock data to verify the scoring system, critical stage logic, and
 * recommendation structure.
 * 
 * Usage: node test-campaign-critic-quick.mjs
 */

// Mock critique output (what we expect from the agent)
const mockCritique = {
  overallScore: 7.5,
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
      issue: 'LinkedIn post opens with product features instead of customer pain point',
      severity: 'high'
    },
    {
      stage: 'attention',
      issue: 'Pain-based ad headline is generic and doesn\'t use customer language',
      severity: 'medium'
    },
    {
      stage: 'overall',
      issue: 'Some assets reference competitors without clearly articulating FreelanceBooks differentiators',
      severity: 'low'
    }
  ],
  recommendations: [
    {
      stage: 'attention',
      recommendation: 'Replace feature-focused openings with the primary pain: "Spending hours every week on manual bookkeeping instead of client work"',
      expectedImpact: 'Immediately resonates with target freelancers, creates urgency'
    },
    {
      stage: 'desire',
      recommendation: 'Strengthen outcome transformation by showing the "after" state more vividly',
      expectedImpact: 'Increases emotional resonance and desire for the solution'
    }
  ],
  primaryRecommendation: {
    stage: 'attention',
    targetAssetIds: ['0', '3'],
    recommendation: 'The LinkedIn attention post and pain-based ad for FreelanceBooks open with product features instead of the customer pain. Replace openings with the primary pain: "Spending hours every week on manual bookkeeping instead of client work"',
    suggestedFix: 'Opening paragraph: Are you a freelancer earning $30k-$150k? Spending hours every week on manual bookkeeping instead of client work. Most freelancers spend 15+ hours per month just trying to understand their financial position. You\'re not alone — and there\'s a better way.'
  }
}

// Validation function
function validateCritique(critique) {
  const errors = []
  
  // Check all scores are present and in valid range (1-10)
  const scoreFields = [
    'attentionScore',
    'interestScore',
    'desireScore',
    'actionScore',
    'messageConsistency',
    'audienceFit'
  ]
  
  scoreFields.forEach(field => {
    if (typeof critique[field] !== 'number') {
      errors.push(`Missing or invalid ${field}`)
    } else if (critique[field] < 1 || critique[field] > 10) {
      errors.push(`${field} must be between 1-10, got ${critique[field]}`)
    } else if (!Number.isInteger(critique[field])) {
      errors.push(`${field} must be an integer, got ${critique[field]}`)
    }
  })
  
  // Check overall score calculation (Req 6.2)
  const expectedOverallScore = (
    critique.attentionScore +
    critique.interestScore +
    critique.desireScore +
    critique.actionScore +
    critique.messageConsistency +
    critique.audienceFit
  ) / 6
  
  const roundedExpected = Math.round(expectedOverallScore * 10) / 10
  
  if (Math.abs(critique.overallScore - roundedExpected) > 0.01) {
    errors.push(
      `Overall score mismatch: got ${critique.overallScore}, expected ${roundedExpected} ` +
      `(calculated from: ${critique.attentionScore}, ${critique.interestScore}, ${critique.desireScore}, ${critique.actionScore}, ${critique.messageConsistency}, ${critique.audienceFit})`
    )
  }
  
  // Check overall score has 1 decimal place
  const overallStr = critique.overallScore.toString()
  if (!overallStr.includes('.') || overallStr.split('.')[1].length > 1) {
    errors.push(`Overall score must have exactly 1 decimal place, got ${critique.overallScore}`)
  }
  
  // Check critical stage identification (Req 6.3)
  const stageScores = [
    { stage: 'attention', score: critique.attentionScore },
    { stage: 'interest', score: critique.interestScore },
    { stage: 'desire', score: critique.desireScore },
    { stage: 'action', score: critique.actionScore }
  ]
  
  const lowestScore = Math.min(...stageScores.map(s => s.score))
  const expectedCriticalStage = stageScores.find(s => s.score === lowestScore)?.stage
  
  if (critique.criticalStage !== expectedCriticalStage) {
    errors.push(
      `Critical stage mismatch: got "${critique.criticalStage}", expected "${expectedCriticalStage}" ` +
      `(lowest score is ${lowestScore})`
    )
  }
  
  // Check findings structure
  if (!Array.isArray(critique.findings) || critique.findings.length === 0) {
    errors.push('findings must be a non-empty array')
  } else {
    critique.findings.forEach((finding, index) => {
      if (!finding.stage || !finding.issue || !finding.severity) {
        errors.push(`Finding ${index}: missing required fields (stage, issue, severity)`)
      }
      if (finding.severity && !['low', 'medium', 'high'].includes(finding.severity)) {
        errors.push(`Finding ${index}: severity must be low/medium/high, got "${finding.severity}"`)
      }
    })
  }
  
  // Check recommendations structure
  if (!Array.isArray(critique.recommendations) || critique.recommendations.length === 0) {
    errors.push('recommendations must be a non-empty array')
  } else {
    critique.recommendations.forEach((rec, index) => {
      if (!rec.stage || !rec.recommendation || !rec.expectedImpact) {
        errors.push(`Recommendation ${index}: missing required fields (stage, recommendation, expectedImpact)`)
      }
    })
  }
  
  // Check primary recommendation structure (Req 6.3)
  const pr = critique.primaryRecommendation
  if (!pr) {
    errors.push('primaryRecommendation is required')
  } else {
    if (!pr.stage) {
      errors.push('primaryRecommendation.stage is required')
    }
    if (!Array.isArray(pr.targetAssetIds) || pr.targetAssetIds.length === 0) {
      errors.push('primaryRecommendation.targetAssetIds must be a non-empty array')
    }
    if (!pr.recommendation) {
      errors.push('primaryRecommendation.recommendation is required')
    }
    if (!pr.suggestedFix) {
      errors.push('primaryRecommendation.suggestedFix is required')
    }
    
    // Primary recommendation should focus on critical stage
    if (pr.stage !== critique.criticalStage) {
      errors.push(
        `primaryRecommendation.stage should be critical stage: ` +
        `got "${pr.stage}", expected "${critique.criticalStage}"`
      )
    }
  }
  
  return errors
}

// Run the test
console.log('🧪 Testing Campaign Critic Output Structure\n')

const errors = validateCritique(mockCritique)

if (errors.length === 0) {
  console.log('✅ All validation checks passed!\n')
  
  console.log('Critique Summary:')
  console.log(`  Overall Score: ${mockCritique.overallScore}/10`)
  console.log(`  Critical Stage: ${mockCritique.criticalStage}`)
  console.log('')
  
  console.log('Stage Scores:')
  console.log(`  Attention: ${mockCritique.attentionScore}/10 ⚠️ (lowest)`)
  console.log(`  Interest: ${mockCritique.interestScore}/10`)
  console.log(`  Desire: ${mockCritique.desireScore}/10`)
  console.log(`  Action: ${mockCritique.actionScore}/10`)
  console.log('')
  
  console.log('Cross-Cutting Scores:')
  console.log(`  Message Consistency: ${mockCritique.messageConsistency}/10`)
  console.log(`  Audience Fit: ${mockCritique.audienceFit}/10`)
  console.log('')
  
  console.log(`Findings: ${mockCritique.findings.length}`)
  mockCritique.findings.forEach((finding, index) => {
    console.log(`  ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.stage}: ${finding.issue}`)
  })
  console.log('')
  
  console.log(`Recommendations: ${mockCritique.recommendations.length}`)
  mockCritique.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec.stage}: ${rec.recommendation.substring(0, 80)}...`)
  })
  console.log('')
  
  console.log('Primary Recommendation:')
  console.log(`  Stage: ${mockCritique.primaryRecommendation.stage}`)
  console.log(`  Target Assets: ${mockCritique.primaryRecommendation.targetAssetIds.join(', ')}`)
  console.log(`  Fix: "${mockCritique.primaryRecommendation.suggestedFix.substring(0, 100)}..."`)
  console.log('')
  
  console.log('✨ Critique structure is correct!')
  console.log('\n📝 Next: Run verify-campaign-critic.mjs to test with actual API call')
} else {
  console.log('❌ Validation errors found:\n')
  errors.forEach(error => console.log(`   - ${error}`))
  process.exit(1)
}
