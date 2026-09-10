/**
 * Positioning Strategist AI Agent
 * 
 * Defines product category, positioning statement, value proposition, and generates
 * three distinct messaging angles (pain, outcome, time).
 * 
 * Responsibilities:
 * - Define product category (5-100 characters)
 * - Craft positioning statement (10-300 characters, incorporating differentiators)
 * - Articulate value proposition (10-500 characters)
 * - Generate exactly 3 messaging angles:
 *   - One pain-focused (addresses primary pain)
 *   - One outcome-focused (emphasizes desired transformation)
 *   - One time/effort-focused (highlights efficiency gain)
 * - For each angle: tagline (10-200 chars), core message (20-500 chars), rationale (20-500 chars)
 * - Ensure no two angles share the same central claim
 * - Insert placeholders for competitive data not provided
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.6
 */

import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'
import { getAgentModelConfig } from '@/lib/ai/model-config'
import {
    PositioningOutput,
    PositioningOutputSchema,
    ProductBriefData,
    ProductIntelligence
} from '@/lib/types/campaign'

export interface PositioningStrategistInput {
  data: {
    productBrief: ProductBriefData
    productIntelligence: ProductIntelligence
  }
  campaignId: string
}

export interface PositioningStrategistOutput {
  result: PositioningOutput
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Positioning Strategist AI Agent
 * 
 * Creates a positioning strategy with three distinct messaging angles that
 * frame the product's value in different ways.
 * 
 * @param input - Product brief, product intelligence, and campaign ID
 * @returns Positioning strategy with 3 messaging angles and metadata
 * @throws Error if generation fails or times out (120 seconds)
 */
export async function positioningStrategistAgent(
  input: PositioningStrategistInput
): Promise<PositioningStrategistOutput> {
  const startTime = Date.now()

  const { productBrief, productIntelligence } = input.data

  const systemPrompt = `You are a positioning strategist. Your job is to define the product's market position and generate three distinct messaging angles.

CRITICAL RULES:
1. Output MUST include both "positioning" object and exactly 3 "messagingAngles"
   - positioning object is MANDATORY
   - messagingAngles array is MANDATORY with exactly 3 elements
   - Each angle must have a unique central claim with NO overlap
   - Pain angle: Focus on the customer's current painful state or problem
   - Outcome angle: Focus on the desired end result or transformation
   - Time angle: Focus on efficiency, speed, or time/effort savings

2. ALL CHARACTER LIMITS ARE STRICT - keep text UNDER these limits:
   - category: 5-100 characters (prefer under 80 chars)
   - positioningStatement: 10-300 characters (prefer under 250 chars)
   - valueProposition: 10-500 characters (prefer under 400 chars)
   - primaryPain: 10-300 characters (prefer under 250 chars)
   - desiredTransformation: 10-500 characters (prefer under 400 chars)
   - tagline: 10-200 characters (prefer under 150 chars)
   - coreMessage: 20-500 characters (prefer under 400 chars)
   - rationale: 20-500 characters (prefer under 400 chars)
   
   IMPORTANT: These are CHARACTER limits, not word limits. Keep your text concise.

3. Positioning statement requirements:
   - Must be 10-300 CHARACTERS (not words)
   - Should clearly articulate how the product is positioned in its category
   - Must incorporate the product's differentiators
   - Should be specific to THIS product, not generic positioning

4. Each messaging angle MUST include all four fields:
   - type: exactly "pain", "outcome", or "time"
   - tagline: 10-200 characters, catchy and memorable
   - coreMessage: 20-500 characters, the main argument for this angle
   - rationale: 20-500 characters, WHY this angle works for THIS specific product, customer segment, and pain point
   
5. Rationale must reference:
   - The specific product (not generic product features)
   - The specific customer segment from Product Intelligence
   - The specific pain point from Product Intelligence
   - Why THIS angle resonates with THIS customer

6. If referencing competitive data, market share figures, benchmarks, or performance comparisons NOT provided in the input, insert placeholders:
   - Use format: "[PLACEHOLDER: description of missing data]"
   - Examples: "[PLACEHOLDER: competitor comparison data]", "[PLACEHOLDER: market share statistics]"
   - DO NOT fabricate competitive data or market statistics

7. Value proposition requirements:
   - Must be 10-500 CHARACTERS (not words)
   - Should clearly articulate the product's unique value

8. The three angles must be meaningfully different—not just rephrasing the same claim

EXAMPLES OF DISTINCT MESSAGING ANGLES (for AI bookkeeping assistant):

Pain angle:
- Tagline: "Stop guessing where your money went" (40 chars)
- Core Message focuses on: Current pain, frustration, confusion about finances (under 400 chars)
- Rationale explains: Why this pain point resonates with freelancers who lack financial visibility (under 400 chars)

Outcome angle:
- Tagline: "Know your real numbers without becoming an accountant" (59 chars)
- Core Message focuses on: Desired end state, financial clarity, understanding without complexity (under 400 chars)
- Rationale explains: Why freelancers want this outcome without the learning curve (under 400 chars)

Time angle:
- Tagline: "Take bookkeeping off your Sunday-night to-do list" (54 chars)
- Core Message focuses on: Time savings, efficiency, reclaiming weekends (under 400 chars)
- Rationale explains: Why time is valuable to freelancers who bill by the hour (under 400 chars)

OUTPUT FORMAT: Return valid JSON with this EXACT structure:
{
  "positioning": {
    "category": "string (5-100 chars)",
    "positioningStatement": "string (10-300 chars)",
    "valueProposition": "string (10-500 chars)",
    "primaryPain": "string (10-300 chars)",
    "desiredTransformation": "string (10-500 chars)"
  },
  "messagingAngles": [
    {
      "type": "pain",
      "tagline": "string (10-200 chars)",
      "coreMessage": "string (20-500 chars)",
      "rationale": "string (20-500 chars, references product, customer, and pain)"
    },
    {
      "type": "outcome",
      "tagline": "string (10-200 chars)",
      "coreMessage": "string (20-500 chars)",
      "rationale": "string (20-500 chars, references product, customer, and pain)"
    },
    {
      "type": "time",
      "tagline": "string (10-200 chars)",
      "coreMessage": "string (20-500 chars)",
      "rationale": "string (20-500 chars, references product, customer, and pain)"
    }
  ]
}

CRITICAL: Do NOT omit the "positioning" object. Both "positioning" and "messagingAngles" are required.`

  const userPrompt = `Define positioning and generate 3 distinct messaging angles for this product:

=== PRODUCT INTELLIGENCE ===
Ideal Customer Profile: ${productIntelligence.idealCustomerProfile}
Core Problem: ${productIntelligence.coreProblem}
Primary Pain (in customer's words): "${productIntelligence.primaryPain}"
Desired Outcome: ${productIntelligence.desiredOutcome}
Core Promise: ${productIntelligence.corePromise}
Differentiators: ${productIntelligence.differentiators.join(', ')}
Emotional Drivers: ${productIntelligence.emotionalDrivers.join(', ')}
Objections: ${productIntelligence.objections.join(', ')}

=== PRODUCT BRIEF ===
Product Name: ${productBrief.productName}
Category: ${productBrief.category}
Description: ${productBrief.description}
Product Type: ${productBrief.productType}
Main Benefit: ${productBrief.mainBenefit}
Key Differentiator: ${productBrief.keyDifferentiator}
Target Customer: ${productBrief.targetCustomer}
Customer Problem: ${productBrief.customerProblem}
Price: ${productBrief.price}
Marketing Goal: ${productBrief.marketingGoal}
${productBrief.competitors ? `Competitors: ${productBrief.competitors}` : ''}
${productBrief.existingTagline ? `Existing Tagline: ${productBrief.existingTagline}` : ''}
${productBrief.brandVoice ? `Brand Voice: ${productBrief.brandVoice}` : ''}

=== YOUR TASK ===
Generate a complete positioning strategy including:

1. POSITIONING OBJECT (MANDATORY):
   - category: Product's market category (5-100 chars, prefer under 80)
   - positioningStatement: How this product is positioned (10-300 chars, prefer under 250)
   - valueProposition: The unique value delivered (10-500 chars, prefer under 400)
   - primaryPain: The main pain point addressed (10-300 chars, prefer under 250)
   - desiredTransformation: The change the customer experiences (10-500 chars, prefer under 400)

2. THREE MESSAGING ANGLES (MANDATORY - must be distinctly different):
   
   PAIN ANGLE:
   - type: "pain"
   - tagline: Catchy tagline focused on the painful current state (10-200 chars, prefer under 150)
   - coreMessage: Why this pain matters and how it affects the customer (20-500 chars, prefer under 400)
   - rationale: Why THIS pain-focused angle works for THIS specific product and customer (20-500 chars, prefer under 400)
   
   OUTCOME ANGLE:
   - type: "outcome"
   - tagline: Catchy tagline focused on the desired end result (10-200 chars, prefer under 150)
   - coreMessage: What transformation the customer experiences (20-500 chars, prefer under 400)
   - rationale: Why THIS outcome-focused angle works for THIS specific product and customer (20-500 chars, prefer under 400)
   
   TIME ANGLE:
   - type: "time"
   - tagline: Catchy tagline focused on efficiency/time savings (10-200 chars, prefer under 150)
   - coreMessage: How this product saves time or effort (20-500 chars, prefer under 400)
   - rationale: Why THIS time-focused angle works for THIS specific product and customer (20-500 chars, prefer under 400)

REMEMBER:
- Each rationale MUST reference the SPECIFIC product name, customer segment, and pain point
- If you need competitive data not provided, use placeholders: "[PLACEHOLDER: description]"
- The three angles must present genuinely different value propositions, not just rephrase the same idea
- All text must be specific to THIS product, not generic marketing speak
- Keep text UNDER the character limits - these are CHARACTER limits, not word counts
- BOTH "positioning" and "messagingAngles" are REQUIRED in your response`

  // Get model configuration for this agent
  const modelConfig = getAgentModelConfig('positioningStrategist')

  // Call LLM with improved error handling for validation failures
  let lastValidationError: string | null = null
  const maxRetries = 3
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await callLLMWithStructuredOutput<PositioningOutput>({
        schema: PositioningOutputSchema,
        systemPrompt: lastValidationError 
          ? `${systemPrompt}\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastValidationError}\n\nPlease correct these issues in your response.`
          : systemPrompt,
        userPrompt,
        temperature: modelConfig.temperature,
        maxRetries: 1, // Single attempt per outer retry to avoid nested timeouts
        requestTimeoutMs: 115000,
        maxTokens: 1600,
        provider: modelConfig.provider,
        model: modelConfig.model
      })

      return {
        result,
        metadata: {
          tokensUsed: result.tokensUsed || 0,
          executionTimeMs: Date.now() - startTime,
          modelVersion: `${modelConfig.provider}/${modelConfig.model}`
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ZodError')) {
        // Extract validation details for next retry
        lastValidationError = error.message
        console.error(`[Positioning Strategist] Validation failed (attempt ${attempt + 1}/${maxRetries}):`, error.message)
        
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000
          console.log(`[Positioning Strategist] Retrying with validation feedback in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue
        }
      }
      
      // For network/abort errors, also retry
      if (error instanceof Error && (
        error.message.includes('aborted') || 
        error.message.includes('network') ||
        error.message.includes('ECONNRESET')
      )) {
        console.error(`[Positioning Strategist] Network error (attempt ${attempt + 1}/${maxRetries}):`, error.message)
        
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000
          console.log(`[Positioning Strategist] Retrying after network error in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue
        }
      }
      
      throw error
    }
  }

  throw new Error(`Positioning Strategist failed after ${maxRetries} attempts. Last validation error: ${lastValidationError}`)
}
