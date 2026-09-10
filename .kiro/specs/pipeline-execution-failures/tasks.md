# Implementation Plan

- [x] 1. Write bug condition exploration test for Bug #1 (NEXT_REDIRECT logging)
  - **Property 1.1: Bug Condition** - NEXT_REDIRECT Logged as Error
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate NEXT_REDIRECT is incorrectly logged as an error
  - **Scoped PBT Approach**: Scope the property to concrete cases where redirect() is called successfully
  - Test that when redirect() is called at line 211 in src/actions/campaign.ts, console.error at line 213 logs "NEXT_REDIRECT" as an error (from Bug Condition #1 in design)
  - Generate various valid campaign form inputs that trigger successful redirects
  - Capture console.error calls during execution
  - Assert "NEXT_REDIRECT" appears in error logs (from isBugCondition1 pseudocode)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Console shows 'createCampaignFromBrief error: Error: NEXT_REDIRECT' on successful redirect")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write bug condition exploration test for Bug #2 (Product Analyst timeout)
  - **Property 1.2: Bug Condition** - Product Analyst Times Out at 30 Seconds
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate 30-second timeout is insufficient
  - **Scoped PBT Approach**: Scope the property to LLM response times between 30-120 seconds
  - Test that when Product Analyst agent executes with LLM taking 35, 45, 60, 90 seconds, the system throws timeout error at 30 seconds (from Bug Condition #2 in design)
  - Mock the LLM call to simulate different response durations
  - Assert timeout error "Product Analyst agent exceeded 30 second timeout" is thrown (from isBugCondition2 pseudocode)
  - Assert pipeline execution fails and campaign status is set to 'error'
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Product Analyst times out at 30s when LLM takes 45s - pipeline fails")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 3. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Error Handling and Timeout Mechanisms
  - **IMPORTANT**: Follow observation-first methodology
  - Observe error handling behavior on UNFIXED code for genuine errors (database failures, validation errors, network errors)
  - Observe that genuine errors are logged at line 213 with "createCampaignFromBrief error:" prefix
  - Observe that Zod validation errors produce field-specific error messages (lines 216-226)
  - Observe that NEXT_REDIRECT is re-thrown at line 235 (even though it's also logged incorrectly at line 213)
  - Observe timeout behavior on UNFIXED code for other agents (Positioning Strategist, Campaign Builder, etc.)
  - Observe that when any agent exceeds its timeout, campaign status is updated to 'error'
  - Observe pipeline orchestration on UNFIXED code: Strategy record creation, progress logging, asynchronous execution
  - Write property-based tests capturing all observed behaviors from Preservation Requirements in design
  - Property-based testing generates many test cases for stronger guarantees
  - **Test Cases**:
    - For all genuine errors (database, validation, network), assert they are still logged and handled appropriately
    - For all Zod validation errors, assert field-specific error messages are returned
    - For all NEXT_REDIRECT errors, assert they are still re-thrown (line 235 behavior must be preserved)
    - For all non-Product-Analyst agents, assert their timeout configurations remain unchanged
    - For all timeout errors, assert campaign status is updated to 'error' with error details
    - For all successful Product Analyst executions, assert Strategy record is created with product intelligence
    - For all pipeline stages, assert progress messages are logged with metadata (token usage, execution time)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 4. Fix Bug #1: Misleading NEXT_REDIRECT Error Logging

  - [x] 4.1 Implement the fix for Bug #1
    - Open src/actions/campaign.ts
    - Locate the catch block at line 212
    - Add NEXT_REDIRECT detection BEFORE the console.error statement at line 213
    - Check if error has 'digest' property (Next.js redirect signature)
    - If NEXT_REDIRECT detected, skip error logging and re-throw immediately
    - Implementation pseudocode from design:
      ```typescript
      } catch (error) {
        // Check if this is a redirect BEFORE logging (Bug #1 fix)
        if (error && typeof error === 'object' && 'digest' in error) {
          // This is a Next.js redirect - don't log as error, just re-throw
          throw error
        }
      
        // Now log genuine errors only
        console.error('[Server Action] createCampaignFromBrief error:', error)
      
        // Rest of error handling remains unchanged...
      }
      ```
    - Preserve all other error handling logic: Zod validation (lines 216-226), error re-throw for NEXT_REDIRECT (lines 233-235), generic error response (lines 237-240)
    - _Bug_Condition: isBugCondition1(error) where error IS NEXT_REDIRECT AND error IS logged at line 213_
    - _Expected_Behavior: NEXT_REDIRECT should not be logged as error; only genuine errors should be logged (Property 1 from design)_
    - _Preservation: All existing error handling for genuine errors must remain unchanged (Requirements 3.1, 3.2, 3.3)_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 4.2 Verify Bug #1 exploration test now passes
    - **Property 1.1: Expected Behavior** - NEXT_REDIRECT Not Logged as Error
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Submit valid campaign form → Pipeline starts → redirect() called → Capture console output
    - **EXPECTED OUTCOME**: Test PASSES - "NEXT_REDIRECT" does NOT appear in error logs
    - Verify redirect executes successfully and user lands on dashboard
    - _Requirements: 2.1, 2.2_

- [x] 5. Fix Bug #2: Product Analyst Agent Timeout

  - [x] 5.1 Implement the fix for Bug #2 in orchestrator.ts
    - Open src/lib/pipeline/orchestrator.ts
    - Locate the withTimeout call for Product Analyst at lines 224-231
    - Change timeout from 30000ms to 120000ms (120 seconds) at line 230
    - Update error message to "Product Analyst agent exceeded 120 second timeout"
    - Implementation pseudocode from design:
      ```typescript
      const productIntelligenceResult = await withTimeout(
        productAnalystAgent({
          data: productBrief,
          campaignId
        }),
        120000, // 120 seconds - increased from 30s to accommodate LLM analysis time (Bug #2 fix)
        'Product Analyst agent exceeded 120 second timeout'
      )
      ```
    - _Bug_Condition: isBugCondition2(agentExecution) where actualDuration > 30000ms AND actualDuration <= 120000ms_
    - _Expected_Behavior: Product Analyst should complete successfully within 120-second timeout for realistic LLM response times (Property 2 from design)_
    - _Preservation: All other agent timeout configurations must remain unchanged (Requirements 3.4, 3.5, 3.6)_
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4, 2.5, 3.4, 3.5, 3.6_

  - [x] 5.2 Implement the fix for Bug #2 in product-analyst.ts
    - Open src/lib/pipeline/agents/product-analyst.ts
    - Locate the withTimeout call for LLM at lines 136-139
    - Change timeout from 30000ms to 120000ms (120 seconds) at line 138
    - Update error message to "Product Analyst agent exceeded 120 second timeout"
    - Add comment documenting timeout rationale: "LLM-based competitive intelligence typically takes 45-90 seconds; 120 second timeout accommodates complex briefs while providing protection (Bug #2 fix)"
    - Implementation pseudocode from design:
      ```typescript
      // LLM-based competitive intelligence typically takes 45-90 seconds
      // 120 second timeout accommodates complex briefs while providing protection (Bug #2 fix)
      const result = await withTimeout(
        agentCall,
        120000, // 120 seconds
        'Product Analyst agent exceeded 120 second timeout'
      )
      ```
    - Preserve all LLM call logic, error handling, and response parsing
    - _Bug_Condition: isBugCondition2(agentExecution) where actualDuration > 30000ms AND actualDuration <= 120000ms_
    - _Expected_Behavior: Product Analyst LLM calls should complete successfully within 120-second timeout (Property 2 from design)_
    - _Preservation: All LLM call logic, error handling, and response parsing must remain unchanged (Requirements 3.7, 3.8, 3.9)_
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4, 2.5, 3.7, 3.8, 3.9_

  - [x] 5.3 Verify Bug #2 exploration test now passes
    - **Property 1.2: Expected Behavior** - Product Analyst Completes Within 120 Seconds
    - **IMPORTANT**: Re-run the SAME test from task 2 - do NOT write a new test
    - The test from task 2 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 2
    - Mock LLM to take 35, 45, 60, 90 seconds → Invoke Product Analyst → Assert no timeout error thrown
    - **EXPECTED OUTCOME**: Test PASSES - Product Analyst completes successfully for all response times between 30-120 seconds
    - Verify Strategy record is created with product intelligence
    - Verify pipeline proceeds to next stage successfully
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 5.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Error Handling and Timeout Mechanisms
    - **IMPORTANT**: Re-run the SAME tests from task 3 - do NOT write new tests
    - Run preservation property tests from step 3
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify genuine errors (database, validation, network) are still logged correctly
    - Verify Zod validation errors still produce field-specific error messages
    - Verify NEXT_REDIRECT is still re-thrown (line 235 behavior preserved)
    - Verify other agent timeouts remain unchanged (Positioning Strategist, Campaign Builder, etc.)
    - Verify timeout errors still update campaign status to 'error'
    - Verify Strategy record creation, progress logging, and async execution all unchanged
    - Confirm all preservation properties still hold after both fixes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 6. Checkpoint - Ensure all tests pass
  - Run all tests (bug condition exploration tests for both bugs + preservation property tests)
  - Verify Bug #1 fix: NEXT_REDIRECT no longer appears in error logs
  - Verify Bug #2 fix: Product Analyst completes successfully for LLM response times up to 120 seconds
  - Verify preservation: All existing error handling, timeout mechanisms, and pipeline orchestration unchanged
  - Ensure no test failures
  - If any issues arise, ask the user for guidance
