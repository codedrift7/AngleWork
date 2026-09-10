# Pipeline Execution Failures Bugfix Design

## Overview

This bugfix addresses two critical issues in the campaign creation pipeline:

1. **Misleading Redirect Error Logging** (Bug #1): The `NEXT_REDIRECT` error is incorrectly logged as an error at line 213 of `src/actions/campaign.ts`, even though it represents expected Next.js redirect behavior. This creates false error signals that obscure genuine errors in logs.

2. **Product Analyst Agent Timeout** (Bug #2): The Product Analyst agent consistently times out after 30 seconds (configured at two locations: `src/lib/pipeline/orchestrator.ts:230` and `src/lib/pipeline/agents/product-analyst.ts:138`), causing complete pipeline failure and blocking the core intelligence generation feature.

The fix strategy involves:
- For Bug #1: Checking for NEXT_REDIRECT before logging errors
- For Bug #2: Increasing the timeout to 90-120 seconds based on empirical LLM response times

Both fixes are minimal, targeted changes that preserve all existing error handling and timeout mechanisms.

## Glossary

- **Bug_Condition_1 (C₁)**: NEXT_REDIRECT error being logged as an error when it represents expected redirect behavior
- **Bug_Condition_2 (C₂)**: Product Analyst agent timing out at 30 seconds when LLM analysis requires 90-120 seconds
- **Property_1 (P₁)**: NEXT_REDIRECT should not be logged as an error; only genuine errors should be logged
- **Property_2 (P₂)**: Product Analyst agent should complete successfully within an appropriate timeout window
- **Preservation**: All existing error handling, timeout mechanisms, and pipeline orchestration must remain unchanged
- **NEXT_REDIRECT**: A special error thrown by Next.js `redirect()` function with a `digest` property containing "NEXT_REDIRECT"
- **withTimeout**: Utility function that wraps promises with a timeout, throwing an error if the operation exceeds the time limit
- **Product Analyst agent**: First stage of the pipeline that generates competitive intelligence by analyzing product brief using LLM
- **Pipeline orchestration**: The sequential execution of agents (Product Analyst → Positioning Strategist → Campaign Builder → etc.)

## Bug Details

### Bug Condition #1: Misleading Redirect Error Logging

The bug manifests when `redirect()` is called successfully at line 211 in `src/actions/campaign.ts`. The system enters the catch block at line 212 because Next.js throws a `NEXT_REDIRECT` error to implement redirects. Even though the code correctly re-throws the redirect (line 234), it first logs it as an error at line 213, creating misleading error signals.

**Formal Specification:**
```
FUNCTION isBugCondition1(error)
  INPUT: error of type unknown (caught exception)
  OUTPUT: boolean
  
  RETURN error IS NEXT_REDIRECT
         AND error IS logged at line 213 as "createCampaignFromBrief error"
         AND redirect executes successfully
END FUNCTION
```

### Bug Condition #2: Product Analyst Agent Timeout

The bug manifests when the Product Analyst agent is invoked with LLM-based competitive intelligence analysis. The agent requires 60-90 seconds for OpenRouter LLM calls (including prompt processing, model inference, and structured output generation), but the system enforces a 30-second timeout at two locations. The `withTimeout` wrapper throws "Product Analyst agent exceeded 30 second timeout" before the LLM completes, causing the entire pipeline to fail.

**Formal Specification:**
```
FUNCTION isBugCondition2(agentExecution)
  INPUT: agentExecution of type Promise<ProductIntelligence>
  OUTPUT: boolean
  
  RETURN agentExecution.actualDuration > 30000 milliseconds
         AND agentExecution.actualDuration <= 120000 milliseconds
         AND agentExecution.operation IS LLM_API_call
         AND timeout IS configured at 30000 milliseconds
END FUNCTION
```

### Examples

**Bug #1 Examples:**
- User submits valid campaign form → pipeline starts → `redirect()` called → Console shows "createCampaignFromBrief error: Error: NEXT_REDIRECT" (misleading) → User redirects successfully to dashboard
- User submits campaign → No actual error occurred → Developer sees error log and investigates unnecessarily
- Genuine database error occurs → Console shows both the real error AND the redirect error (if redirect also happens) → Developer cannot distinguish real from false errors

**Bug #2 Examples:**
- Product Analyst invoked with comprehensive product brief → LLM takes 45 seconds to analyze → System throws timeout at 30 seconds → Pipeline fails → Campaign status = 'error' → No intelligence generated
- Product Analyst invoked with minimal product brief → LLM takes 25 seconds → System succeeds → Intelligence generated (works only for simple cases)
- Product Analyst invoked → Timeout occurs at 30 seconds → User sees error state on dashboard → Core feature is non-functional
- Edge case: Product Analyst with extremely detailed brief → LLM takes 95 seconds → Even with fix to 90 seconds, might still timeout (should work with 120-second timeout)

## Expected Behavior

### Bug #1: Redirect Error Logging

**Expected Correct Behavior (defined in Correctness Properties section):**
When `redirect()` is called, the system should recognize NEXT_REDIRECT as expected framework behavior and skip error logging, only logging informational messages.

### Bug #2: Product Analyst Agent Timeout

**Expected Correct Behavior (defined in Correctness Properties section):**
When the Product Analyst agent is invoked, the system should allow 90-120 seconds for LLM analysis to complete, enabling successful intelligence generation for typical product briefs.

### Preservation Requirements

**Unchanged Behaviors:**

**Error Handling Preservation:**
- Genuine errors (database failures, validation errors) must continue to be logged and handled appropriately
- Zod validation errors must continue to be caught and returned with field-specific error messages
- NEXT_REDIRECT errors must continue to be re-thrown so Next.js can handle the redirect

**Timeout Mechanism Preservation:**
- All agents must continue to have timeout protection to prevent indefinite waiting
- Timeout errors must continue to update campaign status to 'error' with error details
- Other agents (Positioning Strategist, Campaign Builder, etc.) must continue to execute with their existing timeout configurations unchanged

**Pipeline Orchestration Preservation:**
- Product Analyst success must continue to create Strategy record with product intelligence
- Pipeline stages must continue to log progress messages with token usage and execution time
- Pipeline must continue to execute asynchronously, allowing immediate redirect while processing continues

**Scope:**
All error handling paths, timeout mechanisms, and pipeline orchestration logic that do NOT involve NEXT_REDIRECT logging or Product Analyst timeout should be completely unaffected by this fix. This includes:
- Zod validation error handling
- Database error handling
- Other agent timeout configurations
- Strategy record creation logic
- Campaign status updates

## Hypothesized Root Cause

### Bug #1: Misleading Redirect Error Logging

Based on the bug description and code analysis, the root cause is:

1. **Order of Operations Issue**: The catch block at line 212 executes `console.error` at line 213 BEFORE checking whether the error is a NEXT_REDIRECT at line 234
   - Next.js `redirect()` throws a special error with `digest` property containing "NEXT_REDIRECT"
   - The catch block catches this error first
   - Line 213 logs ALL caught errors without discrimination
   - Only later (line 234) does the code check for NEXT_REDIRECT and re-throw it

2. **Missing Early Exit**: There is no early detection of NEXT_REDIRECT errors before the logging statement
   - The code correctly identifies NEXT_REDIRECT via the `digest` property check
   - But this check happens AFTER the error has already been logged
   - An early check before logging would prevent the false error signal

### Bug #2: Product Analyst Agent Timeout

Based on the bug description and code analysis, the most likely root cause is:

1. **Insufficient Timeout Duration**: 30 seconds is too short for LLM-based competitive intelligence analysis
   - OpenRouter API calls typically take 45-90 seconds for structured output generation
   - The timeout is hardcoded at 30000ms in two locations
   - Empirical observation shows Product Analyst consistently exceeds 30 seconds

2. **Duplicate Timeout Configuration**: The timeout is configured at two locations, creating maintenance burden
   - `src/lib/pipeline/orchestrator.ts:230`: `withTimeout(productAnalystAgent(...), 30000, ...)`
   - `src/lib/pipeline/agents/product-analyst.ts:138`: `withTimeout(agentCall, 30000, ...)`
   - Both must be updated to ensure consistent timeout behavior
   - The orchestrator timeout is the outer limit; the agent timeout is the inner limit

3. **No Dynamic Timeout Adjustment**: The timeout is static regardless of brief complexity
   - Simple briefs might complete in 20 seconds
   - Complex briefs might need 90 seconds
   - The current implementation uses the same 30-second timeout for all cases
   - A reasonable fixed timeout of 90-120 seconds accommodates most cases

## Correctness Properties

Property 1: Bug Condition #1 - NEXT_REDIRECT Not Logged as Error

_For any_ execution where `redirect()` is called successfully, the system SHALL NOT log the NEXT_REDIRECT error at line 213, instead recognizing it as expected Next.js framework behavior and only logging informational messages (e.g., "Pipeline started - redirecting to campaign dashboard").

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition #2 - Product Analyst Completes Within Extended Timeout

_For any_ Product Analyst invocation where the LLM analysis takes between 30 and 120 seconds, the system SHALL complete successfully without throwing a timeout error, allowing the intelligence generation to finish and creating the Strategy record with product intelligence.

**Validates: Requirements 2.3, 2.4, 2.5**

Property 3: Preservation - Genuine Error Logging

_For any_ genuine error (database failure, validation error, network error) that occurs in `createCampaignFromBrief`, the system SHALL continue to log it as an error and return appropriate error responses, preserving all existing error handling behavior.

**Validates: Requirements 3.1, 3.2, 3.3**

Property 4: Preservation - Timeout Mechanism

_For any_ agent operation (Product Analyst or others) that exceeds its configured timeout, the system SHALL continue to throw a timeout error, update campaign status to 'error', and prevent indefinite waiting, preserving the timeout protection mechanism.

**Validates: Requirements 3.4, 3.5, 3.6**

Property 5: Preservation - Pipeline Orchestration

_For any_ successful Product Analyst execution, the system SHALL continue to create a Strategy record with product intelligence, log progress messages with metadata, and allow asynchronous pipeline execution with immediate redirect, preserving all existing orchestration logic.

**Validates: Requirements 3.7, 3.8, 3.9**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

#### Bug #1: Misleading Redirect Error Logging

**File**: `src/actions/campaign.ts`

**Function**: `createCampaignFromBrief` catch block (lines 212-240)

**Specific Changes**:
1. **Add Early NEXT_REDIRECT Detection**: Before line 213 (console.error), add a check for NEXT_REDIRECT
   - Check if error has `digest` property (Next.js redirect signature)
   - If NEXT_REDIRECT detected, skip error logging and re-throw immediately
   - This prevents false error signals in logs

2. **Preserve Existing Error Handling**: Keep all other error handling logic unchanged
   - Zod validation error handling (lines 216-226)
   - Error re-throw for NEXT_REDIRECT (lines 233-235)
   - Generic error response (lines 237-240)

**Implementation Pseudocode**:
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

#### Bug #2: Product Analyst Agent Timeout

**File 1**: `src/lib/pipeline/orchestrator.ts`

**Location**: Line 224-231 (withTimeout call for Product Analyst)

**Specific Changes**:
1. **Increase Outer Timeout**: Change timeout from 30000ms to 120000ms (120 seconds)
   - Line 230: `30000` → `120000`
   - Update error message to reflect new timeout: "Product Analyst agent exceeded 120 second timeout"
   - This provides the outer time limit for the entire agent execution

**File 2**: `src/lib/pipeline/agents/product-analyst.ts`

**Location**: Line 136-139 (withTimeout call for LLM)

**Specific Changes**:
1. **Increase Inner Timeout**: Change timeout from 30000ms to 120000ms (120 seconds)
   - Line 138: `30000` → `120000`
   - Update error message to reflect new timeout: "Product Analyst agent exceeded 120 second timeout"
   - This provides the inner time limit specifically for the LLM API call

2. **Add Timeout Rationale Comment**: Document why 120 seconds is appropriate
   - Add comment explaining that LLM-based competitive intelligence analysis typically takes 45-90 seconds
   - Note that 120 seconds accommodates complex product briefs while still providing timeout protection

**Implementation Pseudocode**:
```typescript
// orchestrator.ts - Line 224-231
const productIntelligenceResult = await withTimeout(
  productAnalystAgent({
    data: productBrief,
    campaignId
  }),
  120000, // 120 seconds - increased from 30s to accommodate LLM analysis time (Bug #2 fix)
  'Product Analyst agent exceeded 120 second timeout'
)

// product-analyst.ts - Line 136-139
// LLM-based competitive intelligence typically takes 45-90 seconds
// 120 second timeout accommodates complex briefs while providing protection (Bug #2 fix)
const result = await withTimeout(
  agentCall,
  120000, // 120 seconds
  'Product Analyst agent exceeded 120 second timeout'
)
```

### No Database Schema Changes Required

Both fixes involve only code logic changes:
- Bug #1: Reordering error detection logic
- Bug #2: Changing timeout constant values

No database migrations, schema changes, or data transformations are needed.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach:
1. **Exploratory Bug Condition Checking**: Surface counterexamples demonstrating both bugs on unfixed code
2. **Fix and Preservation Checking**: Verify fixes work correctly and all existing behavior is preserved

For Bug #1, we'll verify that NEXT_REDIRECT errors appear in logs on unfixed code, then disappear after the fix while genuine errors still get logged.

For Bug #2, we'll verify that 30-second timeout causes failures on unfixed code, then succeeds after increasing to 120 seconds.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing fixes. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

#### Bug #1 Exploratory Tests

**Test Plan**: Create test cases that trigger `redirect()` in `createCampaignFromBrief` and capture console output. Run on UNFIXED code to observe NEXT_REDIRECT being logged as error.

**Test Cases**:
1. **Successful Campaign Creation with Redirect**: Submit valid campaign form → Pipeline starts → `redirect()` called → Capture console.error calls → Assert "NEXT_REDIRECT" appears in error logs (will fail on unfixed code showing the bug)
2. **Redirect with Genuine Error**: Simulate database error before redirect → Capture both errors → Assert both genuine error AND NEXT_REDIRECT appear in logs (will fail on unfixed code showing log pollution)
3. **Redirect Error Log Format**: Trigger redirect → Capture exact log message → Assert it contains "createCampaignFromBrief error: Error: NEXT_REDIRECT" (will fail on unfixed code confirming the bug)

**Expected Counterexamples**:
- Console output contains "createCampaignFromBrief error: Error: NEXT_REDIRECT" even on successful redirects
- Developers see false error signals that obscure genuine errors
- Possible causes: Error logging happens before NEXT_REDIRECT check (confirmed by line 213 vs line 234)

#### Bug #2 Exploratory Tests

**Test Plan**: Mock the Product Analyst LLM call to simulate different response times. Run on UNFIXED code with 30-second timeout to observe failures.

**Test Cases**:
1. **35-Second LLM Response**: Mock LLM to take 35 seconds → Invoke Product Analyst → Assert timeout error thrown at 30 seconds (will fail on unfixed code showing the bug)
2. **60-Second LLM Response**: Mock LLM to take 60 seconds → Invoke Product Analyst → Assert timeout error thrown at 30 seconds (will fail on unfixed code showing typical failure)
3. **90-Second LLM Response**: Mock LLM to take 90 seconds → Invoke Product Analyst → Assert timeout error thrown at 30 seconds (will fail on unfixed code showing complex brief failure)
4. **Pipeline Failure Impact**: Trigger 40-second LLM call → Assert pipeline fails → Assert campaign status = 'error' → Assert no Strategy record created (will fail on unfixed code showing impact)

**Expected Counterexamples**:
- Product Analyst consistently times out at 30 seconds for realistic LLM response times
- Pipeline execution fails completely when timeout occurs
- No product intelligence is generated, making core feature non-functional
- Possible causes: 30-second timeout is insufficient for LLM analysis (confirmed by empirical observation)

### Fix Checking

#### Bug #1 Fix Checking

**Goal**: Verify that NEXT_REDIRECT errors are NOT logged after the fix.

**Pseudocode:**
```
FOR ALL execution WHERE redirect() is called successfully DO
  consoleOutput := captureConsoleError()
  ASSERT "NEXT_REDIRECT" NOT IN consoleOutput
  ASSERT redirect executes successfully
END FOR
```

**Property-Based Test Strategy**: Generate various campaign form inputs that trigger successful redirects, capture console output, and verify NEXT_REDIRECT never appears in error logs.

#### Bug #2 Fix Checking

**Goal**: Verify that Product Analyst completes successfully with 120-second timeout for realistic LLM response times.

**Pseudocode:**
```
FOR ALL llmResponseTime WHERE 30 < llmResponseTime <= 120 DO
  result := invokeProductAnalyst(mockLLMWithDuration(llmResponseTime))
  ASSERT result.success = true
  ASSERT result contains ProductIntelligence
  ASSERT no timeout error thrown
END FOR
```

**Property-Based Test Strategy**: Generate random LLM response times between 30-120 seconds, verify Product Analyst completes successfully for all times in this range.

### Preservation Checking

**Goal**: Verify that all existing error handling, timeout mechanisms, and pipeline orchestration remain unchanged for inputs that don't involve NEXT_REDIRECT or Product Analyst timeout.

**Pseudocode:**
```
FOR ALL error WHERE error IS NOT NEXT_REDIRECT DO
  logOutputFixed := captureErrorLog_fixed(error)
  logOutputOriginal := captureErrorLog_original(error)
  ASSERT logOutputFixed = logOutputOriginal
END FOR

FOR ALL agent WHERE agent IS NOT ProductAnalyst DO
  timeoutBehaviorFixed := testTimeoutBehavior_fixed(agent)
  timeoutBehaviorOriginal := testTimeoutBehavior_original(agent)
  ASSERT timeoutBehaviorFixed = timeoutBehaviorOriginal
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the error and agent input domains
- It catches edge cases that manual unit tests might miss (e.g., different error types, different agent configurations)
- It provides strong guarantees that behavior is unchanged for all non-buggy scenarios

**Test Plan**: Observe behavior on UNFIXED code first for various error types and agent executions, then write property-based tests capturing that behavior.

**Test Cases**:

**Error Handling Preservation:**
1. **Database Error Preservation**: Simulate database connection failure → Observe error logged on unfixed code → Write test verifying same logging occurs after fix → Assert error appears in logs with same format
2. **Zod Validation Error Preservation**: Submit invalid campaign form → Observe field errors returned on unfixed code → Write test verifying same field errors after fix → Assert validation logic unchanged
3. **NEXT_REDIRECT Re-throw Preservation**: Trigger redirect → Observe error re-thrown on unfixed code (line 235) → Write test verifying re-throw still occurs after fix → Assert Next.js receives redirect error

**Timeout Mechanism Preservation:**
4. **Other Agent Timeout Preservation**: Mock Positioning Strategist to exceed its timeout → Observe timeout error on unfixed code → Write test verifying same timeout behavior after fix → Assert other agents unaffected by Product Analyst timeout change
5. **Timeout Error Handling Preservation**: Trigger any agent timeout → Observe campaign status updated to 'error' on unfixed code → Write test verifying same status update after fix → Assert timeout error handling unchanged
6. **Product Analyst Timeout Protection**: Mock LLM to take 130 seconds → Verify timeout error thrown at 120 seconds after fix → Assert timeout mechanism still provides protection (not indefinite wait)

**Pipeline Orchestration Preservation:**
7. **Strategy Record Creation Preservation**: Complete Product Analyst successfully → Observe Strategy record created on unfixed code (when it completes within 30s) → Write test verifying same record creation after fix → Assert database operations unchanged
8. **Progress Logging Preservation**: Execute pipeline stages → Observe progress logs with metadata on unfixed code → Write test verifying same logs after fix → Assert logging format and content unchanged
9. **Asynchronous Execution Preservation**: Start pipeline → Observe redirect occurs immediately on unfixed code → Write test verifying same async behavior after fix → Assert pipeline runs in background while redirect happens

### Unit Tests

**Bug #1 Unit Tests:**
- Test NEXT_REDIRECT detection logic (checking `digest` property)
- Test that genuine errors (database, validation) are still logged
- Test that NEXT_REDIRECT is re-thrown without logging
- Test console.error is NOT called when NEXT_REDIRECT detected

**Bug #2 Unit Tests:**
- Test Product Analyst with mocked 45-second LLM response succeeds
- Test Product Analyst with mocked 90-second LLM response succeeds
- Test Product Analyst with mocked 125-second LLM response times out at 120 seconds
- Test orchestrator timeout matches agent timeout (both 120 seconds)

**Preservation Unit Tests:**
- Test Zod validation errors produce field-specific error messages
- Test database errors are logged and returned appropriately
- Test Positioning Strategist timeout remains at its original value
- Test Campaign Builder timeout remains at its original value
- Test Strategy record creation includes all required fields

### Property-Based Tests

**Bug #1 Property-Based Tests:**
- Generate random valid campaign form inputs → Submit → Assert NEXT_REDIRECT not in logs
- Generate random error types (database, network, validation) → Assert all logged correctly
- Generate random combinations of errors and redirects → Assert only genuine errors logged

**Bug #2 Property-Based Tests:**
- Generate random LLM response times between 30-120 seconds → Assert Product Analyst succeeds for all
- Generate random product brief complexity levels → Assert intelligence generation completes
- Generate random LLM response times above 120 seconds → Assert timeout protection still works

**Preservation Property-Based Tests:**
- Generate random agent types and timeout scenarios → Assert non-Product-Analyst agents unchanged
- Generate random error scenarios → Assert error handling unchanged for non-NEXT_REDIRECT errors
- Generate random pipeline execution paths → Assert orchestration logic unchanged

### Integration Tests

**Bug #1 Integration Tests:**
- Test full campaign creation flow → Submit form → Pipeline starts → Redirect occurs → Verify no NEXT_REDIRECT in console → Verify user lands on dashboard
- Test campaign creation with database error → Verify genuine error logged → Verify redirect does not occur → Verify error response returned
- Test multiple concurrent campaign creations → Verify NEXT_REDIRECT logs don't pollute console for any execution

**Bug #2 Integration Tests:**
- Test full pipeline flow with realistic product brief → Verify Product Analyst completes → Verify Strategy record created → Verify subsequent stages execute → Verify campaign status progresses through all stages
- Test pipeline with complex product brief (large description, many features) → Verify 120-second timeout is sufficient → Verify intelligence generation completes
- Test pipeline resilience → Mock Product Analyst to take 115 seconds → Verify completes successfully → Mock to take 125 seconds → Verify timeout error occurs → Verify campaign status = 'error'

**Preservation Integration Tests:**
- Test complete pipeline with all agents → Verify all stages execute in order → Verify all status transitions occur → Verify all database records created → Verify no regression in any stage
- Test error handling across pipeline → Inject errors at different stages → Verify error handling unchanged → Verify campaign status updates appropriately
- Test concurrent pipeline executions → Verify multiple campaigns can be created simultaneously → Verify timeout fixes don't affect concurrency
