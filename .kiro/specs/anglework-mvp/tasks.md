# Implementation Plan: Anglework MVP

## Overview

This plan implements the Anglework MVP ? an AI-powered marketing strategist that transforms product information into complete, ready-to-execute marketing campaigns. The system orchestrates a six-stage AI pipeline built on Next.js 16 with React 19, using OpenRouter API for AI generation and Prisma with PostgreSQL (Neon) for persistence.

The implementation follows the priority order: Product Onboarding ? Product Intelligence ? Positioning Strategy ? AIDA Strategy ? Campaign Builder ? Campaign Critic ? Launch Calendar ? Campaign Dashboard. Each priority area is implemented incrementally with database models, backend logic, AI agents, and frontend components built in dependency order.

## Tasks

- [x] 1. Foundation: Core infrastructure and shared utilities
  - [x] 1.1 Set up TypeScript types and Zod schemas for all data models
    - Create `src/lib/types/campaign.ts` with all schemas from design (ProductIntelligence, Positioning, MessagingAngle, AidaStrategy, Asset types, Critique, LaunchCalendar)
    - Export TypeScript types derived from Zod schemas
    - _Requirements: Foundation for all pipeline stages_
  
  - [x] 1.2 Implement OpenRouter LLM client with structured output support
    - Create `src/lib/ai/llm-client.ts` with `callLLMWithStructuredOutput` function
    - Implement JSON mode with Zod validation and retry logic (max 3 retries, exponential backoff)
    - Add timeout wrapper function (`withTimeout`) for 30-second limits
    - _Requirements: 2.7-2.8, 3.7, 4.9_
  
  - [x] 1.3 Expand Prisma schema with complete database models
    - Add User, ProductBrief, Strategy, Asset, Critique, LaunchCalendar models to `prisma/schema.prisma`
    - Define all relationships and cascade deletes
    - Run `prisma db push` to sync with Neon database
    - Generate Prisma client
    - _Requirements: All requirements (data persistence)_

- [x] 2. Priority 1: Product Onboarding (Requirements 1.1-1.9)
  - [x] 2.1 Create ProductBriefForm component with validation
    - Build multi-field form in `src/app/campaign/new/page.tsx`
    - Include all required fields (productName, description, category, etc.) per Req 1.2
    - Include all optional fields (competitors, testimonials, etc.) per Req 1.3
    - Implement client-side validation for required fields
    - Add URL validation for websiteURL field per Req 1.9
    - Display field-specific error messages per Req 1.4
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9_
  
  - [x] 2.2 Implement createCampaignFromBrief server action
    - Create `src/actions/campaign.ts` with `'use server'` directive
    - Validate all required fields server-side
    - Create Campaign and ProductBrief records in transaction
    - Trigger pipeline orchestrator
    - Handle validation errors with field-specific messages
    - _Requirements: 1.4, 1.5_
  
  - [x] 2.3 Create pipeline orchestrator foundation
    - Create `src/lib/pipeline/orchestrator.ts` with `runCampaignPipeline` function
    - Implement campaign status update helper
    - Implement error handling with campaign status tracking
    - Set up structure for sequential agent execution
    - _Requirements: All requirements (orchestrates entire pipeline)_

- [x] 3. Priority 2: Product Intelligence (Requirements 2.1-2.9)
  - [x] 3.1 Implement Product Analyst AI agent
    - Create `src/lib/pipeline/agents/product-analyst.ts`
    - Build system prompt enforcing customer language for primary pain (5-30 words, first-person) per Req 2.3
    - Extract ICP, core problem, desired outcome, differentiators, objections (2-5) per Req 2.2, 2.4
    - Insert placeholders for missing proof per Req 2.6
    - Validate output against ProductIntelligenceSchema
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [x] 3.2 Integrate Product Analyst into pipeline orchestrator
    - Add Stage 1 (Product Analyst) to `runCampaignPipeline`
    - Create Strategy record with productIntelligence JSON
    - Update campaign status to "intelligence_complete"
    - Implement 30-second timeout per Req 2.8
    - Handle missing prerequisite fields per Req 2.9
    - _Requirements: 2.1, 2.7, 2.8, 2.9_
  
  - [x] 3.3 Create ProductIntelligenceCard component
    - Build display component in `src/components/ProductIntelligenceCard.tsx`
    - Render all Product Intelligence fields with clear hierarchy
    - Display ICP, primary pain, desired outcome, differentiators, objections, emotional drivers
    - Show recommended messaging angle
    - _Requirements: 2.2, 2.5_

