/**
 * AIDA Strategist AI Agent
 * 
 * Builds a product-specific AIDA persuasion strategy before any campaign copy is written.
 * Ensures every asset is grounded in a coherent argument rather than independent AI-generated paragraphs.
 * 
 * Responsibilities:
 * - Generate 4 AIDA stages: Attention, Interest, Desire, Action
 * - Ground Attention in customer pain or hook (not features)
 * - Ground Interest in cost/consequence of unsolved problem
 * - Ground Desire in customer outcome transformation (not features)
 * - Include both primary and secondary CTA in Action stage if provided
 * - Insert placeholders for missing social proof
 * - Validate all stages have non-empty objectives and content directions
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8
 */

import { callLLMWithStructuredOutput, withTimeout } from '@/lib/ai/llm-client'
import {
  ProductIntelligence,
  ProductBriefData,
  Positioning,
  MessagingAngle,
  AidaStrategy,
  AidaStrategySchema
} from '@/lib/types/campaign'

export interface AidaStrategistInput {
  data: {
    productBrief: ProductBriefData
    productIntelligence: ProductIntelligence
    positioning: Positioning
    selectedAngle: MessagingAngle
  }
  campaignId: string
}

export interface AidaStrategistOutput {
  result: AidaStrategy
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * AIDA Strategist AI Agent
 * 
 * Creates a product-specific AIDA persuasion strategy that anchors all subsequent
 * campaign assets. Each stage is grounded in specific customer needs and product value.
 * 
 * @param input - Product brief, intelligence, positioning, and selected messaging angle
 * @returns Complete AIDA strategy with 4 stages and metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function aidaStrategistAgent(
  input: AidaStrategistInput
): Promise<AidaStrategistOutput> {
  const startTime = Date.now()

  const { productBrief, productIntelligence, positioning, selectedAngle } = input.data

  const systemPrompt = `You are an AIDA strategist. Your job is to build a product-specific persuasion strategy with four stages: Attention, Interest, Desire, and Action.

CRITICAL RULES:
1. Generate ALL FOUR stages with complete, non-empty fields:
   - stage: "attention" | "interest" | "desire" | "action"
   - objective: 20-500 words, the strategic goal of this stage
   - contentDirection: 50-1000 words, specific guidance for content creators
   - keyPoints: 2-5 bullet points, concrete claims or arguments to emphasize
   - proofRequirements: array of placeholder strings for missing proof (optional)

2. ATTENTION stage rules:
   - Ground in customer pain point or hook from selected messaging angle
   - DO NOT open with product features or "we offer X"
   - Lead with the problem, uncertainty, or emotional state the customer experiences
   - Example: "Lead with financial uncertainty — 'Your bank balance isn't the same as knowing how much money you have.'"
   - Focus on the customer's current painful reality, not the solution

3. INTEREST stage rules:
   - Ground in cost or consequence of the UNSOLVED problem
   - Draw on differentiators and objections from Product Intelligence
   - Explain WHY the current state is expensive, risky, or unsustainable
   - Example: "The real cost isn't just time — it's the business decisions you're making with incomplete financial data"
   - Make the customer realize they cannot ignore this problem

4. DESIRE stage rules:
   - Ground in customer OUTCOME — the transformation from painful state to desired result
   - DO NOT list product features
   - Paint a picture of the customer's life AFTER solving the problem
   - Example: "Know your real numbers without becoming an accountant"
   - Focus on the end state the customer wants, not how the product delivers it

5. ACTION stage rules:
   - Include the primary CTA from Product Brief
   - IF Product Brief has a non-empty secondaryCTA field, include BOTH primary and secondary CTAs
   - Provide clear, concrete next steps
   - Reduce friction and address final objections
   - Example: "Start your 14-day trial — no credit card required"

6. Social proof placeholders:
   - WHEN referencing testimonials, case studies, statistics, awards, or performance data NOT provided in the input, insert placeholders:
   - Use format: "[TESTIMONIAL]", "[STAT]", "[CASE_STUDY]", "[AWARD]"
   - DO NOT fabricate specific customer names, numbers, or quotes
   - Example: "As one customer said: [TESTIMONIAL]" or "Our users see [STAT]% improvement"

7. All content must be specific to THIS product, customer, and pain point
   - Reference the actual product name
   - Reference the specific customer segment from Product Intelligence
   - Reference the specific pain point and desired outcome
   - Use the selected messaging angle as the anchor for all stages

8. Each stage must provide actionable content direction
   - contentDirection should guide what to write, not just describe the stage
   - Include specific angles, claims, or emotional drivers to emphasize
   - Provide enough detail that a copywriter knows exactly what to create

OUTPUT FORMAT: Return valid JSON with this structure:
{
  "attention": {
    "stage": "attention",
    "objective": "string (20-500 words)",
    "contentDirection": "string (50-1000 words)",
    "keyPoints": ["string", "string", ...],
    "proofRequirements": ["[PLACEHOLDER]", ...] // optional
  },
  "interest": {
    "stage": "interest",
    "objective": "string (20-500 words)",
    "contentDirection": "string (50-1000 words)",
    "keyPoints": ["string", "string", ...],
    "proofRequirements": ["[PLACEHOLDER]", ...] // optional
  },
  "desire": {
    "stage": "desire",
    "objective": "string (20-500 words)",
    "contentDirection": "string (50-1000 words)",
    "keyPoints": ["string", "string", ...],
    "proofRequirements": ["[PLACEHOLDER]", ...] // optional
  },
  "action": {
    "stage": "action",
    "objective": "string (20-500 words)",
    "contentDirection": "string (50-1000 words)",
    "keyPoints": ["string", "string", ...],
    "proofRequirements": ["[PLACEHOLDER]", ...] // optional
  }
}`

  const userPrompt = `Build a complete AIDA strategy for this product:

=== SELECTED MESSAGING ANGLE (PRIMARY ANCHOR) ===
Type: ${selectedAngle.type}
Tagline: "${selectedAngle.tagline}"
Core Message: ${selectedAngle.coreMessage}
Rationale: ${selectedAngle.rationale}

=== PRODUCT INTELLIGENCE ===
Ideal Customer Profile: ${productIntelligence.idealCustomerProfile}
Core Problem: ${productIntelligence.coreProblem}
Primary Pain (in customer's words): "${productIntelligence.primaryPain}"
Desired Outcome: ${productIntelligence.desiredOutcome}
Core Promise: ${productIntelligence.corePromise}
Differentiators: ${productIntelligence.differentiators.join(', ')}
Emotional Drivers: ${productIntelligence.emotionalDrivers.join(', ')}
Objections: ${productIntelligence.objections.join(', ')}

=== POSITIONING ===
Category: ${positioning.category}
Positioning Statement: ${positioning.positioningStatement}
Value Proposition: ${positioning.valueProposition}
Primary Pain: ${positioning.primaryPain}
Desired Transformation: ${positioning.desiredTransformation}

=== PRODUCT BRIEF ===
Product Name: ${productBrief.productName}
Description: ${productBrief.description}
Main Benefit: ${productBrief.mainBenefit}
Key Differentiator: ${productBrief.keyDifferentiator}
Target Customer: ${productBrief.targetCustomer}
Customer Problem: ${productBrief.customerProblem}
Primary CTA: ${productBrief.desiredCTA}
${productBrief.competitors ? `Competitors: ${productBrief.competitors}` : ''}
${productBrief.existingTagline ? `Existing Tagline: ${productBrief.existingTagline}` : ''}
${productBrief.brandVoice ? `Brand Voice: ${productBrief.brandVoice}` : ''}
${productBrief.customerTestimonials ? `Available Testimonials: ${productBrief.customerTestimonials}` : 'No testimonials provided — use placeholders if needed'}

=== YOUR TASK ===
Generate a complete AIDA strategy with four stages:

1. ATTENTION STAGE:
   - objective: Strategic goal of this stage (20-500 words)
   - contentDirection: Detailed guidance for content creators (50-1000 words)
   - keyPoints: 2-5 concrete claims to emphasize
   - proofRequirements: Array of placeholders for missing proof (if needed)
   
   CRITICAL: Ground in PAIN or HOOK, NOT product features
   - Use the selected messaging angle's core claim
   - Lead with the customer's current painful state
   - Example: "Lead with financial uncertainty — not with 'we offer automated bookkeeping'"
   - Focus on the problem the customer experiences RIGHT NOW

2. INTEREST STAGE:
   - objective: Strategic goal of this stage (20-500 words)
   - contentDirection: Detailed guidance for content creators (50-1000 words)
   - keyPoints: 2-5 concrete claims to emphasize
   - proofRequirements: Array of placeholders for missing proof (if needed)
   
   CRITICAL: Ground in COST/CONSEQUENCE of unsolved problem
   - Explain why the current state is expensive, risky, or unsustainable
   - Draw on differentiators and objections
   - Example: "The real cost isn't just time — it's the decisions you're making with incomplete data"
   - Make the customer realize they cannot ignore this problem

3. DESIRE STAGE:
   - objective: Strategic goal of this stage (20-500 words)
   - contentDirection: Detailed guidance for content creators (50-1000 words)
   - keyPoints: 2-5 concrete claims to emphasize
   - proofRequirements: Array of placeholders for missing proof (if needed)
   
   CRITICAL: Ground in CUSTOMER OUTCOME, NOT features
   - Paint the picture of life AFTER solving the problem
   - Focus on the desired transformation from Product Intelligence
   - Example: "Know your real numbers without becoming an accountant"
   - Describe the END STATE the customer wants

4. ACTION STAGE:
   - objective: Strategic goal of this stage (20-500 words)
   - contentDirection: Detailed guidance for content creators (50-1000 words)
   - keyPoints: 2-5 concrete claims to emphasize
   - proofRequirements: Array of placeholders for missing proof (if needed)
   
   CRITICAL: Include primary CTA from Product Brief
   - Provide clear next steps
   - Reduce friction
   - Address final objections
   - Make it easy to say yes

REMEMBER:
- All content must reference THIS specific product: "${productBrief.productName}"
- All content must address THIS specific customer: "${productIntelligence.idealCustomerProfile}"
- All content must anchor to the selected messaging angle: "${selectedAngle.tagline}"
- Use placeholders for missing proof: [TESTIMONIAL], [STAT], [CASE_STUDY]
- DO NOT fabricate customer names, numbers, or quotes
- Every stage must have complete, non-empty fields`

  // Wrap the LLM call with a 30-second timeout per requirements
  const agentCall = callLLMWithStructuredOutput<AidaStrategy>({
    schema: AidaStrategySchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    30000, // 30 seconds
    'AIDA Strategist agent exceeded 30 second timeout'
  )

  // Validate all stages have non-empty fields (Req 4.9)
  const stages = [result.attention, result.interest, result.desire, result.action]
  for (const stage of stages) {
    if (!stage.objective || stage.objective.trim().length === 0) {
      throw new Error(`AIDA ${stage.stage} stage has empty objective`)
    }
    if (!stage.contentDirection || stage.contentDirection.trim().length === 0) {
      throw new Error(`AIDA ${stage.stage} stage has empty contentDirection`)
    }
    if (!stage.keyPoints || stage.keyPoints.length < 2) {
      throw new Error(`AIDA ${stage.stage} stage has fewer than 2 keyPoints`)
    }
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
