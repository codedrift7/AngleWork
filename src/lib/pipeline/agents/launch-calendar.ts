/**
 * Launch Calendar Generator AI Agent
 * 
 * Creates a 7-day execution plan sequencing campaign assets into daily actions.
 * 
 * Responsibilities:
 * - Generate exactly 7 days of launch activities
 * - Assign assets to AIDA stage windows: Attention (Day 1-2), Interest (Day 3-4), Desire (Day 5-6), Action (Day 7)
 * - Format all actions as imperatives (e.g., "Publish LinkedIn post", "Send email")
 * - Limit to max 3 actions per day
 * - Schedule landing page finalization on Day 1 as first action
 * - Use relative timing (Day 1, Day 2, etc.) not specific dates
 * - Handle overflow (>21 assets) with warning
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7
 */

import { callLLMWithStructuredOutput, withTimeout } from '@/lib/ai/llm-client'
import { LaunchCalendar, LaunchCalendarSchema, AidaStrategy } from '@/lib/types/campaign'

export interface LaunchCalendarInput {
  data: {
    assets: Array<{
      id: string
      channel: string
      stage: string
      assetType: string
      title?: string | null
    }>
    aidaStrategy: AidaStrategy
  }
  campaignId: string
}

export interface LaunchCalendarOutput {
  result: LaunchCalendar
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Launch Calendar Generator AI Agent
 * 
 * Generates a 7-day launch calendar that sequences campaign assets into
 * concrete daily actions organized by AIDA stage.
 * 
 * @param input - Campaign assets and AIDA strategy
 * @returns 7-day launch calendar with metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function launchCalendarAgent(
  input: LaunchCalendarInput
): Promise<LaunchCalendarOutput> {
  const startTime = Date.now()

  // Organize assets by channel and stage for context
  const assetsByStage = {
    attention: input.data.assets.filter(a => a.stage === 'attention'),
    interest: input.data.assets.filter(a => a.stage === 'interest'),
    desire: input.data.assets.filter(a => a.stage === 'desire'),
    action: input.data.assets.filter(a => a.stage === 'action'),
    'multi-stage': input.data.assets.filter(a => a.stage === 'multi-stage')
  }

  // Find landing page asset
  const landingPageAsset = input.data.assets.find(a => a.channel === 'landing_page')

  const systemPrompt = `You are a launch calendar generator. Your job is to create a 7-day execution plan sequencing campaign assets.

CRITICAL RULES:
1. Generate EXACTLY 7 days (Day 1 through Day 7) - no more, no less
2. Stage windows (strict assignment):
   - Attention stage assets: Day 1 OR Day 2
   - Interest stage assets: Day 3 OR Day 4
   - Desire stage assets: Day 5 OR Day 6
   - Action stage assets: Day 7
   - Multi-stage assets (like landing pages): Can appear on Day 1
3. Landing page finalization MUST be Day 1, first action (if a landing page asset exists)
4. Max 3 actions per day - distribute assets evenly within stage windows
5. If total assets > 21, schedule only the first 21 in AIDA order and note unscheduled assets in the Day 7 actions
6. Use RELATIVE timing only: "Day 1", "Day 2", etc. - NEVER specific calendar dates
7. Format ALL actions as imperatives (commands):
   - Good: "Publish Attention LinkedIn post", "Send Interest email to list", "Launch pain-focused ad campaign"
   - Bad: "LinkedIn post will be published", "You should send the email", "Posting on LinkedIn"
8. If a stage has no assets, compress the calendar - shift remaining stages to fill gaps without exceeding 7 days
9. Each action MUST include the asset ID if it references a specific asset
10. Each action SHOULD include the stage (attention/interest/desire/action) when relevant

STAGE OBJECTIVES (for context):
- Attention: Hook the customer with their pain or a compelling promise
- Interest: Build interest by exploring the problem and why current solutions fail
- Desire: Create desire by showing the transformation and building credibility
- Action: Drive action with clear CTA and friction reducers

OUTPUT FORMAT: Return valid JSON matching this schema:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "Day 1",
      "actions": [
        {
          "action": "Finalize landing page copy",
          "assetId": "asset-id-here",
          "stage": "attention"
        }
      ]
    },
    ... (7 days total)
  ]
}

Each day MUST have:
- dayNumber: integer 1-7
- date: string "Day 1" through "Day 7"
- actions: array of 1-3 action objects, each with:
  - action: string (imperative command)
  - assetId: string (optional, the asset's database ID)
  - stage: string (optional, "attention" | "interest" | "desire" | "action")`

  const assetsList = input.data.assets.map(a => 
    `[${a.channel}/${a.stage}] ${a.title || a.assetType} (ID: ${a.id})`
  ).join('\n')

  const userPrompt = `Generate a 7-day launch calendar for these campaign assets:

TOTAL ASSETS: ${input.data.assets.length}

ASSETS BY STAGE:
- Attention (${assetsByStage.attention.length} assets): ${assetsByStage.attention.map(a => `${a.channel} ${a.assetType} [${a.id}]`).join(', ') || 'none'}
- Interest (${assetsByStage.interest.length} assets): ${assetsByStage.interest.map(a => `${a.channel} ${a.assetType} [${a.id}]`).join(', ') || 'none'}
- Desire (${assetsByStage.desire.length} assets): ${assetsByStage.desire.map(a => `${a.channel} ${a.assetType} [${a.id}]`).join(', ') || 'none'}
- Action (${assetsByStage.action.length} assets): ${assetsByStage.action.map(a => `${a.channel} ${a.assetType} [${a.id}]`).join(', ') || 'none'}
- Multi-stage (${assetsByStage['multi-stage'].length} assets): ${assetsByStage['multi-stage'].map(a => `${a.channel} ${a.assetType} [${a.id}]`).join(', ') || 'none'}

${landingPageAsset ? `LANDING PAGE: ${landingPageAsset.id} (MUST be Day 1, first action)` : 'NO LANDING PAGE'}

ALL ASSETS:
${assetsList}

AIDA STRATEGY CONTEXT:
- Attention objective: ${input.data.aidaStrategy.attention.objective}
- Interest objective: ${input.data.aidaStrategy.interest.objective}
- Desire objective: ${input.data.aidaStrategy.desire.objective}
- Action objective: ${input.data.aidaStrategy.action.objective}

INSTRUCTIONS:
1. Create exactly 7 days labeled "Day 1" through "Day 7"
2. If landing page exists, make "Finalize landing page copy" the FIRST action of Day 1
3. Distribute Attention assets across Day 1-2 (max 3 actions per day)
4. Distribute Interest assets across Day 3-4 (max 3 actions per day)
5. Distribute Desire assets across Day 5-6 (max 3 actions per day)
6. Place Action assets on Day 7
7. Format every action as an imperative command
8. Include assetId for each action that references a specific asset
9. Include stage label when relevant ("attention", "interest", "desire", "action")
${input.data.assets.length > 21 ? '10. WARNING: More than 21 assets detected - schedule first 21 by AIDA priority, note overflow in Day 7' : ''}

Generate the 7-day launch calendar in valid JSON format.`

  // Wrap the LLM call with a 30-second timeout
  const agentCall = callLLMWithStructuredOutput<LaunchCalendar>({
    schema: LaunchCalendarSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    30000, // 30 seconds
    'Launch Calendar agent exceeded 30 second timeout'
  )

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
