/**
 * Campaign Builder AI Agent - LinkedIn Posts, Emails & Landing Pages
 * 
 * Generates channel-specific marketing assets derived from the AIDA strategy.
 * This module handles LinkedIn posts, emails, and landing pages; will be extended for ads.
 * 
 * Responsibilities:
 * - Generate 4 LinkedIn posts (one per AIDA stage)
 * - Generate 4 emails (one per AIDA stage)
 * - Generate 1 landing page with complete structured copy
 * - Enforce character/word limits per channel
 * - Use selected messaging angle as primary anchor
 * - Reference product-specific differentiators (not generic claims)
 * - Insert placeholders for missing proof
 * - Validate output against channel-specific schemas
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.6, 5.7, 5.8
 */

import { callLLMWithStructuredOutput, withTimeout } from '@/lib/ai/llm-client'
import {
    AidaStrategy,
    CampaignAssetOutput,
    CampaignAssetOutputSchema,
    EmailAsset,
    LandingPage,
    LinkedInPost,
    MessagingAngle,
    ProductBriefData,
    ProductIntelligence
} from '@/lib/types/campaign'
import { z } from 'zod'

// Output schema for LinkedIn posts generation
const LinkedInPostsOutputSchema = z.array(CampaignAssetOutputSchema)

// Output schema for emails generation
const EmailsOutputSchema = z.array(CampaignAssetOutputSchema)

export interface CampaignBuilderLinkedInInput {
  data: {
    productBrief: ProductBriefData
    aidaStrategy: AidaStrategy
    productIntelligence: ProductIntelligence
    selectedAngle: MessagingAngle
  }
  campaignId: string
}

