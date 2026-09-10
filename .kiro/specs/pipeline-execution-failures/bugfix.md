# Bugfix Requirements Document

## Introduction

This document addresses two critical bugs in the campaign creation pipeline that impact developer experience and core feature functionality:

1. **Misleading Redirect Error Logging**: The `NEXT_REDIRECT` error is logged as an error at line 213 of `src/actions/campaign.ts` even though it represents expected Next.js redirect behavior, creating false error signals.

2. **Product Analyst Agent Timeout**: The Product Analyst agent consistently times out after 30 seconds (configured at `src/lib/pipeline/orchestrator.ts:230` and `src/lib/pipeline/agents/product-analyst.ts:138`), causing the entire pipeline execution to fail and preventing campaign intelligence generation - a core feature of the application.

**Impact**: 
- Bug #1 creates misleading logs that obscure real errors
- Bug #2 completely blocks campaign intelligence generation, making the core feature non-functional

## Bug Analysis

### Current Behavior (Defect)

#### Bug #1: Misleading Redirect Error Logging

1.1 WHEN `redirect()` is called at line 211 in `src/actions/campaign.ts` THEN the system logs "createCampaignFromBrief error: Error: NEXT_REDIRECT" at line 213, treating expected redirect behavior as an error

1.2 WHEN the redirect executes successfully and the user navigates to the campaign dashboard THEN the error log remains in the console, creating false error signals for developers

#### Bug #2: Product Analyst Agent Timeout

1.3 WHEN the Product Analyst agent is invoked with a 30-second timeout (at `src/lib/pipeline/orchestrator.ts:230` and `src/lib/pipeline/agents/product-analyst.ts:138`) THEN the system throws "Product Analyst agent exceeded 30 second timeout" error before the LLM completes its analysis

1.4 WHEN the timeout error is thrown THEN the entire pipeline execution fails, campaign status is set to 'error', and no product intelligence is generated

1.5 WHEN the pipeline fails due to timeout THEN the campaign dashboard shows an error state and the core feature (intelligence generation) is non-functional

### Expected Behavior (Correct)

#### Bug #1: Redirect Error Logging

2.1 WHEN `redirect()` is called at line 211 in `src/actions/campaign.ts` THEN the system SHALL NOT log it as an error, recognizing NEXT_REDIRECT as expected Next.js framework behavior

2.2 WHEN the redirect executes successfully THEN the system SHALL only log informational messages (e.g., "Pipeline started - redirecting to campaign dashboard") without error-level logging

#### Bug #2: Product Analyst Agent Timeout

2.3 WHEN the Product Analyst agent is invoked THEN the system SHALL allow sufficient time (e.g., 90-120 seconds) for LLM-based competitive intelligence analysis to complete

2.4 WHEN the LLM completes its analysis within the configured timeout THEN the pipeline SHALL proceed to the next stage successfully, creating the Strategy record with product intelligence

2.5 WHEN product intelligence is generated successfully THEN the campaign status SHALL be updated to 'intelligence_complete' and the campaign dashboard SHALL display the intelligence data

### Unchanged Behavior (Regression Prevention)

#### Error Handling Preservation

3.1 WHEN a genuine error occurs (e.g., database failure, validation error) in `createCampaignFromBrief` THEN the system SHALL CONTINUE TO log it as an error and return appropriate error responses

3.2 WHEN a Zod validation error occurs THEN the system SHALL CONTINUE TO handle it by extracting field errors and returning them in the response

3.3 WHEN the catch block identifies a NEXT_REDIRECT error by checking the 'digest' property THEN the system SHALL CONTINUE TO re-throw it so Next.js can handle the redirect

#### Timeout Mechanism Preservation

3.4 WHEN any agent operation takes longer than its configured timeout THEN the system SHALL CONTINUE TO throw a timeout error to prevent indefinite waiting

3.5 WHEN a timeout occurs for any reason THEN the system SHALL CONTINUE TO update the campaign status to 'error' and include error details in the database

3.6 WHEN other agents (Positioning Strategist, Campaign Builder, etc.) execute within their timeout limits THEN the system SHALL CONTINUE TO process them successfully without modification

#### Pipeline Orchestration Preservation

3.7 WHEN the Product Analyst completes successfully THEN the system SHALL CONTINUE TO create a Strategy record with the product intelligence, empty positioning object, and empty messaging angles array

3.8 WHEN pipeline stages complete THEN the system SHALL CONTINUE TO log progress messages with token usage and execution time metadata

3.9 WHEN the pipeline is executed asynchronously THEN the system SHALL CONTINUE TO allow the redirect to occur immediately while pipeline processing continues in the background
