/**
 * Verification script for Task 4.2: Positioning Strategist Integration
 * Tests that Stage 2 is properly integrated into the pipeline orchestrator
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('='.repeat(80))
console.log('TASK 4.2 VERIFICATION: Positioning Strategist Integration')
console.log('='.repeat(80))
console.log()

// Read the orchestrator file
const orchestratorPath = join(__dirname, 'src/lib/pipeline/orchestrator.ts')
const fs = await import('fs')
const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf-8')

const checks = []

// Check 1: positioningStrategistAgent is imported
const hasImport = orchestratorContent.includes("import { positioningStrategistAgent } from './agents/positioning-strategist'")
checks.push({
  name: 'Import positioningStrategistAgent',
  passed: hasImport,
  details: hasImport ? 'Found import statement' : 'Missing import statement'
})

// Check 2: withTimeout is called for positioningStrategistAgent
const hasTimeoutCall = orchestratorContent.includes('withTimeout(') && 
  orchestratorContent.includes('positioningStrategistAgent(')
checks.push({
  name: 'Timeout wrapper for agent call',
  passed: hasTimeoutCall,
  details: hasTimeoutCall ? 'Agent call wrapped with withTimeout' : 'Missing timeout wrapper'
})

// Check 3: 30-second timeout is configured
const has30SecTimeout = orchestratorContent.includes('30000') && 
  orchestratorContent.includes('positioningStrategistAgent') &&
  orchestratorContent.includes('30 second timeout')
checks.push({
  name: '30-second timeout configured',
  passed: !!has30SecTimeout,
  details: has30SecTimeout ? 'Found 30000ms timeout' : 'Timeout not set to 30 seconds'
})

// Check 4: Strategy.update with positioning and messagingAngles
const hasStrategyUpdate = orchestratorContent.includes('prisma.strategy.update') &&
  orchestratorContent.includes('positioning: positioningResult.result.positioning') &&
  orchestratorContent.includes('messagingAngles: positioningResult.result.messagingAngles')
checks.push({
  name: 'Strategy record updated with real data',
  passed: hasStrategyUpdate,
  details: hasStrategyUpdate ? 'Found Strategy.update with positioning and messagingAngles' : 'Missing Strategy update'
})

// Check 5: Campaign status updated to positioning_complete
const hasStatusUpdate = orchestratorContent.includes("updateCampaignStatus(campaignId, 'positioning_complete')")
checks.push({
  name: 'Campaign status updated to positioning_complete',
  passed: hasStatusUpdate,
  details: hasStatusUpdate ? 'Status update found' : 'Status update missing'
})

// Check 6: Pipeline pauses (no automatic continuation to Stage 3)
const hasPauseBehavior = orchestratorContent.includes('Pipeline paused - awaiting messaging angle selection')
checks.push({
  name: 'Pipeline pauses for angle selection',
  passed: hasPauseBehavior,
  details: hasPauseBehavior ? 'Pause message found' : 'Pause behavior unclear'
})

// Check 7: No TODO comments in Stage 2
const stage2Section = orchestratorContent.match(/Stage 2: Positioning Strategist[\s\S]*?Stage 3: AIDA Strategist/)?.[0] || ''
const hasTodoInStage2 = stage2Section.includes('TODO')
checks.push({
  name: 'No TODO placeholders in Stage 2',
  passed: !hasTodoInStage2,
  details: hasTodoInStage2 ? 'Found TODO comments' : 'All TODOs replaced'
})

// Check 8: productBrief and productIntelligence passed to agent
const hasCorrectInput = orchestratorContent.includes('productBrief,') &&
  orchestratorContent.includes('productIntelligence: productIntelligenceResult.result')
checks.push({
  name: 'Correct input data passed to agent',
  passed: hasCorrectInput,
  details: hasCorrectInput ? 'productBrief and productIntelligence passed' : 'Incorrect input structure'
})

// Display results
console.log('VERIFICATION CHECKS:')
console.log('-'.repeat(80))

let passedCount = 0
checks.forEach((check, index) => {
  const status = check.passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${index + 1}. ${status} - ${check.name}`)
  console.log(`   ${check.details}`)
  if (check.passed) passedCount++
})

console.log()
console.log('='.repeat(80))
console.log(`SUMMARY: ${passedCount}/${checks.length} checks passed`)
console.log('='.repeat(80))

if (passedCount === checks.length) {
  console.log('✅ All verification checks passed!')
  console.log()
  console.log('Task 4.2 Implementation Complete:')
  console.log('- Positioning Strategist integrated into Stage 2')
  console.log('- 30-second timeout configured per Req 3.7')
  console.log('- Strategy record updated with real positioning data')
  console.log('- Campaign status updated to positioning_complete')
  console.log('- Pipeline pauses for user angle selection')
  process.exit(0)
} else {
  console.log('❌ Some checks failed - review implementation')
  process.exit(1)
}