- [x] 4. Priority 3: Positioning Strategy (Requirements 3.1-3.7)
  - [x] 4.1 Implement Positioning Strategist AI agent
    - Create `src/lib/pipeline/agents/positioning-strategist.ts`
    - Generate positioning statement (max 50 words), value proposition per Req 3.1
    - Generate exactly 3 messaging angles (pain, outcome, time) per Req 3.2
    - Include rationale (max 75 words) for each angle referencing product/customer/pain per Req 3.4
    - Insert placeholders for competitive data per Req 3.6
    - Validate output against PositioningOutputSchema
    - _Requirements: 3.1, 3.2, 3.4, 3.6_
  
  - [x] 4.2 Integrate Positioning Strategist into pipeline orchestrator
    - Add Stage 2 (Positioning Strategist) to `runCampaignPipeline`
    - Update Strategy record with positioning and messagingAngles JSON
    - Update campaign status to "positioning_complete"
    - Pause pipeline for user selection
    - Implement 30-second timeout per Req 3.7
    - _Requirements: 3.1, 3.3, 3.7_
  
  - [x] 4.3 Create PositioningStrategySelector component
    - Build angle selection UI in `src/components/PositioningStrategySelector.tsx`
    - Display 3 messaging angles as cards with tagline and rationale
    - Highlight selected angle
    - Disable selection after choice is made
    - Call selectMessagingAngle server action on selection
    - _Requirements: 3.3, 3.4_
  
  - [x] 4.4 Implement selectMessagingAngle server action
    - Add function to `src/actions/campaign.ts`
    - Update Strategy.selectedAngleIndex in database
    - Create `resumePipelineAfterAngleSelection` function in orchestrator
    - Trigger AIDA Strategy generation
    - _Requirements: 3.3, 3.5_

- [x] 5. Priority 4: AIDA Strategy (Requirements 4.1-4.9)
  - [x] 5.1 Implement AIDA Strategist AI agent
    - Create `src/lib/pipeline/agents/aida-strategist.ts`
    - Generate 4 stages (Attention, Interest, Desire, Action) with objective and content direction per Req 4.2
    - Ground Attention in pain/hook (not features) per Req 4.3
    - Ground Interest in cost of unsolved problem per Req 4.4
    - Ground Desire in customer outcome transformation per Req 4.5
    - Include both primary and secondary CTA if provided per Req 4.6
    - Insert placeholders for missing social proof per Req 4.8
    - Validate output against AidaStrategySchema
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [x] 5.2 Integrate AIDA Strategist into pipeline orchestrator
    - Add Stage 3 (AIDA Strategist) to `resumePipelineAfterAngleSelection`
    - Update Strategy record with aidaStrategy JSON
    - Update campaign status to "aida_complete"
    - Validate all 4 stages present with non-empty fields per Req 4.9
    - _Requirements: 4.1, 4.7, 4.9_
  
  - [x] 5.3 Create AidaStrategyDisplay component
    - Build display component in `src/components/AidaStrategyDisplay.tsx`
    - Render all 4 stages with objectives, content directions, and key points
    - Show proof requirements where applicable
    - _Requirements: 4.7_

- [x] 6. Priority 5: Campaign Builder - LinkedIn Assets (Requirements 5.1-5.2)
  - [x] 6.1 Implement Campaign Builder AI agent for LinkedIn posts
    - Create `src/lib/pipeline/agents/campaign-builder.ts` with modular structure
    - Generate 4 LinkedIn posts (Attention, Interest, Desire, Action) per Req 5.2
    - Enforce max 3,000 characters per post per Req 5.2
    - Use selected messaging angle as anchor per Req 5.6
    - Reference product-specific differentiators per Req 5.8
    - Insert placeholders for missing proof per Req 5.7
    - Validate output against LinkedInPostSchema
    - _Requirements: 5.2, 5.6, 5.7, 5.8_

- [x] 7. Priority 5: Campaign Builder - Email Assets (Requirements 5.1, 5.3)
  - [x] 7.1 Extend Campaign Builder agent for emails
    - Add email generation to `campaign-builder.ts`
    - Generate 4 emails (one per AIDA stage) per Req 5.3
    - Enforce: subject max 60 chars, preview max 90 chars, body max 500 words per Req 5.3
    - Include CTA, stage label, strategic purpose per Req 5.3
    - Use selected messaging angle consistently per Req 5.6
    - Insert placeholders for missing proof per Req 5.7
    - Validate output against EmailAssetSchema
    - _Requirements: 5.3, 5.6, 5.7, 5.8_

