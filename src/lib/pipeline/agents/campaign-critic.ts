/**
 * Campaign Critic AI Agent
 * 
 * Scores and critiques the generated campaign, identifies weaknesses, and provides
 * actionable recommendations for improvement.
 * 
 * Responsibilities:
 * - Score each AIDA stage (Attention, Interest, Desire, Action) from 1-10
 * - Score message consistency across all assets (1-10)
 * - Score audience fit across all assets (1-10)
 * - Compute overall score as arithmetic mean of all 6 scores, rounded to 1 decimal
 * - Identify critical stage (lowest score, earliest if tie)
 * - Generate specific recommendation referencing actual product and customer
 * - Include targetAssetIds and suggestedFix in primary recommendation
 * - Insert placeholders for missing benchmark data
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.7
 */

import { callLLMWithStructuredOutput, withTimeout } from '@/lib/ai/llm-client'
import {
  ProductIntelligence,
  ProductBriefData,
  AidaStrategy,
  CampaignAssetOutput,
  Critique,
  CritiqueSchema
} from '@/lib/types/campaign'

export interface CampaignCriticInput {
  data: {
    campaign: {
      id: string
      name: string
      productBrief: ProductBriefData
    }
    aidaStrategy: AidaStrategy
    assets: CampaignAssetOutput[]
    productIntelligence: ProductIntelligence
  }
  campaignId: string
}

