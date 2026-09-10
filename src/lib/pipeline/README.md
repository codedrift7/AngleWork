# Pipeline Orchestrator

The pipeline orchestrator coordinates the sequential execution of all six AI agents that transform a Product Brief into a complete marketing campaign.

## Architecture

The pipeline consists of two main phases:

### Phase 1: Initial Pipeline (Auto-executes)
1. **Product Analyst** → Generates Product Intelligence
2. **Positioning Strategist** → Generates Positioning + 3 Messaging Angles
3. **Pause for User Selection** → User selects one messaging angle

### Phase 2: Resumed Pipeline (After user selects angle)
4. **AIDA Strategist** → Generates AIDA Strategy based on selected angle
5. **Campaign Builder** → Generates all channel assets (LinkedIn, Email, Landing Page, Ads)
6. **Campaign Critic** → Scores and critiques campaign quality
7. **Launch Calendar** → Generates 7-day execution plan

## Key Functions

### `runCampaignPipeline(campaignId, productBrief)`
Starts the initial pipeline from Product Brief through Positioning Strategy. Automatically pauses after user selects messaging angle.

```typescript
await runCampaignPipeline('campaign-id', productBriefData)
// Pipeline executes Stage 1-2, then pauses
```

### `resumePipelineAfterAngleSelection(campaignId, selectedAngleIndex)`
Resumes the pipeline after user has selected a messaging angle. Executes stages 3-6 to completion.

```typescript
await resumePipelineAfterAngleSelection('campaign-id', 1) // Selects angle at index 1
// Pipeline executes Stage 3-6 to completion
```

### `updateCampaignStatus(campaignId, status)`
Helper function to update campaign status with timestamp tracking.

```typescript
await updateCampaignStatus('campaign-id', 'intelligence_complete')
```

### `handlePipelineError(campaignId, error, stage?)`
Handles pipeline errors by updating campaign status to 'error' and logging details.

```typescript
await handlePipelineError('campaign-id', error, 'product_analyst')
```

### `createPipelineError(message, stage?, campaignId?, retryable?)`
Creates a structured pipeline error with metadata.

```typescript
const error = createPipelineError(
  'Agent timeout',
  'product_analyst',
  'campaign-id',
  true
)
```

### `validateCampaignStatus(campaignId, expectedStatus)`
Validates that a campaign is in the expected status before proceeding.

```typescript
await validateCampaignStatus('campaign-id', 'positioning_complete')
```

### `checkPipelineResumability(campaignId)`
Checks if a campaign can be resumed from its current state.

```typescript
const { canResume, currentStatus, reason } = await checkPipelineResumability('campaign-id')
```

## Campaign Status Flow

```
draft
  ↓
intelligence_in_progress
  ↓
intelligence_complete
  ↓
positioning_in_progress
  ↓
positioning_complete
  ↓ (user selects angle)
aida_in_progress
  ↓
aida_complete
  ↓
assets_in_progress
  ↓
assets_complete
  ↓
critique_in_progress
  ↓
critique_complete
  ↓
calendar_in_progress
  ↓
complete
```

Error states:
- `error` - Pipeline encountered an error (can be resumed)

## Error Handling

The orchestrator implements comprehensive error handling:

1. **Stage-level errors** - Each stage is wrapped in try-catch
2. **Status tracking** - Campaign status updates to 'error' on failure
3. **Error metadata** - Errors include stage, campaign ID, and retryability flag
4. **Graceful degradation** - Failed status updates don't crash the pipeline
5. **Logging** - All errors are logged with full context

## Database Commits

Each pipeline stage commits its output to the database before proceeding to the next stage. This enables:

- **Resumption** - Pipeline can resume from last successful stage after failure
- **Visibility** - User can see partial results even if pipeline fails
- **Debugging** - Each stage's output is persisted for inspection

## Integration with AI Agents

The orchestrator has placeholder comments for AI agent integration:

```typescript
// TODO: Call productAnalystAgent when implemented in task 3.1
// const productIntelligence = await productAnalystAgent({
//   data: productBrief,
//   campaignId
// })
```

These placeholders will be replaced with actual agent calls as agents are implemented in subsequent tasks.

## Implementation Status

✅ **Completed** (Task 2.3)
- Campaign status update helper
- Error handling with campaign status tracking
- Structure for sequential agent execution
- Pipeline resumption logic
- Status validation utilities

⏳ **Pending** (Future tasks)
- Agent 1: Product Analyst (Task 3.1)
- Agent 2: Positioning Strategist (Task 4.1)
- Agent 3: AIDA Strategist (Task 5.1)
- Agent 4: Campaign Builder (Tasks 6.1, 7.1, 8.1, 9.1)
- Agent 5: Campaign Critic (Task 10.1)
- Agent 6: Launch Calendar (Task 11.1)

## Testing

Run verification script:
```bash
npx tsx src/lib/pipeline/verify-orchestrator.ts
```

This verifies:
- Error creation with metadata
- Module exports are correct
- All required functions are available