- [x] 8. Priority 5: Campaign Builder - Landing Page Assets (Requirements 5.1, 5.4)
  - [x] 8.1 Extend Campaign Builder agent for landing page
    - Add landing page generation to `campaign-builder.ts`
    - Generate structured copy with all required sections per Req 5.4
    - Sections: headline, subheadline, primary CTA, problem, why-current-fails, product-solution, benefits, how-it-works, objection-handling, social-proof, FAQ, final CTA
    - Use selected messaging angle per Req 5.6
    - Insert placeholders for social proof per Req 5.7
    - Reference product-specific differentiators per Req 5.8
    - Validate output against LandingPageSchema
    - _Requirements: 5.4, 5.6, 5.7, 5.8_

- [x] 9. Priority 5: Campaign Builder - Ad Assets (Requirements 5.1, 5.5)
  - [x] 9.1 Extend Campaign Builder agent for ads
    - Add ad generation to `campaign-builder.ts`
    - Generate at least 3 ad concepts with distinct angles per Req 5.5
    - Ensure one pain-based, one outcome-based, one identity-based per Req 5.5
    - Include headline, primary text, CTA, target audience, stage, rationale per Req 5.5
    - Use selected messaging angle as anchor per Req 5.6
    - Validate output against AdConceptSchema
    - _Requirements: 5.5, 5.6_
  
  - [x] 9.2 Integrate Campaign Builder into pipeline orchestrator
    - Add Stage 4 (Campaign Builder) to `resumePipelineAfterAngleSelection`
    - Create all Asset records in database transaction
    - Update campaign status to "assets_complete"
    - Implement retry logic for failed channels per Req 5.10
    - _Requirements: 5.1, 5.9, 5.10_
  
  - [x] 9.3 Create AssetDisplay components for all channels
    - Build `src/components/assets/LinkedInPostCard.tsx`
    - Build `src/components/assets/EmailAssetCard.tsx`
    - Build `src/components/assets/LandingPageDisplay.tsx`
    - Build `src/components/assets/AdConceptCard.tsx`
    - Display content with channel name and AIDA stage labels per Req 5.9
    - _Requirements: 5.9_

- [x] 10. Priority 6: Campaign Critic (Requirements 6.1-6.8)
  - [x] 10.1 Implement Campaign Critic AI agent
    - Create `src/lib/pipeline/agents/campaign-critic.ts`
    - Score each AIDA stage (1-10), message consistency (1-10), audience fit (1-10) per Req 6.2
    - Compute overall score as arithmetic mean, rounded to 1 decimal per Req 6.2
    - Identify critical stage (lowest score, earliest if tie) per Req 6.3
    - Generate specific recommendation referencing actual product and customer per Req 6.3
    - Include targetAssetIds and suggestedFix in primary recommendation
    - Insert placeholders for missing benchmark data per Req 6.7
    - Validate output against CritiqueSchema
    - _Requirements: 6.1, 6.2, 6.3, 6.7_
  
  - [x] 10.2 Integrate Campaign Critic into pipeline orchestrator
    - Add Stage 5 (Campaign Critic) to `resumePipelineAfterAngleSelection`
    - Create Critique record in database
    - Update campaign status to "critique_complete"
    - Handle generation failure per Req 6.8
    - _Requirements: 6.1, 6.4, 6.8_
  
  - [x] 10.3 Implement applyCritiqueRecommendation server action
    - Add function to `src/actions/campaign.ts`
    - Fetch primary recommendation from Critique
    - Update only identified target assets per Req 6.6
    - Apply suggestedFix content replacement per Req 6.5
    - Increment asset version, keep manuallyEdited = false
    - Revalidate Campaign Dashboard path
    - _Requirements: 6.5, 6.6_
  
  - [x] 10.4 Create CampaignCritiquePanel component
    - Build component in `src/components/CampaignCritiquePanel.tsx`
    - Display overall score and all component scores per Req 6.2
    - Show critical stage and primary recommendation per Req 6.3
    - Include "Apply Recommendation" button triggering Fix_Campaign
    - _Requirements: 6.4, 6.5_

- [x] 11. Priority 7: Launch Calendar (Requirements 7.1-7.8)
  - [x] 11.1 Implement Launch Calendar Generator AI agent
    - Create `src/lib/pipeline/agents/launch-calendar.ts`
    - Generate exactly 7 days per Req 7.1
    - Assign assets to stage windows per Req 7.2: Attention (Day 1-2), Interest (Day 3-4), Desire (Day 5-6), Action (Day 7)
    - Format actions as imperatives per Req 7.3
    - Limit to max 3 actions per day per Req 7.4
    - Schedule landing page finalization on Day 1, first action per Req 7.5
    - Use relative timing (Day 1, Day 2, etc.) per Req 7.7
    - Handle overflow (>21 assets) with warning per Req 7.4
    - Validate output against LaunchCalendarSchema
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_
  
  - [x] 11.2 Integrate Launch Calendar Generator into pipeline orchestrator
    - Add Stage 6 (Launch Calendar) to `resumePipelineAfterAngleSelection`
    - Create LaunchCalendar record in database
    - Update campaign status to "complete"
    - Handle generation failure per Req 7.8
    - _Requirements: 7.6, 7.8_
  
  - [x] 11.3 Create LaunchCalendarDisplay component
    - Build component in `src/components/LaunchCalendarDisplay.tsx`
    - Display 7 days as ordered list with day labels
    - Show actions for each day
    - _Requirements: 7.6_

