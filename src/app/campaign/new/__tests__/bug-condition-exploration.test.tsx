/**
 * Bug Condition Exploration Test
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **GOAL**: Surface counterexamples that demonstrate the architectural mismatch
 * 
 * Bug: page.tsx uses inline form with only 15 fields instead of MultiStepCampaignForm component with 23 fields
 * 
 * Expected counterexamples:
 * - page.tsx uses inline form with only 15 fields in state
 * - Step 4 displays summary review instead of optional field inputs
 * - FormData submitted contains only 15 entries (missing 8 optional fields)
 * - MultiStepCampaignForm component exists but is unused
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1**
 */

import fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

// Define the 8 optional fields that should be present
const OPTIONAL_FIELDS = [
  'competitors',
  'existingTagline',
  'brandVoice',
  'websiteURL',
  'customerTestimonials',
  'productDocs',
  'brandGuidelines',
  'existingCopy'
]

// Define all 23 fields that should be in the form
const ALL_FIELDS = [
  // 15 required fields
  'productName',
  'description',
  'category',
  'productType',
  'targetCustomer',
  'customerProblem',
  'customerSophistication',
  'mainBenefit',
  'keyDifferentiator',
  'price',
  'marketingGoal',
  'launchType',
  'desiredCTA',
  'primaryChannel',
  'campaignDuration',
  // 8 optional fields
  ...OPTIONAL_FIELDS
]