export interface CampaignBuilderLinkedInOutput {
  result: CampaignAssetOutput[]
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Campaign Builder AI Agent - LinkedIn Posts
 * 
 * Generates 4 LinkedIn posts (one per AIDA stage) from the AIDA strategy.
 * All posts use the selected messaging angle and reference product-specific differentiators.
 * 
 * @param input - Product brief, AIDA strategy, and selected messaging angle
 * @returns Array of 4 LinkedIn post assets with metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function campaignBuilderLinkedInAgent(
  input: CampaignBuilderLinkedInInput
): Promise<CampaignBuilderLinkedInOutput> {
  const startTime = Date.now()

  const { productBrief, aidaStrategy, selectedAngle } = input.data

  const systemPrompt = `You are a campaign builder specializing in LinkedIn content. Your job is to generate 4 LinkedIn posts (one per AIDA stage) derived from a unified AIDA strategy.

CRITICAL RULES:
1. Generate EXACTLY 4 LinkedIn posts with these specifications:
   - Post 1: Attention stage - hook-driven, max 3,000 characters
   - Post 2: Interest stage - educational, max 3,000 characters
   - Post 3: Desire stage - transformation-focused, max 3,000 characters
   - Post 4: Action stage - product and CTA, max 3,000 characters

2. Each post must include:
   - stage: "attention" | "interest" | "desire" | "action"
   - content: 50-3,000 characters of LinkedIn post copy
   - strategicPurpose: 20-300 characters explaining what this post achieves

3. Use the selected messaging angle as PRIMARY ANCHOR:
   - Every post must directly reference or support the messaging angle's core claim
   - The angle's tagline should be recognizable across all 4 posts
   - DO NOT contradict the selected angle with messaging from a different angle
   - Example: If angle is "Stop guessing where your money went", all 4 posts should echo the uncertainty/clarity contrast

4. Reference PRODUCT-SPECIFIC differentiators from AIDA strategy:
   - DO NOT use generic language like "our solution" or "powerful features"
   - Use the actual product name: "${productBrief.productName}"
   - Reference specific differentiators from the AIDA strategy key points
   - Example: Instead of "automated categorization", say the specific product capability mentioned in the strategy

5. Insert placeholders for MISSING PROOF:
   - When social proof is needed but not provided, use explicit placeholders
   - Format: "[Insert customer testimonial here]", "[Insert metric here]", "[Insert case study here]"
   - DO NOT fabricate testimonials, statistics, customer names, or performance numbers
   - Example: "As one customer said: [Insert customer testimonial here]"

6. ATTENTION stage (hook-driven):
   - Open with the customer's pain or the hook from the messaging angle
   - DO NOT list product features
   - Focus on the problem the customer experiences right now
   - Make it scroll-stopping and relatable
   - Example: Start with "Your bank balance says $12,453. But how much can you actually spend?" NOT "Introducing our AI bookkeeping assistant"

7. INTEREST stage (educational):
   - Explain the cost or consequence of the unsolved problem
   - Draw on differentiators and objections from AIDA strategy
   - Make the customer realize they cannot ignore this problem
   - Provide value through insight, not product pitch
   - Example: "The real cost isn't the 3 hours every Sunday. It's the business decisions you're making with incomplete data."

8. DESIRE stage (transformation-focused):
   - Paint the picture of life AFTER solving the problem
   - Focus on customer outcome, NOT product features
   - Show the transformation from painful state to desired result
   - Use emotional drivers from the AIDA strategy
   - Example: "Imagine knowing your real profit margin in 2 minutes — without becoming an accountant."

9. ACTION stage (product and CTA):
   - Introduce the product as the vehicle for the transformation
   - Include the primary CTA from the product brief
   - Reduce friction and address final objections
   - Make it easy to take the next step
   - Example: "That's why we built [Product Name]. [Brief product description]. [Primary CTA]"

10. LinkedIn-specific best practices:
    - Use short paragraphs and line breaks for readability
    - Front-load the most important information (LinkedIn truncates after ~3 lines in feed)
    - Use natural, conversational language (not corporate speak)
    - Include a clear takeaway or call-to-action at the end
    - Avoid excessive emojis or hashtags (professional tone)

OUTPUT FORMAT: Return valid JSON array with 4 objects. IMPORTANT: The top-level response MUST be an array starting with [ and ending with ], NOT an object with a "posts" key.

CORRECT FORMAT (use this):
[
  {
    "channel": "linkedin",
    "stage": "attention",
    "assetType": "post",
    "title": "Attention LinkedIn Post",
    "content": {
      "stage": "attention",
      "content": "string (50-3000 chars)",
      "strategicPurpose": "string (20-300 chars)"
    }
  },
  ...3 more posts...
]

WRONG FORMAT (do NOT use this):
{
  "posts": [...]
}`

  const userPrompt = `Generate 4 LinkedIn posts for this product campaign:

=== SELECTED MESSAGING ANGLE (PRIMARY ANCHOR) ===
Type: ${selectedAngle.type}
Tagline: "${selectedAngle.tagline}"
Core Message: ${selectedAngle.coreMessage}

CRITICAL: Every post must directly reference or support this messaging angle's core claim.

=== AIDA STRATEGY ===

ATTENTION STAGE:
Objective: ${aidaStrategy.attention.objective}
Content Direction: ${aidaStrategy.attention.contentDirection}
Key Points:
${aidaStrategy.attention.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.attention.proofRequirements ? `Proof Requirements: ${aidaStrategy.attention.proofRequirements.join(', ')}` : ''}

INTEREST STAGE:
Objective: ${aidaStrategy.interest.objective}
Content Direction: ${aidaStrategy.interest.contentDirection}
Key Points:
${aidaStrategy.interest.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.interest.proofRequirements ? `Proof Requirements: ${aidaStrategy.interest.proofRequirements.join(', ')}` : ''}

DESIRE STAGE:
Objective: ${aidaStrategy.desire.objective}
Content Direction: ${aidaStrategy.desire.contentDirection}
Key Points:
${aidaStrategy.desire.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.desire.proofRequirements ? `Proof Requirements: ${aidaStrategy.desire.proofRequirements.join(', ')}` : ''}

ACTION STAGE:
Objective: ${aidaStrategy.action.objective}
Content Direction: ${aidaStrategy.action.contentDirection}
Key Points:
${aidaStrategy.action.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.action.proofRequirements ? `Proof Requirements: ${aidaStrategy.action.proofRequirements.join(', ')}` : ''}

=== PRODUCT INFORMATION ===
Product Name: ${productBrief.productName}
Description: ${productBrief.description}
Main Benefit: ${productBrief.mainBenefit}
Key Differentiator: ${productBrief.keyDifferentiator}
Primary CTA: ${productBrief.desiredCTA}
${productBrief.brandVoice ? `Brand Voice: ${productBrief.brandVoice}` : ''}
${productBrief.customerTestimonials ? `Available Testimonials:\n${productBrief.customerTestimonials}` : 'No testimonials provided — use placeholders like "[Insert customer testimonial here]" if needed'}
${productBrief.existingCopy ? `Existing Copy Reference:\n${productBrief.existingCopy}` : ''}

=== YOUR TASK ===
Generate 4 LinkedIn posts following this structure:

POST 1 - ATTENTION (hook-driven):
- Stage: attention
- Content: 50-3,000 characters
- Strategic Purpose: What this post achieves (20-300 chars)
- Open with customer pain or hook from messaging angle
- DO NOT list product features
- Make it scroll-stopping and relatable
- Example opening: "${aidaStrategy.attention.keyPoints[0]}" (adapt to LinkedIn post format)

POST 2 - INTEREST (educational):
- Stage: interest
- Content: 50-3,000 characters
- Strategic Purpose: What this post achieves (20-300 chars)
- Explain cost/consequence of unsolved problem
- Provide value through insight
- Make them realize they can't ignore this
- Reference specific differentiators from the AIDA strategy

POST 3 - DESIRE (transformation-focused):
- Stage: desire
- Content: 50-3,000 characters
- Strategic Purpose: What this post achieves (20-300 chars)
- Paint the picture of life after solving the problem
- Focus on customer outcome, NOT features
- Show the transformation
- Use placeholders for social proof if not provided

POST 4 - ACTION (product and CTA):
- Stage: action
- Content: 50-3,000 characters
- Strategic Purpose: What this post achieves (20-300 chars)
- Introduce "${productBrief.productName}" as the solution
- Include the CTA: "${productBrief.desiredCTA}"
- Reduce friction and address objections
- Make the next step clear and easy

REMEMBER:
- All 4 posts must anchor to the messaging angle: "${selectedAngle.tagline}"
- Use the actual product name: "${productBrief.productName}"
- Reference specific differentiators from the AIDA strategy (not generic claims)
- Insert placeholders for missing proof: [Insert customer testimonial here], [Insert metric here]
- DO NOT fabricate testimonials, statistics, or customer names
- Max 3,000 characters per post
- Use short paragraphs and line breaks for LinkedIn readability
- Professional, conversational tone (avoid corporate speak)

Generate all 4 LinkedIn posts now.`

  // Wrap the LLM call with a 30-second timeout per requirements
  const agentCall = callLLMWithStructuredOutput<CampaignAssetOutput[]>({
    schema: LinkedInPostsOutputSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    30000, // 30 seconds
    'Campaign Builder (LinkedIn) agent exceeded 30 second timeout'
  )

  // Validate that we got exactly 4 posts
  if (result.length !== 4) {
    throw new Error(`Expected 4 LinkedIn posts but got ${result.length}`)
  }

  // Validate each post is for LinkedIn and has correct stage
  const expectedStages: Array<'attention' | 'interest' | 'desire' | 'action'> = [
    'attention',
    'interest',
    'desire',
    'action'
  ]

  for (let i = 0; i < 4; i++) {
    const post = result[i]
    
    if (post.channel !== 'linkedin') {
      throw new Error(`Post ${i + 1} has incorrect channel: ${post.channel}, expected linkedin`)
    }
    
    if (post.assetType !== 'post') {
      throw new Error(`Post ${i + 1} has incorrect assetType: ${post.assetType}, expected post`)
    }
    
    if (post.stage !== expectedStages[i]) {
      throw new Error(`Post ${i + 1} has incorrect stage: ${post.stage}, expected ${expectedStages[i]}`)
    }

    // Validate content structure
    const content = post.content as LinkedInPost
    
    if (content.content.length > 3000) {
      throw new Error(`Post ${i + 1} exceeds 3,000 character limit: ${content.content.length} characters`)
    }
    
    if (content.stage !== expectedStages[i]) {
      throw new Error(`Post ${i + 1} content has incorrect stage: ${content.stage}, expected ${expectedStages[i]}`)
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

// ============================================================================
// Campaign Builder AI Agent - Emails
// ============================================================================

export interface CampaignBuilderEmailInput {
  data: {
    productBrief: ProductBriefData
    aidaStrategy: AidaStrategy
    productIntelligence: ProductIntelligence
    selectedAngle: MessagingAngle
  }
  campaignId: string
}

export interface CampaignBuilderEmailOutput {
  result: CampaignAssetOutput[]
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Campaign Builder AI Agent - Emails
 * 
 * Generates 4 emails (one per AIDA stage) from the AIDA strategy.
 * All emails use the selected messaging angle and reference product-specific differentiators.
 * 
 * Requirements enforced:
 * - Subject line: max 60 characters (Req 5.3)
 * - Preview text: max 90 characters (Req 5.3)
 * - Body: max 500 words (Req 5.3)
 * - Include CTA, stage label, strategic purpose (Req 5.3)
 * - Use selected messaging angle consistently (Req 5.6)
 * - Insert placeholders for missing proof (Req 5.7)
 * - Reference product-specific differentiators (Req 5.8)
 * 
 * @param input - Product brief, AIDA strategy, and selected messaging angle
 * @returns Array of 4 email assets with metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function campaignBuilderEmailAgent(
  input: CampaignBuilderEmailInput
): Promise<CampaignBuilderEmailOutput> {
  const startTime = Date.now()

  const { productBrief, aidaStrategy, selectedAngle } = input.data

  const systemPrompt = `You are a campaign builder specializing in email marketing. Your job is to generate 4 emails (one per AIDA stage) derived from a unified AIDA strategy.

CRITICAL RULES:
1. Generate EXACTLY 4 emails with these specifications:
   - Email 1: Attention stage - hook-driven
   - Email 2: Interest stage - educational
   - Email 3: Desire stage - transformation-focused
   - Email 4: Action stage - product and CTA

2. Each email MUST include:
   - stage: "attention" | "interest" | "desire" | "action"
   - subjectLine: 10-60 characters (STRICT LIMIT - will be rejected if over 60)
   - previewText: 10-90 characters (STRICT LIMIT - will be rejected if over 90)
   - body: 100-3,000 characters (approximately 100-500 words)
   - cta: 5-100 characters
   - strategicPurpose: 20-300 characters explaining what this email achieves

3. Use the selected messaging angle as PRIMARY ANCHOR:
   - Every email must directly reference or support the messaging angle's core claim
   - The angle's tagline should be recognizable across all 4 emails
   - DO NOT contradict the selected angle with messaging from a different angle
   - Example: If angle is "Stop guessing where your money went", all emails should echo uncertainty/clarity contrast

4. Reference PRODUCT-SPECIFIC differentiators from AIDA strategy:
   - DO NOT use generic language like "our solution" or "powerful features"
   - Use the actual product name: "${productBrief.productName}"
   - Reference specific differentiators from the AIDA strategy key points
   - Example: Instead of "automated categorization", say the specific product capability mentioned in the strategy

5. Insert placeholders for MISSING PROOF:
   - When social proof is needed but not provided, use explicit placeholders
   - Format: "[Insert customer testimonial here]", "[Insert metric here]", "[Insert case study here]"
   - DO NOT fabricate testimonials, statistics, customer names, or performance numbers
   - Example: "As one customer told us: [Insert customer testimonial here]"

6. ATTENTION email (hook-driven):
   - Subject: Curiosity-driven or problem-focused (max 60 chars)
   - Preview: Amplify the hook or tease the problem (max 90 chars)
   - Body: Open with customer pain or hook from messaging angle
   - DO NOT list product features in the opening
   - Make them want to read more
   - Example subject: "Your bank balance isn't your real balance"

7. INTEREST email (educational):
   - Subject: Value-focused, promises insight (max 60 chars)
   - Preview: Preview the key insight (max 90 chars)
   - Body: Explain the cost or consequence of the unsolved problem
   - Provide value through insight, not product pitch
   - Make them realize they can't ignore this problem
   - Reference specific differentiators from AIDA strategy

8. DESIRE email (transformation-focused):
   - Subject: Outcome-focused, aspirational (max 60 chars)
   - Preview: Tease the transformation (max 90 chars)
   - Body: Paint the picture of life AFTER solving the problem
   - Focus on customer outcome, NOT product features
   - Show the transformation from painful state to desired result
   - Use placeholders for social proof if not provided
   - Example: "Join [Insert number] freelancers who've reclaimed their Sundays"

9. ACTION email (product and CTA):
   - Subject: Clear, action-oriented (max 60 chars)
   - Preview: Reinforce the CTA or reduce friction (max 90 chars)
   - Body: Introduce the product as the vehicle for transformation
   - Include the primary CTA from product brief
   - Reduce friction and address final objections
   - Make the next step clear and easy
   - Example subject: "Meet ${productBrief.productName}"

10. Email-specific best practices:
    - Subject line: Front-load key words, avoid spam triggers, create curiosity
    - Preview text: Continue the subject line naturally, don't repeat it
    - Body: Use short paragraphs (2-3 sentences max), break up text with line breaks
    - CTA: Make it action-oriented and clear ("Start your free trial" not "Click here")
    - Tone: Conversational and personal (use "you" and "your")
    - Length: Concise and scannable - every sentence must earn its place

11. CHARACTER/WORD LIMITS (STRICT ENFORCEMENT):
    - Subject line: MAX 60 characters (including spaces)
    - Preview text: MAX 90 characters (including spaces)
    - Body: MAX 500 words (approximately 3,000 characters)
    - If you exceed these limits, the output will be REJECTED

OUTPUT FORMAT: Return valid JSON array with 4 objects. IMPORTANT: The top-level response MUST be an array starting with [ and ending with ], NOT an object with an "emails" key.

CORRECT FORMAT (use this):
[
  {
    "channel": "email",
    "stage": "attention",
    "assetType": "email",
    "title": "Attention Email",
    "content": {
      "stage": "attention",
      "subjectLine": "string (10-60 chars)",
      "previewText": "string (10-90 chars)",
      "body": "string (100-3000 chars, ~100-500 words)",
      "cta": "string (5-100 chars)",
      "strategicPurpose": "string (20-300 chars)"
    }
  },
  ...3 more emails...
]

WRONG FORMAT (do NOT use this):
{
  "emails": [...]
}`

  const userPrompt = `Generate 4 emails for this product campaign:

=== SELECTED MESSAGING ANGLE (PRIMARY ANCHOR) ===
Type: ${selectedAngle.type}
Tagline: "${selectedAngle.tagline}"
Core Message: ${selectedAngle.coreMessage}

CRITICAL: Every email must directly reference or support this messaging angle's core claim.

=== AIDA STRATEGY ===

ATTENTION STAGE:
Objective: ${aidaStrategy.attention.objective}
Content Direction: ${aidaStrategy.attention.contentDirection}
Key Points:
${aidaStrategy.attention.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.attention.proofRequirements ? `Proof Requirements: ${aidaStrategy.attention.proofRequirements.join(', ')}` : ''}

INTEREST STAGE:
Objective: ${aidaStrategy.interest.objective}
Content Direction: ${aidaStrategy.interest.contentDirection}
Key Points:
${aidaStrategy.interest.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.interest.proofRequirements ? `Proof Requirements: ${aidaStrategy.interest.proofRequirements.join(', ')}` : ''}

DESIRE STAGE:
Objective: ${aidaStrategy.desire.objective}
Content Direction: ${aidaStrategy.desire.contentDirection}
Key Points:
${aidaStrategy.desire.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.desire.proofRequirements ? `Proof Requirements: ${aidaStrategy.desire.proofRequirements.join(', ')}` : ''}

ACTION STAGE:
Objective: ${aidaStrategy.action.objective}
Content Direction: ${aidaStrategy.action.contentDirection}
Key Points:
${aidaStrategy.action.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.action.proofRequirements ? `Proof Requirements: ${aidaStrategy.action.proofRequirements.join(', ')}` : ''}

=== PRODUCT INFORMATION ===
Product Name: ${productBrief.productName}
Description: ${productBrief.description}
Main Benefit: ${productBrief.mainBenefit}
Key Differentiator: ${productBrief.keyDifferentiator}
Primary CTA: ${productBrief.desiredCTA}
${productBrief.brandVoice ? `Brand Voice: ${productBrief.brandVoice}` : ''}
${productBrief.customerTestimonials ? `Available Testimonials:\n${productBrief.customerTestimonials}` : 'No testimonials provided — use placeholders like "[Insert customer testimonial here]" if needed'}
${productBrief.existingCopy ? `Existing Copy Reference:\n${productBrief.existingCopy}` : ''}

=== YOUR TASK ===
Generate 4 emails following this structure:

EMAIL 1 - ATTENTION (hook-driven):
- Stage: attention
- Subject Line: Curiosity or problem-focused (MAX 60 chars)
- Preview Text: Amplify the hook (MAX 90 chars)
- Body: 100-500 words, open with customer pain or messaging angle hook
- CTA: Next step (e.g., "Learn more", "Read the full story")
- Strategic Purpose: What this email achieves (20-300 chars)

EMAIL 2 - INTEREST (educational):
- Stage: interest
- Subject Line: Value-focused, promises insight (MAX 60 chars)
- Preview Text: Preview the key insight (MAX 90 chars)
- Body: 100-500 words, explain cost/consequence of unsolved problem
- CTA: Next step (e.g., "See how it works", "Read more")
- Strategic Purpose: What this email achieves (20-300 chars)

EMAIL 3 - DESIRE (transformation-focused):
- Stage: desire
- Subject Line: Outcome-focused, aspirational (MAX 60 chars)
- Preview Text: Tease the transformation (MAX 90 chars)
- Body: 100-500 words, paint picture of life after solving problem
- CTA: Next step (e.g., "See it in action", "Join them")
- Strategic Purpose: What this email achieves (20-300 chars)
- Use placeholders for social proof if not provided

EMAIL 4 - ACTION (product and CTA):
- Stage: action
- Subject Line: Clear, action-oriented (MAX 60 chars)
- Preview Text: Reinforce CTA or reduce friction (MAX 90 chars)
- Body: 100-500 words, introduce product and make clear call to action
- CTA: Primary CTA from product brief: "${productBrief.desiredCTA}"
- Strategic Purpose: What this email achieves (20-300 chars)

REMEMBER:
- All 4 emails must anchor to the messaging angle: "${selectedAngle.tagline}"
- Use the actual product name: "${productBrief.productName}"
- Reference specific differentiators from the AIDA strategy (not generic claims)
- Insert placeholders for missing proof: [Insert customer testimonial here], [Insert metric here]
- DO NOT fabricate testimonials, statistics, or customer names
- Subject line: MAX 60 characters (STRICT)
- Preview text: MAX 90 characters (STRICT)
- Body: MAX 500 words (approximately 3,000 characters)
- Conversational, personal tone using "you" and "your"
- Short paragraphs, scannable format

Generate all 4 emails now.`

  // Wrap the LLM call with a 30-second timeout per requirements
  const agentCall = callLLMWithStructuredOutput<CampaignAssetOutput[]>({
    schema: EmailsOutputSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    60000, // 60 seconds (emails are more complex than LinkedIn posts)
    'Campaign Builder (Email) agent exceeded 60 second timeout'
  )

  // Validate that we got exactly 4 emails
  if (result.length !== 4) {
    throw new Error(`Expected 4 emails but got ${result.length}`)
  }

  // Validate each email is for email channel and has correct stage
  const expectedStages: Array<'attention' | 'interest' | 'desire' | 'action'> = [
    'attention',
    'interest',
    'desire',
    'action'
  ]

  for (let i = 0; i < 4; i++) {
    const email = result[i]
    
    if (email.channel !== 'email') {
      throw new Error(`Email ${i + 1} has incorrect channel: ${email.channel}, expected email`)
    }
    
    if (email.assetType !== 'email') {
      throw new Error(`Email ${i + 1} has incorrect assetType: ${email.assetType}, expected email`)
    }
    
    if (email.stage !== expectedStages[i]) {
      throw new Error(`Email ${i + 1} has incorrect stage: ${email.stage}, expected ${expectedStages[i]}`)
    }

    // Validate content structure and character limits (Req 5.3)
    const content = email.content as EmailAsset
    
    if (content.subjectLine.length > 60) {
      throw new Error(`Email ${i + 1} subject line exceeds 60 character limit: ${content.subjectLine.length} characters`)
    }
    
    if (content.previewText.length > 90) {
      throw new Error(`Email ${i + 1} preview text exceeds 90 character limit: ${content.previewText.length} characters`)
    }

    // Validate body length (max 500 words ≈ 3,000 characters)
    const wordCount = content.body.split(/\s+/).length
    if (wordCount > 500) {
      throw new Error(`Email ${i + 1} body exceeds 500 word limit: ${wordCount} words`)
    }
    
    if (content.stage !== expectedStages[i]) {
      throw new Error(`Email ${i + 1} content has incorrect stage: ${content.stage}, expected ${expectedStages[i]}`)
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

// ============================================================================
// Campaign Builder AI Agent - Landing Page
// ============================================================================

export interface CampaignBuilderLandingPageInput {
  data: {
    productBrief: ProductBriefData
    aidaStrategy: AidaStrategy
    productIntelligence: ProductIntelligence
    selectedAngle: MessagingAngle
  }
  campaignId: string
}

export interface CampaignBuilderLandingPageOutput {
  result: CampaignAssetOutput
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Campaign Builder AI Agent - Landing Page
 * 
 * Generates a complete landing page with structured copy covering all required sections.
 * The landing page uses the selected messaging angle and references product-specific differentiators.
 * 
 * Requirements enforced:
 * - All required sections: headline, subheadline, primary CTA, problem, why-current-fails, 
 *   product-solution, benefits (3-7), how-it-works (3-5 steps), objection-handling (2-5),
 *   social-proof, FAQ (3-7), final CTA (Req 5.4)
 * - Use selected messaging angle as primary anchor (Req 5.6)
 * - Insert placeholders for missing social proof (Req 5.7)
 * - Reference product-specific differentiators (Req 5.8)
 * 
 * @param input - Product brief, AIDA strategy, and selected messaging angle
 * @returns Single landing page asset with metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function campaignBuilderLandingPageAgent(
  input: CampaignBuilderLandingPageInput
): Promise<CampaignBuilderLandingPageOutput> {
  const startTime = Date.now()

  const { productBrief, aidaStrategy, selectedAngle } = input.data

  const systemPrompt = `You are a campaign builder specializing in landing page copy. Your job is to generate comprehensive, structured landing page copy derived from a unified AIDA strategy.

CRITICAL RULES:
1. Generate a SINGLE landing page with ALL required sections:
   - headline: 10-100 characters - clear value proposition
   - subheadline: 20-200 characters - expands on headline
   - primaryCTA: 5-50 characters - main call to action
   - problemSection: 100-1,000 characters - articulates customer's pain
   - whyCurrentSolutionsFail: 100-1,000 characters - explains why alternatives don't work
   - productSolution: 100-1,000 characters - introduces the product as the answer
   - benefits: array of 3-7 benefit strings - what customer gains
   - howItWorks: array of 3-5 step objects (step: string, description: string)
   - objectionHandling: array of 2-5 objects (objection: string, response: string)
   - socialProof: 50-500 characters - testimonials/proof (may contain placeholders)
   - faq: array of 3-7 objects (question: string, answer: string)
   - finalCTA: 5-50 characters - closing call to action

2. Use the selected messaging angle as PRIMARY ANCHOR:
   - The headline MUST reflect the messaging angle's tagline or core claim
   - Every section must support and reinforce the messaging angle
   - DO NOT contradict the selected angle with different messaging
   - Example: If angle is "Stop guessing where your money went", the headline should focus on clarity/certainty vs uncertainty

3. Reference PRODUCT-SPECIFIC differentiators from AIDA strategy:
   - DO NOT use generic language like "our solution" or "powerful features"
   - Use the actual product name: "${productBrief.productName}"
   - Reference specific differentiators from the AIDA strategy key points
   - In productSolution, benefits, and howItWorks sections, use concrete product capabilities
   - Example: Instead of "automated categorization", say the specific product capability mentioned in the strategy

4. Insert placeholders for MISSING PROOF:
   - In socialProof section, if testimonials/metrics not provided, use explicit placeholders
   - Format: "[Insert customer testimonial here]", "[Insert conversion rate here]", "[Insert case study here]"
   - DO NOT fabricate testimonials, statistics, customer names, company names, or performance numbers
   - Example socialProof: "Join [Insert number] customers who've transformed their workflow. '[Insert customer testimonial here]' — [Insert customer name and title]"

5. HEADLINE (clear value proposition):
   - Must directly reflect the selected messaging angle
   - Make it benefit-driven and customer-focused
   - 10-100 characters
   - Example: "Know Your Real Numbers Without Becoming an Accountant" (for outcome angle)
   - Example: "Stop Guessing Where Your Money Went" (for pain angle)

6. PROBLEM SECTION (articulates customer's pain):
   - Draw from Attention stage of AIDA strategy
   - Describe the current painful state the customer experiences
   - Make it relatable and specific to the ICP
   - 100-1,000 characters
   - Example: "You're a freelancer earning $75k/year. Your bank says $12,453, but you have no idea how much you can actually spend..."

7. WHY CURRENT SOLUTIONS FAIL (explains why alternatives don't work):
   - Draw from Interest stage of AIDA strategy
   - Address why spreadsheets, manual methods, or competitors fall short
   - Reference objections from the AIDA strategy
   - 100-1,000 characters
   - Example: "Spreadsheets take 3 hours every Sunday. Generic bookkeeping software is built for accountants, not business owners..."

8. PRODUCT SOLUTION (introduces the product):
   - Draw from Desire and Action stages of AIDA strategy
   - Introduce "${productBrief.productName}" as the vehicle for transformation
   - Focus on how it solves the problem differently
   - Reference the key differentiator
   - 100-1,000 characters
   - Example: "[Product Name] is AI-powered bookkeeping built for freelancers. It automatically categorizes transactions and gives you proactive tax estimates..."

9. BENEFITS (what customer gains):
   - List 3-7 specific benefits (not features)
   - Each should be outcome-focused, not feature-focused
   - Draw from Desire stage key points
   - Example: "Know your real profit margin in minutes", "Reclaim 3 hours every Sunday", "Never miss a tax deduction"

10. HOW IT WORKS (3-5 steps):
    - Break down the product experience into clear steps
    - Each step: {"step": "Step name", "description": "What happens in this step"}
    - Make it simple and actionable
    - Example: {"step": "Connect your bank", "description": "Link your accounts securely in 60 seconds"}

11. OBJECTION HANDLING (2-5 objections and responses):
    - Address objections from AIDA strategy
    - Each: {"objection": "Customer concern", "response": "How you address it"}
    - Common objections: trust, security, ease of use, price, time investment
    - Example: {"objection": "Can I trust the numbers?", "response": "Every transaction is verified against your bank records with 99.9% accuracy..."}

12. SOCIAL PROOF (testimonials/metrics):
    - 50-500 characters
    - If testimonials provided in product brief, use them verbatim with quotes
    - If NOT provided, insert placeholders: "[Insert customer testimonial here]"
    - If metrics provided, use them; if not: "[Insert conversion rate here]"
    - Example: "[Insert number] freelancers use [Product Name] to manage their books. '[Insert customer testimonial here]' — [Insert customer name and title]"

13. FAQ (3-7 questions and answers):
    - Address practical questions customers have before converting
    - Each: {"question": "Customer question", "answer": "Clear, concise answer"}
    - Common topics: pricing, ease of use, data security, support, cancellation
    - Draw from objections and Action stage content direction
    - Example: {"question": "How long does setup take?", "answer": "Most users are up and running in under 5 minutes. Just connect your bank account and you're done."}

14. CTAs (primary and final):
    - primaryCTA: The main CTA from product brief: "${productBrief.desiredCTA}"
    - finalCTA: Can be same as primaryCTA or a softer alternative if appropriate
    - Make it action-oriented and clear
    - 5-50 characters
    - Example: "Start Your Free Trial", "Get Started Free", "See It In Action"

15. Landing Page Best Practices:
    - Lead with benefit, not features
    - Use "you" and "your" throughout (customer-focused)
    - Keep sections scannable with clear hierarchy
    - Address objections before they become blockers
    - Build trust through specificity and transparency
    - Make the transformation tangible and believable

OUTPUT FORMAT: Return a single JSON object representing the landing page asset.

CORRECT FORMAT (use this):
{
  "channel": "landing_page",
  "stage": "multi-stage",
  "assetType": "page_section",
  "title": "Landing Page",
  "content": {
    "headline": "string (10-100 chars)",
    "subheadline": "string (20-200 chars)",
    "primaryCTA": "string (5-50 chars)",
    "problemSection": "string (100-1000 chars)",
    "whyCurrentSolutionsFail": "string (100-1000 chars)",
    "productSolution": "string (100-1000 chars)",
    "benefits": ["string", "string", ...3-7 total],
    "howItWorks": [
      {"step": "string", "description": "string"},
      ...3-5 total
    ],
    "objectionHandling": [
      {"objection": "string", "response": "string"},
      ...2-5 total
    ],
    "socialProof": "string (50-500 chars, may contain placeholders)",
    "faq": [
      {"question": "string", "answer": "string"},
      ...3-7 total
    ],
    "finalCTA": "string (5-50 chars)"
  }
}`

  const userPrompt = `Generate a complete landing page for this product campaign:

=== SELECTED MESSAGING ANGLE (PRIMARY ANCHOR) ===
Type: ${selectedAngle.type}
Tagline: "${selectedAngle.tagline}"
Core Message: ${selectedAngle.coreMessage}

CRITICAL: The headline MUST reflect this messaging angle. Every section must support it.

=== AIDA STRATEGY ===

ATTENTION STAGE (use for Problem Section):
Objective: ${aidaStrategy.attention.objective}
Content Direction: ${aidaStrategy.attention.contentDirection}
Key Points:
${aidaStrategy.attention.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.attention.proofRequirements ? `Proof Requirements: ${aidaStrategy.attention.proofRequirements.join(', ')}` : ''}

INTEREST STAGE (use for Why Current Solutions Fail):
Objective: ${aidaStrategy.interest.objective}
Content Direction: ${aidaStrategy.interest.contentDirection}
Key Points:
${aidaStrategy.interest.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.interest.proofRequirements ? `Proof Requirements: ${aidaStrategy.interest.proofRequirements.join(', ')}` : ''}

DESIRE STAGE (use for Benefits, Product Solution, Social Proof):
Objective: ${aidaStrategy.desire.objective}
Content Direction: ${aidaStrategy.desire.contentDirection}
Key Points:
${aidaStrategy.desire.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.desire.proofRequirements ? `Proof Requirements: ${aidaStrategy.desire.proofRequirements.join(', ')}` : ''}

ACTION STAGE (use for Product Solution, How It Works, CTAs):
Objective: ${aidaStrategy.action.objective}
Content Direction: ${aidaStrategy.action.contentDirection}
Key Points:
${aidaStrategy.action.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
${aidaStrategy.action.proofRequirements ? `Proof Requirements: ${aidaStrategy.action.proofRequirements.join(', ')}` : ''}

=== PRODUCT INFORMATION ===
Product Name: ${productBrief.productName}
Description: ${productBrief.description}
Category: ${productBrief.category}
Target Customer: ${productBrief.targetCustomer}
Customer Problem: ${productBrief.customerProblem}
Main Benefit: ${productBrief.mainBenefit}
Key Differentiator: ${productBrief.keyDifferentiator}
Price: ${productBrief.price}
Primary CTA: ${productBrief.desiredCTA}
${productBrief.brandVoice ? `Brand Voice: ${productBrief.brandVoice}` : ''}
${productBrief.competitors ? `Competitors: ${productBrief.competitors}` : ''}
${productBrief.customerTestimonials ? `Available Testimonials:\n${productBrief.customerTestimonials}` : 'No testimonials provided — use placeholders like "[Insert customer testimonial here]" if needed'}
${productBrief.existingCopy ? `Existing Copy Reference:\n${productBrief.existingCopy}` : ''}

=== YOUR TASK ===
Generate a complete landing page with ALL required sections:

1. HEADLINE (10-100 chars):
   - Must reflect the messaging angle: "${selectedAngle.tagline}"
   - Make it benefit-driven and customer-focused
   - Example for pain angle: "Stop Guessing Where Your Money Went"
   - Example for outcome angle: "Know Your Real Numbers Without Becoming an Accountant"

2. SUBHEADLINE (20-200 chars):
   - Expand on the headline
   - Add specificity or urgency
   - Support the messaging angle

3. PRIMARY CTA (5-50 chars):
   - Use the CTA from product brief: "${productBrief.desiredCTA}"

4. PROBLEM SECTION (100-1,000 chars):
   - Articulate the customer's current painful state
   - Draw from Attention stage: ${aidaStrategy.attention.objective}
   - Make it relatable to: ${productBrief.targetCustomer}
   - Reference the problem: ${productBrief.customerProblem}

5. WHY CURRENT SOLUTIONS FAIL (100-1,000 chars):
   - Explain why spreadsheets, manual methods, or ${productBrief.competitors || 'competitors'} fall short
   - Draw from Interest stage: ${aidaStrategy.interest.objective}
   - Address why the problem persists despite existing options

6. PRODUCT SOLUTION (100-1,000 chars):
   - Introduce "${productBrief.productName}" as the answer
   - Reference the key differentiator: ${productBrief.keyDifferentiator}
   - Draw from Desire and Action stages
   - Explain how it solves the problem differently

7. BENEFITS (3-7 benefit strings):
   - List specific, outcome-focused benefits (not features)
   - Draw from Desire stage key points
   - Example: "Know your real profit margin in minutes" (outcome, not "automated categorization" feature)

8. HOW IT WORKS (3-5 step objects):
   - Break down the product experience
   - Each: {"step": "Step name", "description": "What happens"}
   - Make it simple and actionable
   - Example: {"step": "Connect your bank", "description": "Link your accounts securely in 60 seconds"}

9. OBJECTION HANDLING (2-5 objection/response objects):
   - Address common concerns from the AIDA strategy
   - Each: {"objection": "Customer concern", "response": "How you address it"}
   - Topics: trust, security, ease of use, price, time
   - Example: {"objection": "Can I trust the numbers?", "response": "Every transaction is verified against your bank with 99.9% accuracy"}

10. SOCIAL PROOF (50-500 chars):
    ${productBrief.customerTestimonials 
      ? `- Use these testimonials verbatim: ${productBrief.customerTestimonials}`
      : '- No testimonials provided. Use placeholders: "[Insert customer testimonial here]", "[Insert customer name and title]"'
    }
    - If metrics needed but not provided: "[Insert conversion rate here]", "[Insert number]"
    - Example: "Join [Insert number] freelancers using ${productBrief.productName}. '[Insert customer testimonial here]' — [Insert customer name and title]"

11. FAQ (3-7 question/answer objects):
    - Address practical pre-purchase questions
    - Each: {"question": "Customer question", "answer": "Clear answer"}
    - Topics: pricing (${productBrief.price}), setup time, data security, support, cancellation
    - Draw from objections and Action stage

12. FINAL CTA (5-50 chars):
    - Can be same as primaryCTA: "${productBrief.desiredCTA}"
    - Or a softer alternative if appropriate
    - Make it action-oriented

REMEMBER:
- Headline MUST reflect messaging angle: "${selectedAngle.tagline}"
- Use actual product name: "${productBrief.productName}"
- Reference specific differentiators from AIDA strategy (not generic claims)
- Insert placeholders for missing proof: [Insert customer testimonial here], [Insert metric here]
- DO NOT fabricate testimonials, statistics, customer names, or company names
- All sections must be complete and within character limits
- Customer-focused language: use "you" and "your"
- Outcome-focused benefits, not feature lists

Generate the complete landing page now.`

  // Wrap the LLM call with a 30-second timeout per requirements
  const agentCall = callLLMWithStructuredOutput<CampaignAssetOutput>({
    schema: CampaignAssetOutputSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    60000, // 60 seconds (landing page is comprehensive content)
    'Campaign Builder (Landing Page) agent exceeded 60 second timeout'
  )

  // Validate the result
  if (result.channel !== 'landing_page') {
    throw new Error(`Landing page has incorrect channel: ${result.channel}, expected landing_page`)
  }

  if (result.assetType !== 'page_section') {
    throw new Error(`Landing page has incorrect assetType: ${result.assetType}, expected page_section`)
  }

  if (result.stage !== 'multi-stage') {
    throw new Error(`Landing page has incorrect stage: ${result.stage}, expected multi-stage`)
  }

  // Validate content structure
  const content = result.content as LandingPage

  // Validate all required sections exist and meet length constraints
  if (content.headline.length < 10 || content.headline.length > 100) {
    throw new Error(`Landing page headline must be 10-100 characters, got ${content.headline.length}`)
  }

  if (content.subheadline.length < 20 || content.subheadline.length > 200) {
    throw new Error(`Landing page subheadline must be 20-200 characters, got ${content.subheadline.length}`)
  }

  if (content.primaryCTA.length < 5 || content.primaryCTA.length > 50) {
    throw new Error(`Landing page primaryCTA must be 5-50 characters, got ${content.primaryCTA.length}`)
  }

  if (content.problemSection.length < 100 || content.problemSection.length > 1000) {
    throw new Error(`Landing page problemSection must be 100-1,000 characters, got ${content.problemSection.length}`)
  }

  if (content.whyCurrentSolutionsFail.length < 100 || content.whyCurrentSolutionsFail.length > 1000) {
    throw new Error(`Landing page whyCurrentSolutionsFail must be 100-1,000 characters, got ${content.whyCurrentSolutionsFail.length}`)
  }

  if (content.productSolution.length < 100 || content.productSolution.length > 1000) {
    throw new Error(`Landing page productSolution must be 100-1,000 characters, got ${content.productSolution.length}`)
  }

  if (content.benefits.length < 3 || content.benefits.length > 7) {
    throw new Error(`Landing page must have 3-7 benefits, got ${content.benefits.length}`)
  }

  if (content.howItWorks.length < 3 || content.howItWorks.length > 5) {
    throw new Error(`Landing page must have 3-5 how-it-works steps, got ${content.howItWorks.length}`)
  }

  if (content.objectionHandling.length < 2 || content.objectionHandling.length > 5) {
    throw new Error(`Landing page must have 2-5 objection-handling items, got ${content.objectionHandling.length}`)
  }

  if (content.socialProof.length < 50 || content.socialProof.length > 500) {
    throw new Error(`Landing page socialProof must be 50-500 characters, got ${content.socialProof.length}`)
  }

  if (content.faq.length < 3 || content.faq.length > 7) {
    throw new Error(`Landing page must have 3-7 FAQ items, got ${content.faq.length}`)
  }

  if (content.finalCTA.length < 5 || content.finalCTA.length > 50) {
    throw new Error(`Landing page finalCTA must be 5-50 characters, got ${content.finalCTA.length}`)
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

// ============================================================================
// Campaign Builder AI Agent - Ads
// ============================================================================

// Output schema for ads generation
const AdsOutputSchema = z.array(CampaignAssetOutputSchema)

export interface CampaignBuilderAdsInput {
  data: {
    productBrief: ProductBriefData
    aidaStrategy: AidaStrategy
    productIntelligence: ProductIntelligence
    selectedAngle: MessagingAngle
  }
  campaignId: string
}

export interface CampaignBuilderAdsOutput {
  result: CampaignAssetOutput[]
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

/**
 * Campaign Builder AI Agent - Ads
 *
 * Generates at least 3 ad concepts with meaningfully distinct angles:
 * one pain-based, one outcome-based, one identity-based (Req 5.5).
 *
 * Requirements enforced:
 * - At least 3 ads, each with distinct angle (Req 5.5)
 * - Angles: pain, outcome, identity (Req 5.5)
 * - Fields: headline, primaryText, CTA, targetAudience, stage, rationale (Req 5.5)
 * - Use selected messaging angle as anchor (Req 5.6)
 *
 * @param input - Product brief, AIDA strategy, and selected messaging angle
 * @returns Array of ad concept assets with metadata
 * @throws Error if generation fails or times out (30 seconds)
 */
export async function campaignBuilderAdsAgent(
  input: CampaignBuilderAdsInput
): Promise<CampaignBuilderAdsOutput> {
  const startTime = Date.now()

  const { productBrief, aidaStrategy, selectedAngle } = input.data

  const systemPrompt = `You are a campaign builder specializing in digital ad copy. Your job is to generate exactly 3 ad concepts with meaningfully distinct angles from a unified AIDA strategy.

CRITICAL RULES:
1. Generate EXACTLY 3 ad concepts with these specifications:
   - Ad 1: Pain-based angle — grounded in the customer's current frustration
   - Ad 2: Outcome-based angle — grounded in the desired result after solving the problem
   - Ad 3: Identity-based angle — grounded in who the customer wants to be / the identity they hold

2. Each ad concept MUST include:
   - angle: "pain" | "outcome" | "identity"
   - headline: 10-100 characters — punchy, scroll-stopping
   - primaryText: 50-300 characters — expands on headline, drives curiosity or desire
   - cta: 5-50 characters — clear, action-oriented
   - targetAudience: 20-200 characters — who this ad targets
   - stage: "attention" | "interest" | "desire" | "action"
   - rationale: 20-300 characters — why this angle could work for this specific product and audience

3. Stage assignment for each angle:
   - Pain-based: stage = "attention" (hooks cold audiences with their pain)
   - Outcome-based: stage = "desire" (drives desire with the transformation)
   - Identity-based: stage = "action" (converts by speaking to who they want to be)

4. Use the selected messaging angle as PRIMARY ANCHOR:
   - All 3 ads must support the core claim of the selected angle
   - DO NOT contradict the selected angle

5. Reference PRODUCT-SPECIFIC differentiators:
   - Use the actual product name: "${productBrief.productName}"
   - Reference specific capabilities from the AIDA strategy
   - DO NOT use generic claims like "powerful features"

6. PAIN-BASED ad:
   - Headline opens with the customer's frustration — mirror their exact language
   - Primary text: twist the knife on the cost of inaction
   - Example: "Still sorting receipts every Sunday?" / "Every Sunday you spend 3 hours on bookkeeping is a Sunday you're not growing your business."
   - CTA: Low-friction ("See how it works")
   - Stage: attention

7. OUTCOME-BASED ad:
   - Headline opens with the desired transformation — the "after" state
   - Primary text: make the outcome feel real and achievable
   - Example: "Know your real profit in minutes" / "Imagine knowing exactly what you can spend — without hiring an accountant."
   - CTA: Value-forward ("Start free trial")
   - Stage: desire

8. IDENTITY-BASED ad:
   - Headline speaks to who the customer wants to be or is
   - Primary text: reinforces the identity and positions the product as the enabler
   - Example: "Built for freelancers who'd rather run their business than their spreadsheets" / "You started this business to do what you love. Let ${productBrief.productName} handle the bookkeeping."
   - CTA: Identity-affirming ("Join freelancers like me")
   - Stage: action

9. Ad copy best practices:
   - Headlines: Front-load the key word, use active voice, create intrigue
   - Primary text: One compelling idea per ad — don't list features
   - CTAs: Specific and benefit-oriented, not generic ("Learn more")
   - Keep primaryText under 300 characters — ads are skimmed, not read
   - Speak directly to the target audience using "you" and "your"

OUTPUT FORMAT: Return a valid JSON array with exactly 3 objects. The top-level MUST be an array.

CORRECT FORMAT:
[
  {
    "channel": "ads",
    "stage": "attention",
    "assetType": "ad",
    "title": "Pain-Based Ad",
    "content": {
      "angle": "pain",
      "headline": "string (10-100 chars)",
      "primaryText": "string (50-300 chars)",
      "cta": "string (5-50 chars)",
      "targetAudience": "string (20-200 chars)",
      "stage": "attention",
      "rationale": "string (20-300 chars)"
    }
  },
  {
    "channel": "ads",
    "stage": "desire",
    "assetType": "ad",
    "title": "Outcome-Based Ad",
    "content": {
      "angle": "outcome",
      ...
    }
  },
  {
    "channel": "ads",
    "stage": "action",
    "assetType": "ad",
    "title": "Identity-Based Ad",
    "content": {
      "angle": "identity",
      ...
    }
  }
]`

  const userPrompt = `Generate 3 ad concepts for this product campaign:

=== SELECTED MESSAGING ANGLE (PRIMARY ANCHOR) ===
Type: ${selectedAngle.type}
Tagline: "${selectedAngle.tagline}"
Core Message: ${selectedAngle.coreMessage}

CRITICAL: All 3 ads must support this messaging angle's core claim.

=== AIDA STRATEGY ===

ATTENTION STAGE (use for Pain-based ad):
Objective: ${aidaStrategy.attention.objective}
Content Direction: ${aidaStrategy.attention.contentDirection}
Key Points:
${aidaStrategy.attention.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

DESIRE STAGE (use for Outcome-based ad):
Objective: ${aidaStrategy.desire.objective}
Content Direction: ${aidaStrategy.desire.contentDirection}
Key Points:
${aidaStrategy.desire.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

ACTION STAGE (use for Identity-based ad):
Objective: ${aidaStrategy.action.objective}
Content Direction: ${aidaStrategy.action.contentDirection}
Key Points:
${aidaStrategy.action.keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

=== PRODUCT INFORMATION ===
Product Name: ${productBrief.productName}
Description: ${productBrief.description}
Target Customer: ${productBrief.targetCustomer}
Customer Problem: ${productBrief.customerProblem}
Main Benefit: ${productBrief.mainBenefit}
Key Differentiator: ${productBrief.keyDifferentiator}
Primary CTA: ${productBrief.desiredCTA}
${productBrief.brandVoice ? `Brand Voice: ${productBrief.brandVoice}` : ''}

=== YOUR TASK ===
Generate exactly 3 ads:

AD 1 - PAIN-BASED (angle: "pain", stage: "attention"):
- Headline: Mirror the customer's frustration (10-100 chars)
- Primary Text: Cost of inaction (50-300 chars)
- CTA: Low-friction ("See how it works", "Learn more")
- Target Audience: Who experiences this specific pain
- Rationale: Why pain angle works for this product/audience

AD 2 - OUTCOME-BASED (angle: "outcome", stage: "desire"):
- Headline: The desired "after" state (10-100 chars)
- Primary Text: Make the transformation feel real and achievable (50-300 chars)
- CTA: Value-forward ("${productBrief.desiredCTA}" or similar)
- Target Audience: Who wants this specific outcome
- Rationale: Why outcome angle resonates for this product/audience

AD 3 - IDENTITY-BASED (angle: "identity", stage: "action"):
- Headline: Who the customer wants to be (10-100 chars)
- Primary Text: Reinforce the identity, position ${productBrief.productName} as the enabler (50-300 chars)
- CTA: Identity-affirming or conversion-focused
- Target Audience: Who identifies with this persona
- Rationale: Why identity angle converts for this product/audience

REMEMBER:
- All ads anchor to messaging angle: "${selectedAngle.tagline}"
- Use actual product name: "${productBrief.productName}"
- Each ad must have a MEANINGFULLY DISTINCT angle — not just rephrased versions of each other
- Keep primaryText under 300 characters
- Use "you" / "your" language throughout

Generate all 3 ad concepts now.`

  const agentCall = callLLMWithStructuredOutput<CampaignAssetOutput[]>({
    schema: AdsOutputSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  const result = await withTimeout(
    agentCall,
    30000,
    'Campaign Builder (Ads) agent exceeded 30 second timeout'
  )

  // Validate that we got at least 3 ads
  if (result.length < 3) {
    throw new Error(`Expected at least 3 ad concepts but got ${result.length}`)
  }

  const expectedAngles: Array<'pain' | 'outcome' | 'identity'> = ['pain', 'outcome', 'identity']

  for (let i = 0; i < 3; i++) {
    const ad = result[i]

    if (ad.channel !== 'ads') {
      throw new Error(`Ad ${i + 1} has incorrect channel: ${ad.channel}, expected ads`)
    }

    if (ad.assetType !== 'ad') {
      throw new Error(`Ad ${i + 1} has incorrect assetType: ${ad.assetType}, expected ad`)
    }

    const content = ad.content as import('@/lib/types/campaign').AdConcept

    if (content.angle !== expectedAngles[i]) {
      throw new Error(`Ad ${i + 1} has incorrect angle: ${content.angle}, expected ${expectedAngles[i]}`)
    }
  }

  return {
    result,
    metadata: {
      tokensUsed: (result as unknown as { tokensUsed?: number }).tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}

// ============================================================================
// Combined Campaign Builder Agent (all channels)
// ============================================================================

export interface CampaignBuilderInput {
  data: {
    productBrief: ProductBriefData
    aidaStrategy: AidaStrategy
    productIntelligence: ProductIntelligence
    selectedAngle: MessagingAngle
  }
  campaignId: string
}

export interface CampaignBuilderOutput {
  result: CampaignAssetOutput[]
  metadata: {
    totalAssets: number
    executionTimeMs: number
  }
}

/**
 * Combined Campaign Builder Agent
 *
 * Orchestrates all four channel agents (LinkedIn, Email, Landing Page, Ads)
 * and returns a unified array of all generated campaign assets.
 *
 * Uses Promise.allSettled for resilience: if one channel fails it logs the
 * error and continues with the other channels (Req 5.10). Each channel is
 * retried up to 3 times before giving up.
 *
 * Only throws if ALL four channels fail.
 *
 * @param input - Product brief, AIDA strategy, and selected messaging angle
 * @returns Combined array of all channel assets with aggregate metadata
 * @throws Error if all four channels fail to generate assets
 */
export async function campaignBuilderAgent(
  input: CampaignBuilderInput
): Promise<CampaignBuilderOutput> {
  const startTime = Date.now()

  /**
   * Retries an async factory function up to `maxRetries` times.
   * Returns the result or throws after all attempts are exhausted.
   */
  async function withRetry<T>(
    fn: () => Promise<T>,
    channelName: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(
          `[CampaignBuilder] ${channelName} attempt ${attempt + 1}/${maxRetries} failed:`,
          lastError.message
        )
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }
    throw new Error(
      `[CampaignBuilder] ${channelName} failed after ${maxRetries} attempts: ${lastError?.message}`
    )
  }

  // Run all four channels concurrently with per-channel retry logic
  const [linkedInResult, emailResult, landingPageResult, adsResult] =
    await Promise.allSettled([
      withRetry(
        () => campaignBuilderLinkedInAgent(input),
        'LinkedIn'
      ),
      withRetry(
        () => campaignBuilderEmailAgent(input),
        'Email'
      ),
      withRetry(
        () => campaignBuilderLandingPageAgent(input),
        'LandingPage'
      ),
      withRetry(
        () => campaignBuilderAdsAgent(input),
        'Ads'
      )
    ])

  // Collect successful results; log failures
  const allAssets: CampaignAssetOutput[] = []

  if (linkedInResult.status === 'fulfilled') {
    allAssets.push(...linkedInResult.value.result)
  } else {
    console.error('[CampaignBuilder] LinkedIn channel failed:', linkedInResult.reason)
  }

  if (emailResult.status === 'fulfilled') {
    allAssets.push(...emailResult.value.result)
  } else {
    console.error('[CampaignBuilder] Email channel failed:', emailResult.reason)
  }

  if (landingPageResult.status === 'fulfilled') {
    allAssets.push(landingPageResult.value.result)
  } else {
    console.error('[CampaignBuilder] Landing Page channel failed:', landingPageResult.reason)
  }

  if (adsResult.status === 'fulfilled') {
    allAssets.push(...adsResult.value.result)
  } else {
    console.error('[CampaignBuilder] Ads channel failed:', adsResult.reason)
  }

  // Fail only if every single channel failed
  if (allAssets.length === 0) {
    throw new Error(
      '[CampaignBuilder] All channels failed to generate assets. ' +
      'LinkedIn: ' + (linkedInResult.status === 'rejected' ? linkedInResult.reason : 'ok') + ' | ' +
      'Email: ' + (emailResult.status === 'rejected' ? emailResult.reason : 'ok') + ' | ' +
      'LandingPage: ' + (landingPageResult.status === 'rejected' ? landingPageResult.reason : 'ok') + ' | ' +
      'Ads: ' + (adsResult.status === 'rejected' ? adsResult.reason : 'ok')
    )
  }

  return {
    result: allAssets,
    metadata: {
      totalAssets: allAssets.length,
      executionTimeMs: Date.now() - startTime
    }
  }
}