export interface CampaignCriticOutput {
  result: Critique
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Campaign Critic AI Agent
 * 
 * Analyzes all campaign assets against the AIDA strategy and product intelligence,
 * scoring effectiveness across multiple dimensions and providing actionable improvement
 * recommendations.
 * 
 * @param input - Campaign data, AIDA strategy, assets, and product intelligence
 * @returns Critique with scores, findings, and recommendations with metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function campaignCriticAgent(
  input: CampaignCriticInput
): Promise<CampaignCriticOutput> {
  const startTime = Date.now()

  const { campaign, aidaStrategy, assets, productIntelligence } = input.data

  // Organize assets by stage for easier analysis
  const assetsByStage = {
    attention: assets.filter(a => a.stage === 'attention'),
    interest: assets.filter(a => a.stage === 'interest'),
    desire: assets.filter(a => a.stage === 'desire'),
    action: assets.filter(a => a.stage === 'action'),
    'multi-stage': assets.filter(a => a.stage === 'multi-stage')
  }

  const systemPrompt = `You are a campaign critic. Your job is to score and critique the campaign, identify the weakest stage, and provide actionable recommendations.

CRITICAL RULES:

1. SCORING (all scores are integers from 1-10):
   - attentionScore: How effectively do Attention assets hook the customer with pain/problem?
     * 8-10: Immediately resonates with target pain, uses customer language, creates urgency
     * 5-7: Addresses pain but generic or lacks emotional resonance
     * 1-4: Feature-focused, doesn't lead with pain, or disconnected from customer reality
   
   - interestScore: How well do Interest assets demonstrate cost of unsolved problem?
     * 8-10: Clearly articulates consequences, builds urgency, references differentiators
     * 5-7: Mentions problem but doesn't emphasize cost/consequence
     * 1-4: Skips to solution without establishing problem urgency
   
   - desireScore: How effectively do Desire assets paint customer outcome transformation?
     * 8-10: Vivid picture of desired end state, emotional, outcome-focused not feature-focused
     * 5-7: Mentions outcomes but lists features, lacks emotional impact
     * 1-4: Feature-focused, no outcome transformation, generic benefits
   
   - actionScore: How clear and compelling are Action assets' CTAs and friction reduction?
     * 8-10: Clear next steps, addresses objections, reduces friction, strong CTA
     * 5-7: Has CTA but unclear next steps or doesn't address objections
     * 1-4: Weak or confusing CTA, high friction, doesn't address final objections
   
   - messageConsistency: Do all assets share the same core claim and messaging angle?
     * 8-10: All assets clearly derive from the same messaging angle, no contradictions
     * 5-7: Mostly consistent but some assets drift or use different angles
     * 1-4: Assets contradict each other or use multiple conflicting angles
   
   - audienceFit: Do all assets speak to the specific target customer and their context?
     * 8-10: Language, pain points, and examples perfectly match target customer
     * 5-7: Generally appropriate but some generic language or mismatched examples
     * 1-4: Wrong audience, generic language, or examples that don't fit target customer

2. OVERALL SCORE CALCULATION:
   - Compute as: (attentionScore + interestScore + desireScore + actionScore + messageConsistency + audienceFit) / 6
   - Round to ONE decimal place
   - Example: (8 + 7 + 6 + 9 + 8 + 7) / 6 = 7.5

3. CRITICAL STAGE IDENTIFICATION:
   - Identify the AIDA stage with the LOWEST score (attention, interest, desire, or action)
   - IF two or more stages tie for lowest, select the EARLIEST stage in AIDA order
   - Example: If attention=5 and desire=5, critical stage is "attention"

4. FINDINGS (array of issues identified):
   - Each finding must have: stage, issue (specific problem), severity (low/medium/high)
   - Be specific about what's wrong, not just "needs improvement"
   - Reference actual content from the assets when describing issues
   - Example: { stage: "attention", issue: "LinkedIn post opens with 'We offer automated bookkeeping' instead of customer pain", severity: "high" }

5. RECOMMENDATIONS (array of improvement suggestions):
   - Each recommendation must have: stage, recommendation (what to do), expectedImpact (why it matters)
   - Be specific and actionable, not generic advice
   - Reference the actual product and customer
   - Example: { stage: "desire", recommendation: "Replace feature list with outcome: 'Know your real profit without becoming an accountant'", expectedImpact: "Shifts focus from features to customer transformation, increases emotional resonance" }

6. PRIMARY RECOMMENDATION:
   - Focus on the CRITICAL STAGE (lowest scoring stage)
   - Must include:
     * stage: The critical AIDA stage
     * targetAssetIds: Array of asset indices that need fixing (use array indices like ["0", "1", "2"])
     * recommendation: Specific action to take, referencing actual product and customer
     * suggestedFix: Actual replacement content or specific edits to make
   
   - Be SPECIFIC and ACTIONABLE:
     * Bad: "Make the desire stage more outcome-focused"
     * Good: "Replace 'Automated expense categorization and proactive tax estimates' with 'Stop spending Sunday nights sorting receipts and wondering if you're profitable'"
   
   - suggestedFix should be concrete content that can be directly applied:
     * For LinkedIn posts: Provide revised opening paragraph or complete revised post
     * For emails: Provide revised subject line and opening paragraph
     * For landing page: Provide revised headline and problem section
     * For ads: Provide revised headline and primary text

7. PLACEHOLDERS FOR MISSING BENCHMARKS:
   - WHEN referencing benchmarks, industry averages, conversion rates, or competitive data NOT provided, use placeholders:
   - Format: "[BENCHMARK: description of missing data]"
   - Example: "This attention score of 6 is below [BENCHMARK: industry average for SaaS attention metrics]"
   - DO NOT fabricate specific numbers or industry statistics

8. SPECIFICITY REQUIREMENTS:
   - ALL recommendations must reference the SPECIFIC product name
   - ALL recommendations must reference the SPECIFIC target customer from Product Intelligence
   - ALL recommendations must reference the SPECIFIC pain point or outcome from Product Intelligence
   - Generic recommendations like "improve clarity" or "add more emotion" are NOT acceptable

OUTPUT FORMAT: Return valid JSON with this structure:
{
  "overallScore": number (1.0-10.0, one decimal place),
  "attentionScore": integer (1-10),
  "interestScore": integer (1-10),
  "desireScore": integer (1-10),
  "actionScore": integer (1-10),
  "messageConsistency": integer (1-10),
  "audienceFit": integer (1-10),
  "criticalStage": "attention" | "interest" | "desire" | "action",
  "findings": [
    {
      "stage": "string (stage name or 'overall')",
      "issue": "string (specific problem identified)",
      "severity": "low" | "medium" | "high"
    }
  ],
  "recommendations": [
    {
      "stage": "string (stage name)",
      "recommendation": "string (specific action to take)",
      "expectedImpact": "string (why this matters)"
    }
  ],
  "primaryRecommendation": {
    "stage": "string (critical stage)",
    "targetAssetIds": ["string (asset index)"],
    "recommendation": "string (specific action referencing product and customer)",
    "suggestedFix": "string (actual replacement content or specific edits)"
  }
}`

  // Prepare asset summaries for the prompt
  const assetSummaries = assets.map((asset, index) => {
    const contentPreview = typeof asset.content === 'object' 
      ? JSON.stringify(asset.content).substring(0, 500) 
      : String(asset.content).substring(0, 500)
    return `Asset ${index} [${asset.channel}, ${asset.stage}, ${asset.assetType}]:
${contentPreview}...`
  }).join('\n\n')

  const userPrompt = `Critique this campaign and provide scored analysis with actionable recommendations:

=== PRODUCT INFORMATION ===
Product Name: ${campaign.productBrief.productName}
Target Customer: ${productIntelligence.idealCustomerProfile}
Primary Pain: "${productIntelligence.primaryPain}"
Desired Outcome: ${productIntelligence.desiredOutcome}
Core Promise: ${productIntelligence.corePromise}
Differentiators: ${productIntelligence.differentiators.join(', ')}

=== AIDA STRATEGY ===
ATTENTION:
Objective: ${aidaStrategy.attention.objective}
Content Direction: ${aidaStrategy.attention.contentDirection}
Key Points: ${aidaStrategy.attention.keyPoints.join('; ')}

INTEREST:
Objective: ${aidaStrategy.interest.objective}
Content Direction: ${aidaStrategy.interest.contentDirection}
Key Points: ${aidaStrategy.interest.keyPoints.join('; ')}

DESIRE:
Objective: ${aidaStrategy.desire.objective}
Content Direction: ${aidaStrategy.desire.contentDirection}
Key Points: ${aidaStrategy.desire.keyPoints.join('; ')}

ACTION:
Objective: ${aidaStrategy.action.objective}
Content Direction: ${aidaStrategy.action.contentDirection}
Key Points: ${aidaStrategy.action.keyPoints.join('; ')}

=== GENERATED CAMPAIGN ASSETS ===
Total Assets: ${assets.length}
By Stage:
- Attention: ${assetsByStage.attention.length} assets
- Interest: ${assetsByStage.interest.length} assets
- Desire: ${assetsByStage.desire.length} assets
- Action: ${assetsByStage.action.length} assets
- Multi-stage: ${assetsByStage['multi-stage'].length} assets

Asset Details:
${assetSummaries}

=== YOUR TASK ===
Analyze the campaign and provide a complete critique with:

1. SCORES (all integers 1-10):
   - attentionScore: How well do Attention assets hook with pain/problem?
   - interestScore: How well do Interest assets show cost of unsolved problem?
   - desireScore: How well do Desire assets paint outcome transformation?
   - actionScore: How clear and compelling are Action CTAs?
   - messageConsistency: Do all assets share the same core message?
   - audienceFit: Do assets speak to the specific target customer?

2. OVERALL SCORE:
   - Calculate: (sum of 6 scores) / 6
   - Round to ONE decimal place
   - Example: (8+7+6+9+8+7)/6 = 7.5

3. CRITICAL STAGE:
   - Identify the lowest-scoring AIDA stage
   - If tie, select earliest in AIDA order (attention → interest → desire → action)

4. FINDINGS:
   - List specific issues found in the campaign
   - Each finding: { stage, issue, severity }
   - Be specific about what's wrong with actual examples from the assets
   - Include at least 2-3 findings

5. RECOMMENDATIONS:
   - Provide specific improvement suggestions for each problematic area
   - Each recommendation: { stage, recommendation, expectedImpact }
   - Reference the actual product: "${campaign.productBrief.productName}"
   - Reference the actual customer: "${productIntelligence.idealCustomerProfile}"
   - Include at least 2-3 recommendations

6. PRIMARY RECOMMENDATION:
   - Focus on the CRITICAL STAGE (lowest score)
   - Must include:
     * stage: The critical stage name
     * targetAssetIds: Array of asset indices to fix (e.g., ["0", "1"])
     * recommendation: What to fix, referencing product and customer specifically
     * suggestedFix: Actual replacement content that can be directly applied
   
   Example for Attention stage:
   {
     "stage": "attention",
     "targetAssetIds": ["0"],
     "recommendation": "The LinkedIn attention post for ${campaign.productBrief.productName} opens with product features instead of the customer's pain point. Replace the opening with the primary pain: '${productIntelligence.primaryPain}'",
     "suggestedFix": "Opening paragraph: Are you a ${productIntelligence.idealCustomerProfile}? ${productIntelligence.primaryPain}. Most freelancers spend hours every week just trying to understand their financial position. You're not alone — and there's a better way."
   }

REMEMBER:
- All scores must be integers from 1-10
- Overall score must be rounded to ONE decimal place
- Critical stage is the lowest-scoring AIDA stage (earliest if tie)
- All recommendations must reference THIS specific product: "${campaign.productBrief.productName}"
- All recommendations must reference THIS specific customer: "${productIntelligence.idealCustomerProfile}"
- suggestedFix must be actual replacement content, not just advice
- Use placeholders for missing benchmark data: [BENCHMARK: description]
- Be specific and actionable, not generic`

  // Wrap the LLM call with a 30-second timeout per requirements
  const agentCall = callLLMWithStructuredOutput<Critique>({
    schema: CritiqueSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    30000, // 30 seconds
    'Campaign Critic agent exceeded 30 second timeout'
  )

  // Validate the overall score calculation (Req 6.2)
  const expectedOverallScore = (
    result.attentionScore +
    result.interestScore +
    result.desireScore +
    result.actionScore +
    result.messageConsistency +
    result.audienceFit
  ) / 6

  // Round to 1 decimal place
  const roundedExpected = Math.round(expectedOverallScore * 10) / 10

  // Validate the returned overall score matches expected calculation
  if (Math.abs(result.overallScore - roundedExpected) > 0.01) {
    // Allow small floating point differences
    console.warn(
      `Overall score mismatch: returned ${result.overallScore}, expected ${roundedExpected}. Correcting.`
    )
    result.overallScore = roundedExpected
  }

  // Validate critical stage identification (Req 6.3)
  const stageScores = [
    { stage: 'attention' as const, score: result.attentionScore },
    { stage: 'interest' as const, score: result.interestScore },
    { stage: 'desire' as const, score: result.desireScore },
    { stage: 'action' as const, score: result.actionScore }
  ]

  const lowestScore = Math.min(...stageScores.map(s => s.score))
  const criticalStageExpected = stageScores.find(s => s.score === lowestScore)?.stage

  if (criticalStageExpected && result.criticalStage !== criticalStageExpected) {
    console.warn(
      `Critical stage mismatch: returned ${result.criticalStage}, expected ${criticalStageExpected}. Correcting.`
    )
    result.criticalStage = criticalStageExpected
  }

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