describe('Bug Condition Exploration - Inline Form Architecture Mismatch', () => {
  /**
   * Property 1: Bug Condition - Inline Form Architecture and Missing Optional Fields
   * 
   * This test verifies the architectural mismatch where page.tsx uses an inline form
   * implementation with only 15 required fields instead of using the MultiStepCampaignForm
   * component which properly handles all 23 fields.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 2.1**
   */
  it('Property 1: page.tsx should use MultiStepCampaignForm component with all 23 fields', () => {
    // Read the current implementation at page.tsx
    const pagePath = join(process.cwd(), 'src', 'app', 'campaign', 'new', 'page.tsx')
    const pageContent = readFileSync(pagePath, 'utf-8')
    
    // Read the correct MultiStepCampaignForm component
    const componentPath = join(process.cwd(), 'src', 'components', 'campaign-form', 'MultiStepCampaignForm.tsx')
    const componentContent = readFileSync(componentPath, 'utf-8')
    
    // 1. VERIFY: page.tsx should import and render MultiStepCampaignForm component
    // Expected behavior: page.tsx contains `import { MultiStepCampaignForm }`
    const importsMultiStepForm = pageContent.includes('MultiStepCampaignForm')
    const rendersMultiStepForm = pageContent.includes('<MultiStepCampaignForm')
    
    // 2. VERIFY: page.tsx should NOT have inline form state initialization
    // Expected behavior: page.tsx should NOT contain useState with formData initialization
    const hasInlineFormState = pageContent.includes('const [formData, setFormData] = useState')
    
    // 3. VERIFY: MultiStepCampaignForm exists and has all 23 fields in state
    // Expected behavior: component initializes all fields including optional ones
    const componentHasAllFields = ALL_FIELDS.every(field => 
      componentContent.includes(`${field}: ''`)
    )
    
    // 4. VERIFY: MultiStepCampaignForm renders Step4Optional component
    // Expected behavior: component renders <Step4Optional /> for step 4
    const componentUsesStep4Optional = componentContent.includes('<Step4Optional')
    
    // 5. VERIFY: page.tsx Step 4 should NOT be a review screen
    // Expected behavior: page.tsx should NOT contain "Ready to Create Your Campaign?" review text
    const pageHasReviewScreen = pageContent.includes('Ready to Create Your Campaign?')
    
    // ASSERTIONS - These should all pass after the fix, but FAIL on unfixed code
    
    // Expected: page.tsx imports and renders MultiStepCampaignForm
    expect(importsMultiStepForm).toBe(true)
    expect(rendersMultiStepForm).toBe(true)
    
    // Expected: page.tsx does NOT have inline form state
    expect(hasInlineFormState).toBe(false)
    
    // Expected: MultiStepCampaignForm has all 23 fields
    expect(componentHasAllFields).toBe(true)
    
    // Expected: MultiStepCampaignForm uses Step4Optional component
    expect(componentUsesStep4Optional).toBe(true)
    
    // Expected: page.tsx does NOT have review screen in Step 4
    expect(pageHasReviewScreen).toBe(false)
  })

  /**
   * Property-based test variant: For ANY form submission scenario, the architecture
   * should use MultiStepCampaignForm component with all 23 fields
   */
  it('Property 1 (PBT variant): Form architecture invariant holds for all usage patterns', () => {
    // Use fast-check to generate various form submission scenarios
    fc.assert(
      fc.property(
        fc.record({
          // Generate random form completion scenarios
          completedSteps: fc.integer({ min: 1, max: 4 }),
          hasFilledRequiredFields: fc.boolean(),
          wantsToFillOptionalFields: fc.boolean()
        }),
        (scenario) => {
          // Read the page.tsx implementation
          const pagePath = join(process.cwd(), 'src', 'app', 'campaign', 'new', 'page.tsx')
          const pageContent = readFileSync(pagePath, 'utf-8')
          
          // Read the component implementation
          const componentPath = join(process.cwd(), 'src', 'components', 'campaign-form', 'MultiStepCampaignForm.tsx')
          const componentContent = readFileSync(componentPath, 'utf-8')
          
          // INVARIANT: Regardless of user's interaction pattern (what step they're on,
          // whether they want to fill optional fields, etc.), the page should ALWAYS
          // use the MultiStepCampaignForm component architecture
          
          const usesMultiStepComponent = pageContent.includes('MultiStepCampaignForm')
          const rendersMultiStepComponent = pageContent.includes('<MultiStepCampaignForm')
          const hasInlineForm = pageContent.includes('const [formData, setFormData] = useState')
          
          // Expected: page.tsx uses MultiStepCampaignForm (not inline form)
          // This will FAIL on unfixed code because page.tsx has inline form
          expect(usesMultiStepComponent).toBe(true)
          expect(rendersMultiStepComponent).toBe(true)
          expect(hasInlineForm).toBe(false)
          
          // If user wants to fill optional fields, they should be available in the component
          if (scenario.wantsToFillOptionalFields) {
            // Check that optional fields are initialized in the component (not page.tsx)
            const optionalFieldsAvailable = OPTIONAL_FIELDS.every(field =>
              componentContent.includes(`${field}: ''`)
            )
            
            // Expected: Optional fields should be available in the component
            expect(optionalFieldsAvailable).toBe(true)
          }
        }
      ),
      {
        numRuns: 50, // Run 50 random scenarios
        verbose: true // Show counterexamples
      }
    )
  })

  /**
   * Counterexample documentation test: Verify and document the exact bug state
   */
  it('Bug Condition: Documents exact state of inline form vs MultiStepCampaignForm mismatch', () => {
    const pagePath = join(process.cwd(), 'src', 'app', 'campaign', 'new', 'page.tsx')
    const pageContent = readFileSync(pagePath, 'utf-8')
    
    const componentPath = join(process.cwd(), 'src', 'components', 'campaign-form', 'MultiStepCampaignForm.tsx')
    const componentContent = readFileSync(componentPath, 'utf-8')
    
    // Count fields in MultiStepCampaignForm
    const fieldsInComponent = ALL_FIELDS.filter(field =>
      componentContent.includes(`${field}: ''`)
    )
    
    // Check architecture
    const usesMultiStepComponent = pageContent.includes('MultiStepCampaignForm')
    const rendersMultiStepComponent = pageContent.includes('<MultiStepCampaignForm')
    const hasInlineForm = pageContent.includes('const [formData, setFormData] = useState')
    
    // Document the findings (these will be visible in test output)
    console.log('\n=== BUG CONDITION COUNTEREXAMPLES ===')
    console.log(`\n1. Fields in page.tsx inline form: ${hasInlineForm ? 'HAS INLINE FORM' : '0 (uses component)'}`)
    console.log(`   Expected: 23 (all fields including optional)`)
    console.log(`   Actual: ${hasInlineForm ? '15 (bug not fixed)' : '23 via MultiStepCampaignForm (fixed!)'}`)
    console.log(`   Missing fields: ${hasInlineForm ? OPTIONAL_FIELDS.join(', ') : 'none'}`)
    
    console.log(`\n2. Fields in MultiStepCampaignForm component: ${fieldsInComponent.length}`)
    console.log(`   Expected: 23 (all fields including optional)`)
    console.log(`   Actual: ${fieldsInComponent.length}`)
    
    console.log(`\n3. Step 4 rendering:`)
    console.log(`   page.tsx has review screen: ${pageContent.includes('Ready to Create Your Campaign?')}`)
    console.log(`   MultiStepCampaignForm uses Step4Optional: ${componentContent.includes('<Step4Optional')}`)
    
    console.log(`\n4. Architecture:`)
    console.log(`   page.tsx imports MultiStepCampaignForm: ${usesMultiStepComponent}`)
    console.log(`   page.tsx has inline form: ${hasInlineForm}`)
    
    console.log('\n=== END COUNTEREXAMPLES ===\n')
    
    // These assertions encode the EXPECTED behavior (after fix)
    // They will FAIL on unfixed code, documenting the bug
    
    // Expected: MultiStepCampaignForm has all 23 fields (this should already be true)
    expect(fieldsInComponent.length).toBe(23)
    
    // Expected: page.tsx uses MultiStepCampaignForm, not inline form
    expect(usesMultiStepComponent).toBe(true)
    expect(rendersMultiStepComponent).toBe(true)
    expect(hasInlineForm).toBe(false)
    
    // Expected: Step 4 uses optional fields component, not review screen
    expect(pageContent.includes('Ready to Create Your Campaign?')).toBe(false)
  })
})
