# Bug #2 Counterexamples - Product Analyst Timeout

## Bug Confirmation Summary

**Test Date**: Task 2 execution
**Test File**: `src/lib/pipeline/agents/__tests__/product-analyst-timeout-bug.test.ts`
**Bug Status**: ✅ **CONFIRMED** - The bug exists on unfixed code

## Counterexamples Found

The bug condition exploration tests successfully demonstrated that the 30-second timeout is insufficient for realistic LLM response times. All tests that expect the agent to complete successfully FAILED on unfixed code, confirming the bug exists.

### Counterexample 1: 35-Second LLM Response
**Test**: "should complete successfully when LLM takes 35 seconds"
**Result on Unfixed Code**: ❌ **FAILED** (as expected - confirms bug)
**Error Message**: `Product Analyst agent exceeded 30 second timeout`
**Actual Duration**: ~30 seconds (timed out before LLM could complete at 35s)
**Impact**: Agent that would complete in 35 seconds is prematurely terminated

### Counterexample 2: 45-Second LLM Response
**Test**: "should complete successfully when LLM takes 45 seconds"
**Result on Unfixed Code**: ❌ **FAILED** (as expected - confirms bug)
**Error Message**: `Product Analyst agent exceeded 30 second timeout`
**Actual Duration**: ~30 seconds (timed out at configured limit)
**Impact**: Typical product brief analysis is blocked - this is a common scenario

### Counterexample 3: 60-Second LLM Response
**Test**: "should complete successfully when LLM takes 60 seconds"
**Result on Unfixed Code**: ❌ **FAILED** (as expected - confirms bug)
**Error Message**: `Product Analyst agent exceeded 30 second timeout`
**Actual Duration**: ~30 seconds (timed out well before completion)
**Impact**: Comprehensive product intelligence analysis is impossible

### Counterexample 4: 90-Second LLM Response
**Test**: "should complete successfully when LLM takes 90 seconds"
**Result on Unfixed Code**: ❌ **FAILED** (as expected - confirms bug)
**Error Message**: `Product Analyst agent exceeded 30 second timeout`
**Actual Duration**: ~30 seconds (timed out at 1/3 of needed time)
**Impact**: Complex product briefs with detailed competitive analysis cannot complete

### Verification: Timeout Error Message
**Test**: "should throw timeout error with correct message when LLM exceeds 30 seconds"
**Result on Unfixed Code**: ✅ **PASSED** (confirms expected error message)
**Error Message**: `Product Analyst agent exceeded 30 second timeout`
**Purpose**: Validates that the timeout error message is correct and the bug manifests as documented

## Bug Condition Analysis

The bug manifests exactly as described in the requirements:

1. **isBugCondition2 is TRUE**: For any LLM response time between 30-120 seconds:
   - `agentExecution.actualDuration > 30000 milliseconds` ✅ (35s, 45s, 60s, 90s all exceed 30s)
   - `agentExecution.actualDuration <= 120000 milliseconds` ✅ (all test cases are within this range)
   - `agentExecution.operation IS LLM_API_call` ✅ (all tests mock LLM calls)
   - `timeout IS configured at 30000 milliseconds` ✅ (confirmed in product-analyst.ts:138)

2. **Impact Confirmed**: 
   - Pipeline execution fails completely when timeout occurs
   - Campaign status would be set to 'error' (not tested in this unit test, but documented in orchestrator)
   - No product intelligence is generated, making the core feature non-functional

## Root Cause Confirmation

The tests confirm the hypothesized root cause:

1. **Insufficient Timeout Duration**: The 30-second timeout is demonstrably too short for LLM-based competitive intelligence analysis. Even the smallest test case (35 seconds) fails.

2. **Realistic LLM Response Times**: The test cases (35s, 45s, 60s, 90s) represent realistic OpenRouter API response times for structured output generation with competitive intelligence analysis.

3. **Dual Configuration Points**: The timeout is configured at two locations:
   - `src/lib/pipeline/orchestrator.ts:230`: 30000ms
   - `src/lib/pipeline/agents/product-analyst.ts:138`: 30000ms (confirmed by test failure)

## Expected Behavior After Fix

When the fix is implemented (increasing timeout to 120 seconds):

- **Test 1 (35s)**: Should PASS - agent completes successfully
- **Test 2 (45s)**: Should PASS - agent completes successfully
- **Test 3 (60s)**: Should PASS - agent completes successfully
- **Test 4 (90s)**: Should PASS - agent completes successfully
- **Test 5 (verification)**: Will need adjustment - 35s will no longer timeout with 120s limit

## Next Steps

1. ✅ Task 2 Complete - Bug condition exploration test written and run
2. ⏭️ Task 3 - Write preservation property tests (before implementing fix)
3. ⏭️ Task 5 - Implement the fix (increase timeout to 120 seconds in both locations)
4. ⏭️ Task 5.3 - Re-run these tests to verify they now PASS after fix

## Test Implementation Details

**Test Approach**: 
- Uses REAL `withTimeout` implementation (not mocked) to test actual timeout behavior
- Mocks only the LLM call (`callLLMWithStructuredOutput`) to control response duration
- Uses `setTimeout` to create realistic delayed responses
- Each test has appropriate test timeout configured (40s, 50s, 65s, 95s) to allow completion

**Why This Works**:
- The real `withTimeout` utility creates an actual race between the LLM promise and timeout promise
- When the mocked LLM takes 35+ seconds, the 30-second timeout wins the race
- This accurately simulates the production bug where real LLM calls exceed 30 seconds
