/**
 * Product Analyst AI Agent
 * 
 * Extracts structured product intelligence from the raw Product_Brief.
 * 
 * Responsibilities:
 * - Analyze target customer to define ICP
 * - Extract core problem and express primary pain in customer language (first-person, 5-30 words)
 * - Identify desired outcome (what customer wants to achieve)
 * - Formulate core promise (what product delivers)
 * - Extract 1-5 differentiators from keyDifferentiator and description
 * - Derive 2-5 objections based on category and differentiators
 * - Identify emotional drivers (fear, aspiration, identity)
 * - Recommend one messaging angle (pain, outcome, or time)
 * - Insert placeholders for any referenced proof not in productBrief
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */

import { callLLMWithStructuredOutput, withTimeout } from '@/lib/ai/llm-client'
import { getAgentModelConfig } from '@/lib/ai/model-config'
import { ProductBriefData, ProductIntelligence, ProductIntelligenceSchema } from '@/lib/types/campaign'

export interface ProductAnalystInput {
  data: ProductBriefData
  campaignId: string
}

export interface ProductAnalystOutput {
  result: ProductIntelligence
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Product Analyst AI Agent
 * 
 * Analyzes the product brief and extracts structured intelligence about the product,
 * customer, pain points, and strategic positioning.
 * 
 * @param input - Product brief data and campaign ID
 * @returns Product intelligence with metadata
 * @throws Error if generation fails or times out (120 seconds)
 */
export async function productAnalystAgent(
  input: ProductAnalystInput
): Promise<ProductAnalystOutput> {
  const startTime = Date.now()

  const systemPrompt = `You are a product intelligence analyst. Your job is to extract structured insights from a product brief.

CRITICAL RULES:
1. Express primary pain in CUSTOMER LANGUAGE using first-person statements (5-30 words)
   - Good examples: "I don't know where my money is really going", "I'm drowning in spreadsheets but still missing deadlines"
   - Bad examples: "lack of financial visibility", "inefficient project management"
   - The pain must be conversational, emotional, and reflect how a real customer would describe their problem
2. Derive 2-5 objections from the product category and differentiators
   - Objections should be realistic concerns the target customer would have
   - Examples: "Can I trust the numbers?", "Is my data secure?", "Will this work with my existing tools?"
3. If the brief references testimonials, metrics, case studies, or proof NOT provided in the data, DO NOT fabricate them
   - Instead, note where proof would be needed but use only the data provided
4. Recommended messaging angle must be ONE of: pain, outcome, time
   - pain: Focus on the customer's current painful state
   - outcome: Focus on the desired end result or transformation
   - time: Focus on efficiency, speed, or time savings
5. Extract differentiators from the keyDifferentiator field and description
   - Each differentiator should be specific to this product
   - Avoid generic claims like "easy to use" or "powerful features"
6. Identify 1-5 emotional drivers that motivate the customer
   - Examples: fear of failure, desire for control, aspiration for success, need for security
7. Core promise should articulate what the product delivers in the customer's own terms
   - Not just features, but the fundamental value proposition
8. Desired outcome should be the specific result the customer wants to achieve
   - Frame it as their goal, not your product's capabilities

OUTPUT FORMAT: Return valid JSON matching ProductIntelligence schema with these exact field names:
- idealCustomerProfile (10-500 chars)
- coreProblem (10-500 chars)
- primaryPain (5-200 chars, MUST be first-person customer language)
- desiredOutcome (10-300 chars)
- corePromise (10-300 chars)
- differentiators (array of 1-5 strings)
- emotionalDrivers (array of 1-5 strings)
- objections (array of 2-5 strings)
- recommendedMessagingAngle (must be "pain", "outcome", or "time")`

  const userPrompt = `Analyze this product brief and extract product intelligence:

Product: ${input.data.productName}
Description: ${input.data.description}
Category: ${input.data.category}
Product Type: ${input.data.productType}
Target Customer: ${input.data.targetCustomer}
Customer Problem: ${input.data.customerProblem}
Customer Sophistication: ${input.data.customerSophistication}
Main Benefit: ${input.data.mainBenefit}
Key Differentiator: ${input.data.keyDifferentiator}
Price: ${input.data.price}
Marketing Goal: ${input.data.marketingGoal}
Launch Type: ${input.data.launchType}
Desired CTA: ${input.data.desiredCTA}
Primary Channel: ${input.data.primaryChannel}
Campaign Duration: ${input.data.campaignDuration}
${input.data.competitors ? `Competitors: ${input.data.competitors}` : ''}
${input.data.existingTagline ? `Existing Tagline: ${input.data.existingTagline}` : ''}
${input.data.brandVoice ? `Brand Voice: ${input.data.brandVoice}` : ''}
${input.data.websiteURL ? `Website URL: ${input.data.websiteURL}` : ''}
${input.data.customerTestimonials ? `Customer Testimonials: ${input.data.customerTestimonials}` : ''}
${input.data.productDocs ? `Product Docs: ${input.data.productDocs}` : ''}
${input.data.brandGuidelines ? `Brand Guidelines: ${input.data.brandGuidelines}` : ''}
${input.data.existingCopy ? `Existing Copy: ${input.data.existingCopy}` : ''}

Extract the following in valid JSON format:
1. idealCustomerProfile - Who is this product for? (specific demographic, psychographic, behavioral traits)
2. coreProblem - What is the fundamental problem this product solves?
3. primaryPain - How would the customer describe their pain in their own words? (MUST be 5-30 words, first-person, conversational)
4. desiredOutcome - What specific result does the customer want to achieve?
5. corePromise - What does this product fundamentally deliver to the customer?
6. differentiators - What makes this product different from alternatives? (1-5 specific differentiators)
7. emotionalDrivers - What emotions motivate this customer? (1-5 emotional drivers)
8. objections - What concerns would prevent the customer from buying? (2-5 realistic objections)
9. recommendedMessagingAngle - Which messaging angle would work best: "pain", "outcome", or "time"?`

  // Get model configuration for this agent
  const modelConfig = getAgentModelConfig('productAnalyst')

  // Wrap the LLM call with a 30-second timeout per Req 2.8
  const agentCall = callLLMWithStructuredOutput<ProductIntelligence>({
    schema: ProductIntelligenceSchema,
    systemPrompt,
    userPrompt,
    temperature: modelConfig.temperature,
    maxRetries: 3,
    provider: modelConfig.provider,
    model: modelConfig.model
  })

  // LLM-based competitive intelligence typically takes 45-90 seconds
  // 120 second timeout accommodates complex briefs while providing protection (Bug #2 fix)
  const result = await withTimeout(
    agentCall,
    120000, // 120 seconds
    'Product Analyst agent exceeded 120 second timeout'
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
