# AI Agents for Anglework Pipeline

This directory contains the AI agents that power the Anglework campaign generation pipeline. Each agent is responsible for a specific stage of the campaign creation process.

## Agent Architecture

All agents follow a consistent pattern:

```typescript
export interface AgentInput {
  data: InputType
  campaignId: string
}

export interface AgentOutput {
  result: OutputType
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

export async function agentFunction(input: AgentInput): Promise<AgentOutput>
```

### Key Features

- **Structured Output**: All agents use Zod schemas for validation
- **Timeout Protection**: 30-second timeout enforced per requirements
- **Retry Logic**: Exponential backoff with 3 retry attempts
- **Type Safety**: Full TypeScript type checking throughout

## Implemented Agents

### 1. Product Analyst Agent (`product-analyst.ts`)

**Purpose**: Extract structured product intelligence from the raw Product_Brief.

**Requirements**: 2.1, 2.2, 2.3, 2.4, 2.6

**Input**: `ProductBriefData`

**Output**: `ProductIntelligence`

**Key Responsibilities**:
- Analyze target customer to define ICP
- Extract core problem and express primary pain in customer language (first-person, 5-30 words)
- Identify desired outcome
- Formulate core promise
- Extract 1-5 differentiators
- Derive 2-5 objections based on category and differentiators
- Identify emotional drivers
- Recommend messaging angle (pain, outcome, or time)
- Insert placeholders for missing proof

**Critical Rules**:
1. Primary pain MUST be in first-person customer language (5-30 words)
   - ✅ Good: "I don't know where my money is really going"
   - ❌ Bad: "lack of financial visibility"
2. Derive 2-5 objections from product category and differentiators
3. Never fabricate testimonials or proof - use placeholders
4. Recommended messaging angle must be one of: pain, outcome, time

**Usage Example**:

```typescript
import { productAnalystAgent } from '@/lib/pipeline/agents'

const result = await productAnalystAgent({
  data: productBriefData,
  campaignId: 'campaign-123'
})

console.log(result.result.primaryPain) // "I don't know where my money is really going"
console.log(result.result.recommendedMessagingAngle) // "pain"
console.log(result.metadata.tokensUsed) // 1500
```

**Validation**:
- Primary pain: 5-200 characters
- ICP: 10-500 characters
- Core problem: 10-500 characters
- Desired outcome: 10-300 characters
- Core promise: 10-300 characters
- Differentiators: 1-5 items
- Emotional drivers: 1-5 items
- Objections: 2-5 items
- Messaging angle: must be "pain", "outcome", or "time"

### 6. Launch Calendar Agent (`launch-calendar.ts`)

**Purpose**: Create a 7-day execution plan sequencing campaign assets into daily actions.

**Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7

**Input**: `{ assets: Asset[], aidaStrategy: AidaStrategy }`

**Output**: `LaunchCalendar`

**Key Responsibilities**:
- Generate exactly 7 days of launch activities
- Assign assets to AIDA stage windows: Attention (Day 1-2), Interest (Day 3-4), Desire (Day 5-6), Action (Day 7)
- Format all actions as imperatives (e.g., "Publish LinkedIn post", "Send email")
- Limit to max 3 actions per day
- Schedule landing page finalization on Day 1 as first action
- Use relative timing (Day 1, Day 2, etc.) not specific dates
- Handle overflow (>21 assets) with warning

**Critical Rules**:
1. EXACTLY 7 days - no more, no less
2. Stage windows (strict assignment):
   - Attention: Day 1 OR Day 2
   - Interest: Day 3 OR Day 4
   - Desire: Day 5 OR Day 6
   - Action: Day 7
3. Landing page MUST be Day 1, first action (if exists)
4. Max 3 actions per day
5. All actions as imperatives:
   - ✅ Good: "Publish Attention LinkedIn post", "Send Interest email"
   - ❌ Bad: "LinkedIn post will be published", "You should send email"
6. Use ONLY relative timing: "Day 1", "Day 2", etc.
   - ❌ Never use specific dates: "January 15", "2024-01-15"

**Usage Example**:

```typescript
import { launchCalendarAgent } from '@/lib/pipeline/agents'

const result = await launchCalendarAgent({
  data: {
    assets: campaignAssets,
    aidaStrategy: aidaStrategy
  },
  campaignId: 'campaign-123'
})

console.log(result.result.days.length) // 7
console.log(result.result.days[0].date) // "Day 1"
console.log(result.result.days[0].actions[0].action) // "Finalize landing page copy"
```

**Validation**:
- Days array: exactly 7 elements
- Each day:
  - dayNumber: 1-7
  - date: optional string (e.g., "Day 1")
  - actions: 1-3 action objects
- Each action:
  - action: string (imperative command)
  - assetId: optional string
  - stage: optional "attention" | "interest" | "desire" | "action"

## Future Agents

The following agents will be implemented in subsequent tasks:

### 2. Positioning Strategist Agent (Task 4.1)
- Generate positioning statement and value proposition
- Create 3 distinct messaging angles (pain, outcome, time)
- Requirements: 3.1, 3.2, 3.4, 3.6

### 3. AIDA Strategist Agent (Task 5.1)
- Build product-specific AIDA strategy
- Generate 4 stages: Attention, Interest, Desire, Action
- Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8

### 4. Campaign Builder Agent (Task 6.1, 7.1, 8.1, 9.1)
- Generate all channel-specific campaign assets
- LinkedIn posts, emails, landing pages, ads
- Requirements: 5.1-5.10

### 5. Campaign Critic Agent (Task 10.1)
- Score and critique campaign quality
- Identify weaknesses and provide recommendations
- Requirements: 6.1-6.8

## Testing

### Unit Tests
Located in `__tests__/` directory. Run with your test framework.

### Manual Testing
Use the verification scripts in the project root:

```bash
# Verify implementation structure
npx tsx verify-product-analyst.mjs

# Test with actual API calls
npx tsx --env-file=.env.local test-product-analyst.mjs
```

## Error Handling

All agents handle errors consistently:

1. **Timeout Errors**: 30-second timeout enforced
2. **Validation Errors**: Zod schema validation with detailed messages
3. **API Errors**: Retry with exponential backoff (1s, 2s, 4s)
4. **Network Errors**: Detailed error messages with retry count

## Performance Considerations

- Average execution time: 5-15 seconds per agent
- Token usage: 1000-3000 tokens per agent call
- Timeout: 30 seconds maximum per requirements
- Retries: Up to 3 attempts with exponential backoff

## Development Guidelines

When implementing new agents:

1. Follow the standard `AgentInput` and `AgentOutput` interface pattern
2. Define a Zod schema for the output in `src/lib/types/campaign.ts`
3. Use `callLLMWithStructuredOutput` for API calls
4. Wrap calls with `withTimeout(promise, 30000, errorMessage)`
5. Include comprehensive system prompts with examples
6. Handle optional fields gracefully in the user prompt
7. Write unit tests in the `__tests__/` directory
8. Document the agent in this README

## Environment Variables

Required for all agents:

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_MODEL`: Model to use (default: `nvidia/nemotron-3-super-120b-a12b:free`)

## References

- Design Document: `f:\anglework\.kiro\specs\anglework-mvp\design.md`
- Requirements: `f:\anglework\.kiro\specs\anglework-mvp\requirements.md`
- Tasks: `f:\anglework\.kiro\specs\anglework-mvp\tasks.md`