- [x] 12. Priority 8: Campaign Dashboard (Requirements 8.1-8.5)
  - [x] 12.1 Create Campaign Dashboard page with complete data fetching
    - Build `src/app/campaign/[id]/page.tsx` as Server Component
    - Fetch campaign with all relations (productBrief, strategy, assets, critique, calendar)
    - Handle campaign not found and incomplete pipeline states
    - _Requirements: 8.1_
  
  - [x] 12.2 Build Campaign Dashboard layout with all sections
    - Display campaign name and status at top
    - Show pipeline stage indicators (complete vs incomplete) per Req 8.2
    - Render ProductIntelligenceCard
    - Render PositioningStrategySelector (read-only if already selected)
    - Render AidaStrategyDisplay
    - Render assets organized by channel with AssetDisplay components per Req 8.1
    - Render CampaignCritiquePanel
    - Render LaunchCalendarDisplay
    - Display overall campaign score
    - _Requirements: 8.1, 8.2_
  
  - [x] 12.3 Implement AssetEditor component with inline editing
    - Build `src/components/AssetEditor.tsx`
    - Create textarea/rich text input for asset content
    - Call updateAsset server action on save
    - Show save confirmation and loading states
    - Persist changes within 2 seconds per Req 8.3
    - _Requirements: 8.3_
  
  - [x] 12.4 Implement updateAsset server action with manual edit tracking
    - Add function to `src/actions/campaign.ts`
    - Update Asset.content in database
    - Set Asset.manuallyEdited = true per Req 8.4
    - Add visible "manually modified" indicator per Req 8.4
    - Increment Asset.version
    - Revalidate Campaign Dashboard path
    - _Requirements: 8.3, 8.4_
  
  - [x] 12.5 Implement navigation flow from landing to dashboard
    - Create landing page with "Create Campaign" CTA
    - Link ProductBriefForm to Campaign Dashboard on success
    - Handle navigation failures with 5-second timeout per Req 8.5
    - Ensure no dead ends in user flow
    - _Requirements: 8.5_

- [x] 13. Checkpoint: End-to-end pipeline verification
  - Run complete pipeline from Product Brief submission through Launch Calendar generation
  - Verify all database records created correctly with proper relationships
  - Verify all AI agents return structured outputs validated by Zod schemas
  - Verify Campaign Dashboard displays all sections correctly
  - Test Fix_Campaign flow (apply critique recommendation)
  - Test user asset editing and manual-edit preservation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All AI agent implementations use the OpenRouter client with JSON mode and Zod validation
- Each pipeline stage commits to database before proceeding (allows resume on failure)
- User-edited assets are preserved from AI regeneration via `manuallyEdited` flag
- All timestamps and status transitions are tracked for debugging
- Error handling includes field-specific validation messages and retry logic
- Placeholders are inserted for missing proof (testimonials, metrics, case studies)
- The selected messaging angle anchors all campaign assets for consistency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1", "2.3"] },
    { "id": 3, "tasks": ["2.2"] },
    { "id": 4, "tasks": ["3.1", "3.3"] },
    { "id": 5, "tasks": ["3.2"] },
    { "id": 6, "tasks": ["4.1", "4.3"] },
    { "id": 7, "tasks": ["4.2", "4.4"] },
    { "id": 8, "tasks": ["5.1", "5.3"] },
    { "id": 9, "tasks": ["5.2"] },
    { "id": 10, "tasks": ["6.1"] },
    { "id": 11, "tasks": ["7.1"] },
    { "id": 12, "tasks": ["8.1"] },
    { "id": 13, "tasks": ["9.1"] },
    { "id": 14, "tasks": ["9.2", "9.3"] },
    { "id": 15, "tasks": ["10.1"] },
    { "id": 16, "tasks": ["10.2", "10.4"] },
    { "id": 17, "tasks": ["10.3"] },
    { "id": 18, "tasks": ["11.1"] },
    { "id": 19, "tasks": ["11.2", "11.3"] },
    { "id": 20, "tasks": ["12.1"] },
    { "id": 21, "tasks": ["12.2", "12.3"] },
    { "id": 22, "tasks": ["12.4", "12.5"] }
  ]
}
```


