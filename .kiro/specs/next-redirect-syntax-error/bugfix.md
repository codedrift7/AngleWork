# Bugfix Requirements Document

## Introduction

This document addresses a syntax error in the `createCampaignFromBrief` server action that prevents the Next.js `redirect()` function from executing properly. The bug causes the `NEXT_REDIRECT` error to be caught and logged by the catch block instead of being re-thrown to Next.js for proper redirect handling. This occurs due to incorrect use of template literal backticks instead of parentheses in the redirect function call at line 211 of `src/actions/campaign.ts`.

**Impact:** Campaign creation succeeds, but the redirect is improperly handled, resulting in error logs even though the redirect appears to work. This also interferes with the existing error handling logic designed to properly re-throw `NEXT_REDIRECT` errors.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the `createCampaignFromBrief` action completes successfully and reaches line 211 THEN the system logs "NEXT_REDIRECT" as an error in the catch block due to syntax error in the redirect call

1.2 WHEN the redirect function is called with backtick syntax `redirect(\`/campaign/${campaign.id}\`)` THEN the system produces malformed output that causes the redirect to be caught as an error instead of being properly thrown

### Expected Behavior (Correct)

2.1 WHEN the `createCampaignFromBrief` action completes successfully and reaches line 211 THEN the system SHALL call `redirect()` with proper parenthesis syntax `redirect(`/campaign/${campaign.id}`)` and throw a `NEXT_REDIRECT` error that is caught and re-thrown by the existing error handling code (lines 232-235)

2.2 WHEN the redirect function throws a `NEXT_REDIRECT` error THEN the system SHALL detect it in the catch block via the digest property check and re-throw it to Next.js without logging it as an error

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the `createCampaignFromBrief` action encounters a Zod validation error THEN the system SHALL CONTINUE TO return a validation error response with field-specific error messages

3.2 WHEN the `createCampaignFromBrief` action encounters a non-redirect error (errors without a digest property) THEN the system SHALL CONTINUE TO return an error response with an appropriate error message

3.3 WHEN the redirect error is properly re-thrown THEN the system SHALL CONTINUE TO successfully redirect the user to `/campaign/{campaignId}` as designed

3.4 WHEN campaign creation and database transactions succeed THEN the system SHALL CONTINUE TO create Campaign and ProductBrief records correctly before the redirect occurs

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type RedirectCall
  OUTPUT: boolean
  
  // Returns true when redirect uses backtick syntax instead of parentheses
  RETURN X.syntax = "backtick" AND X.functionName = "redirect"
END FUNCTION
```

### Property Specification: Fix Checking

```pascal
// Property: Fix Checking - Correct Redirect Syntax
FOR ALL X WHERE isBugCondition(X) DO
  result ← redirect'(X.url)
  ASSERT X.syntax = "parenthesis" 
    AND throwsNextRedirect(result) 
    AND isCaughtAndRethrown(result)
    AND NOT isLoggedAsError(result)
END FOR
```

**Key Definitions:**
- **redirect**: The original redirect call with backtick syntax (buggy code)
- **redirect'**: The fixed redirect call with proper parenthesis syntax
- **throwsNextRedirect**: Verifies the redirect throws a NEXT_REDIRECT error
- **isCaughtAndRethrown**: Verifies the error is caught by the catch block and re-thrown without modification
- **isLoggedAsError**: Verifies the redirect is NOT logged as an error in the console

### Property Specification: Preservation Checking

```pascal
// Property: Preservation Checking - Other Error Handling Unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT errorHandling(X) = errorHandling'(X)
END FOR
```

This ensures that:
- Zod validation errors continue to return structured error responses
- Non-redirect errors continue to return appropriate error messages
- The redirect destination and campaign creation logic remain unchanged
