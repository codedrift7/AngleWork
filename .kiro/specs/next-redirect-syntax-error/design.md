# NEXT_REDIRECT Syntax Error Fix Design

## Overview

This design addresses a syntax error in the `createCampaignFromBrief` server action where the `redirect()` function is called with backtick template literal syntax instead of parentheses. This causes the NEXT_REDIRECT error to be caught and logged instead of being properly re-thrown to Next.js for redirect handling. The fix is purely syntactic - changing line 211 from `redirect\`/campaign/${campaign.id}\`` to `redirect(/campaign/${campaign.id})`. The existing error handling logic (lines 232-235) already correctly detects and re-throws NEXT_REDIRECT errors, so no additional logic changes are needed.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the redirect function is called with backtick syntax instead of parentheses
- **Property (P)**: The desired behavior when redirect is called - it should use parenthesis syntax and throw a NEXT_REDIRECT error that gets caught and re-thrown
- **Preservation**: Existing error handling for Zod validation errors and non-redirect errors must remain unchanged
- **NEXT_REDIRECT**: A special error thrown by Next.js's `redirect()` function that signals to the framework to perform a redirect
- **digest property**: A property present on NEXT_REDIRECT errors that the catch block uses to identify and re-throw them
- **createCampaignFromBrief**: The server action function in `src/actions/campaign.ts` that creates a campaign and redirects to its dashboard

## Bug Details

### Bug Condition

The bug manifests when the `redirect()` function is called with template literal backticks instead of parentheses at line 211 of `src/actions/campaign.ts`. The malformed syntax causes the redirect to be caught as an error in the catch block, which then properly re-throws it, but this creates unnecessary error logging and interferes with the intended control flow.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type RedirectCall
  OUTPUT: boolean
  
  RETURN input.syntax == "backtick"
         AND input.functionName == "redirect"
         AND input.lineNumber == 211
         AND NOT input.usesParentheses
END FUNCTION
```

### Examples

- **Current (Buggy)**: `redirect\`/campaign/${campaign.id}\`` - Uses backticks, causes syntax error that gets caught
- **Fixed**: `redirect(\`/campaign/${campaign.id}\`)` or `redirect("/campaign/" + campaign.id)` - Uses parentheses, throws NEXT_REDIRECT properly
- **Test Case 1**: Campaign ID "abc123" should redirect to "/campaign/abc123" without error logging
- **Test Case 2**: Campaign ID "test-campaign-456" should redirect to "/campaign/test-campaign-456" and be caught/re-thrown by digest check

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Zod validation errors must continue to return structured error responses with field-specific error messages
- Non-redirect errors (errors without a digest property) must continue to return appropriate error messages
- The redirect destination pattern `/campaign/${campaign.id}` must remain unchanged
- Campaign and ProductBrief database record creation must continue to work as designed

**Scope:**
All inputs that do NOT involve the redirect call at line 211 should be completely unaffected by this fix. This includes:
- Validation error handling (Zod errors)
- Database transaction errors
- Pipeline initialization errors
- Any other errors thrown before or during campaign creation

## Hypothesized Root Cause

Based on the bug description, the issue is:

1. **Syntax Error**: The redirect function call uses backtick syntax `redirect\`...\`` instead of the correct parentheses syntax `redirect(...)`
   - JavaScript/TypeScript interprets backticks as template literals, not function call syntax
   - This creates malformed code that may produce unexpected behavior

2. **Control Flow Interference**: While the existing error handling correctly identifies and re-throws NEXT_REDIRECT errors (lines 232-235), the malformed syntax causes unnecessary entry into the catch block

3. **Error Logging Side Effect**: The catch block logs all errors before checking if they should be re-thrown, creating misleading error logs for successful redirects

## Correctness Properties

Property 1: Bug Condition - Correct Redirect Syntax

_For any_ redirect call at line 211 where the bug condition holds (using backtick syntax), the fixed function SHALL use parenthesis syntax `redirect(\`/campaign/${campaign.id}\`)`, properly throw a NEXT_REDIRECT error, and have that error caught and re-thrown by the digest check without being logged as a failure.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Error Handling Unchanged

_For any_ error that is NOT a redirect call at line 211 (Zod validation errors, database errors, other exceptions), the fixed code SHALL produce exactly the same error handling behavior as the original code, preserving all existing validation and error response logic.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `src/actions/campaign.ts`

**Function**: `createCampaignFromBrief`

**Line**: 211

**Specific Changes**:
1. **Replace backtick syntax with parentheses**:
   - Current: `redirect\`/campaign/${campaign.id}\``
   - Fixed: `redirect(\`/campaign/${campaign.id}\`)`
   
2. **No other changes needed**: The existing error handling logic (lines 232-235) already correctly detects NEXT_REDIRECT errors via the digest property and re-throws them

**Complete corrected line 211**:
```typescript
redirect(`/campaign/${campaign.id}`)
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, demonstrate the bug exists in the unfixed code by verifying the redirect uses incorrect syntax, then verify the fix uses correct syntax and preserves all existing error handling behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the redirect call uses backtick syntax and causes the redirect error to be caught and logged.

**Test Plan**: Write tests that examine the source code at line 211 to verify it uses backtick syntax. Since this is a syntax error, we'll verify the fix by checking the actual code string rather than runtime behavior (which may work despite the incorrect syntax).

**Test Cases**:
1. **Syntax Verification Test**: Read line 211 of the source file and assert it contains backtick syntax (will fail on fixed code)
2. **Runtime Redirect Test**: Trigger a successful campaign creation and verify the redirect occurs to the correct URL
3. **Error Logging Test**: Monitor console logs during successful redirect to see if NEXT_REDIRECT is logged as an error (will show logging on unfixed code)

**Expected Counterexamples**:
- Line 211 contains `redirect\`` instead of `redirect(`
- Console logs show "NEXT_REDIRECT" being logged during successful campaign creation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (redirect calls at line 211), the fixed function uses correct parenthesis syntax.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := redirect_fixed(input.campaignId)
  ASSERT usesParenthesisSyntax(result)
  ASSERT throwsNextRedirect(result)
  ASSERT isCaughtAndRethrown(result)
  ASSERT NOT isLoggedAsError(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (non-redirect errors), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleError_original(input) = handleError_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the error input domain
- It catches edge cases in error handling that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-redirect errors

**Test Plan**: Observe error handling behavior on UNFIXED code for various error types, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Zod Validation Preservation**: Verify validation errors continue to return structured field errors
2. **Database Error Preservation**: Verify database errors return appropriate error messages
3. **Pipeline Error Preservation**: Verify pipeline initialization errors are handled correctly
4. **Redirect Destination Preservation**: Verify the redirect URL pattern remains `/campaign/${campaign.id}`

### Unit Tests

- Test that line 211 uses correct parenthesis syntax after fix
- Test that successful campaign creation redirects to the correct URL
- Test that NEXT_REDIRECT errors are not logged as failures
- Test that Zod validation errors still return field-specific error messages
- Test that non-redirect errors still return appropriate error responses

### Property-Based Tests

- Generate random campaign IDs and verify redirect URL is correctly formatted as `/campaign/${id}`
- Generate random error objects and verify non-NEXT_REDIRECT errors are handled identically before and after fix
- Generate random validation errors and verify they continue to produce structured field error responses

### Integration Tests

- Test full campaign creation flow with valid data results in redirect to campaign dashboard
- Test campaign creation with invalid data results in validation error (no redirect)
- Test that console logs do not show NEXT_REDIRECT errors during successful campaign creation after fix
