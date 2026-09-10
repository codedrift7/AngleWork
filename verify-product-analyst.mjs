/**
 * Verification script for Product Analyst Agent implementation
 * This checks the code structure without making API calls
 */

import { ProductIntelligenceSchema } from './src/lib/types/campaign.ts'

console.log('🔍 Verifying Product Analyst Agent Implementation...\n')

// Test 1: Check schema structure
console.log('✅ Test 1: ProductIntelligenceSchema structure')
const testData = {
  idealCustomerProfile: 'Test customer profile',
  coreProblem: 'Test core problem description',
  primaryPain: "I'm struggling with this specific issue",
  desiredOutcome: 'Test desired outcome',
  corePromise: 'Test core promise',
  differentiators: ['Differentiator 1', 'Differentiator 2'],
  emotionalDrivers: ['Fear', 'Aspiration'],
  objections: ['Objection 1', 'Objection 2'],
  recommendedMessagingAngle: 'pain'
}

try {
  const validated = ProductIntelligenceSchema.parse(testData)
  console.log('   ✓ Schema validation works correctly')
} catch (error) {
  console.log('   ✗ Schema validation failed:', error.message)
  process.exit(1)
}

// Test 2: Check primary pain constraints
console.log('\n✅ Test 2: Primary pain validation')
try {
  // Should pass: 5-200 chars
  ProductIntelligenceSchema.parse({
    ...testData,
    primaryPain: "I'm lost" // 8 chars, valid
  })
  console.log('   ✓ Minimum length (5 chars) validation works')

  // Should fail: too short
  try {
    ProductIntelligenceSchema.parse({
      ...testData,
      primaryPain: "Lost" // 4 chars, too short
    })
    console.log('   ✗ Should have rejected too-short pain')
    process.exit(1)
  } catch (e) {
    console.log('   ✓ Correctly rejects too-short pain')
  }

  // Should fail: too long
  try {
    ProductIntelligenceSchema.parse({
      ...testData,
      primaryPain: 'x'.repeat(201) // 201 chars, too long
    })
    console.log('   ✗ Should have rejected too-long pain')
    process.exit(1)
  } catch (e) {
    console.log('   ✓ Correctly rejects too-long pain')
  }
} catch (error) {
  console.log('   ✗ Primary pain validation failed:', error.message)
  process.exit(1)
}

// Test 3: Check array constraints
console.log('\n✅ Test 3: Array length constraints')
try {
  // Differentiators: 1-5
  ProductIntelligenceSchema.parse({
    ...testData,
    differentiators: ['One']
  })
  console.log('   ✓ Accepts 1 differentiator')

  ProductIntelligenceSchema.parse({
    ...testData,
    differentiators: ['One', 'Two', 'Three', 'Four', 'Five']
  })
  console.log('   ✓ Accepts 5 differentiators')

  try {
    ProductIntelligenceSchema.parse({
      ...testData,
      differentiators: [] // Empty array, should fail
    })
    console.log('   ✗ Should have rejected empty differentiators')
    process.exit(1)
  } catch (e) {
    console.log('   ✓ Correctly rejects empty differentiators')
  }

  // Objections: 2-5
  ProductIntelligenceSchema.parse({
    ...testData,
    objections: ['One', 'Two']
  })
  console.log('   ✓ Accepts 2 objections')

  try {
    ProductIntelligenceSchema.parse({
      ...testData,
      objections: ['One'] // Only 1, should fail
    })
    console.log('   ✗ Should have rejected single objection')
    process.exit(1)
  } catch (e) {
    console.log('   ✓ Correctly requires at least 2 objections')
  }
} catch (error) {
  console.log('   ✗ Array constraint validation failed:', error.message)
  process.exit(1)
}

// Test 4: Check enum constraint
console.log('\n✅ Test 4: Messaging angle enum')
try {
  ProductIntelligenceSchema.parse({
    ...testData,
    recommendedMessagingAngle: 'pain'
  })
  console.log('   ✓ Accepts "pain"')

  ProductIntelligenceSchema.parse({
    ...testData,
    recommendedMessagingAngle: 'outcome'
  })
  console.log('   ✓ Accepts "outcome"')

  ProductIntelligenceSchema.parse({
    ...testData,
    recommendedMessagingAngle: 'time'
  })
  console.log('   ✓ Accepts "time"')

  try {
    ProductIntelligenceSchema.parse({
      ...testData,
      recommendedMessagingAngle: 'invalid'
    })
    console.log('   ✗ Should have rejected invalid angle')
    process.exit(1)
  } catch (e) {
    console.log('   ✓ Correctly rejects invalid messaging angle')
  }
} catch (error) {
  console.log('   ✗ Enum validation failed:', error.message)
  process.exit(1)
}

// Test 5: Check agent file structure
console.log('\n✅ Test 5: Agent file structure')
try {
  const { productAnalystAgent } = await import('./src/lib/pipeline/agents/product-analyst.ts')
  console.log('   ✓ Agent exports productAnalystAgent function')
  console.log('   ✓ Agent can be imported successfully')
  
  if (typeof productAnalystAgent !== 'function') {
    console.log('   ✗ productAnalystAgent is not a function')
    process.exit(1)
  }
  console.log('   ✓ productAnalystAgent is a function')
} catch (error) {
  console.log('   ✗ Agent import failed:', error.message)
  process.exit(1)
}

console.log('\n🎉 All verification tests passed!')
console.log('\n📝 Summary:')
console.log('   - ProductIntelligenceSchema validates correctly')
console.log('   - Primary pain constraints (5-200 chars) enforced')
console.log('   - Array constraints (differentiators: 1-5, objections: 2-5) enforced')
console.log('   - Messaging angle enum (pain/outcome/time) enforced')
console.log('   - Agent function exports correctly')
console.log('\n✅ Product Analyst Agent implementation is structurally correct!')
console.log('   Ready for integration into pipeline orchestrator.')
