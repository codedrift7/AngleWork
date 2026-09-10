// Simple verification script for pipeline orchestrator
// Run with: npx tsx src/lib/pipeline/verify-orchestrator.ts

import { createPipelineError, checkPipelineResumability } from './orchestrator'

console.log('🔍 Verifying Pipeline Orchestrator Foundation...\n')

// Test 1: createPipelineError
console.log('Test 1: createPipelineError')
try {
  const error = createPipelineError(
    'Test error message',
    'test_stage',
    'test-campaign-id',
    true
  )
  
  console.log('✓ Error created successfully')
  console.log(`  - Message: ${error.message}`)
  console.log(`  - Stage: ${error.stage}`)
  console.log(`  - Campaign ID: ${error.campaignId}`)
  console.log(`  - Retryable: ${error.retryable}`)
  
  if (error.message === 'Test error message' && 
      error.stage === 'test_stage' &&
      error.campaignId === 'test-campaign-id' &&
      error.retryable === true) {
    console.log('✅ Test 1 PASSED\n')
  } else {
    console.log('❌ Test 1 FAILED - Properties don\'t match\n')
  }
} catch (e) {
  console.log('❌ Test 1 FAILED - Exception thrown:', e)
}

// Test 2: createPipelineError with defaults
console.log('Test 2: createPipelineError with defaults')
try {
  const error = createPipelineError('Simple error')
  
  console.log('✓ Error created with defaults')
  console.log(`  - Message: ${error.message}`)
  console.log(`  - Retryable: ${error.retryable}`)
  
  if (error.message === 'Simple error' && error.retryable === true) {
    console.log('✅ Test 2 PASSED\n')
  } else {
    console.log('❌ Test 2 FAILED - Defaults not applied correctly\n')
  }
} catch (e) {
  console.log('❌ Test 2 FAILED - Exception thrown:', e)
}

// Test 3: Module exports
async function test3() {
  console.log('Test 3: Check all required exports')
  try {
    const requiredExports = [
      'updateCampaignStatus',
      'handlePipelineError',
      'createPipelineError',
      'runCampaignPipeline',
      'resumePipelineAfterAngleSelection',
      'validateCampaignStatus',
      'checkPipelineResumability'
    ]
    
    const module = await import('./orchestrator')
    const exportedFunctions = Object.keys(module)
    
    console.log('✓ Module loaded successfully')
    console.log(`  Exported functions: ${exportedFunctions.join(', ')}`)
    
    const missingExports = requiredExports.filter(exp => !exportedFunctions.includes(exp))
    
    if (missingExports.length === 0) {
      console.log('✅ Test 3 PASSED - All required exports present\n')
    } else {
      console.log(`❌ Test 3 FAILED - Missing exports: ${missingExports.join(', ')}\n`)
    }
  } catch (e) {
    console.log('❌ Test 3 FAILED - Module import error:', e)
  }
  
  console.log('✨ Verification complete!\n')
  console.log('📝 Summary:')
  console.log('   - Pipeline orchestrator foundation created')
  console.log('   - Status update helper implemented')
  console.log('   - Error handling with campaign status tracking implemented')
  console.log('   - Structure for sequential agent execution set up')
  console.log('   - Ready for AI agent integration in subsequent tasks')
}

test3()
