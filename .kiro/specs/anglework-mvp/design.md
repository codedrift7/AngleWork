# Design Document: Anglework MVP

## Overview

Anglework is an AI-powered marketing strategist that transforms product information into complete, ready-to-execute marketing campaigns. The system orchestrates a six-stage AI pipeline that moves from understanding the product through generating channel-specific assets to critiquing and improving the campaign.

The design enforces three critical constraints:

1. **Single-strategy, many-channels**: All campaign assets derive from one AIDA strategy, not independent generation per channel
2. **Never fabricate proof**: When user-supplied data is missing (testimonials, metrics, case studies), insert explicit placeholders rather than inventing content
3. **Structured output at every stage**: Each AI agent returns typed, validated JSON objects, enabling programmatic critique, regeneration, and dashboard composition

This document details the system architecture, AI pipeline implementation, data flow, database schema, and key technical decisions required to build the MVP.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS   │
│                     shadcn/ui Components                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│              Next.js Server Actions (use server)                 │
│         Campaign Orchestrator + AI Pipeline Controllers          │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│       AI Pipeline Layer       │  │    Database Layer          │
│   OpenRouter API + Structured │  │   Prisma + PostgreSQL      │
│   Outputs (Zod Schemas)       │  │   (Neon via Adapter)       │
│   6 Sequential AI Agents      │  │                            │
└──────────────────────────────┘  └────────────────────────────┘
```

### Technology Stack

**Frontend**
- Next.js 16.3.3 with App Router
- React 19.2.8 (Server Components + Client Components)
- TypeScript 5.x for type safety
- Tailwind CSS 4 for styling
- shadcn/ui for polished UI components

**Backend**
- Next.js Server Actions for mutations (form submissions, campaign operations)
- Next.js API Routes for webhook endpoints (if needed for async pipeline)
- Prisma 7.10.0 as ORM
- PostgreSQL via Neon (serverless-compatible pooled connection)
- @prisma/adapter-neon for WebSocket-based connection from Vercel serverless functions

**AI Infrastructure**
- OpenRouter API with NVIDIA Nemotron (nvidia/nemotron-3-super-120b-a12b:free)
- Zod for schema definition and runtime validation
- JSON mode with Zod validation for structured outputs
- Retry logic with exponential backoff for API failures

**Deployment**
- Vercel for hosting (serverless functions + edge network)
- Neon PostgreSQL free tier (pooled connection)
- Environment variables for secrets (DATABASE_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL)

### Key Architectural Decisions

**Why Server Actions instead of API Routes?**

Server Actions are used for all campaign mutations because:
- They execute directly from React components without manual fetch wiring
- They automatically handle form submissions with progressive enhancement
- They serialize responses and handle revalidation automatically
- They're queued per client, preventing race conditions when users trigger multiple pipeline stages
- They're appropriate for internal mutations called from our React UI

API Routes would only be needed for external callers (webhooks, mobile apps), which are out of MVP scope.

**Why Structured Outputs?**

Every AI agent returns typed JSON conforming to a Zod schema. This enables:
- **Type safety**: TypeScript knows the exact shape of every agent's output
- **Validation**: Runtime checking catches malformed responses before they corrupt the database
- **Programmatic critique**: The Campaign Critic can reliably access specific fields across all assets
- **Reliable regeneration**: Fix_Campaign can target specific asset fields without parsing freeform text
- **Dashboard composition**: The UI can safely render nested objects without defensive checks

The system uses JSON mode (response_format: { type: "json_object" }) combined with Zod validation and retry logic. While OpenRouter with NVIDIA Nemotron doesn't support native JSON schema enforcement like OpenAI's Structured Outputs feature, the combination of explicit JSON instructions, JSON mode, schema validation, and retries provides reliable structured output generation.

**Why Prisma with Neon Adapter?**

Prisma provides:
- Type-safe database queries generated from schema
- Migration management via `prisma db push` (no shadow database needed)
- Transaction support for atomic pipeline stage commits

The Neon adapter enables:
- WebSocket-based connection from Vercel serverless functions (required for stable connections)
- Pooled connections via DATABASE_URL (app usage)
- Direct connection via separate URL (Prisma CLI operations)

---

## Components and Interfaces

### Frontend Components

**1. ProductBriefForm**
- **Purpose**: Multi-field form for collecting Product_Brief data
- **Location**: `/app/campaign/new/page.tsx` (or similar)
- **Behavior**: 
  - Client component with controlled inputs
  - Validates required fields before submission
  - Calls `createCampaignFromBrief` server action on submit
  - Displays field-specific validation errors
  - Shows loading state during pipeline execution
- **Key Fields**: productName, description, category, productType, targetCustomer, customerProblem, customerSophistication, mainBenefit, keyDifferentiator, price, marketingGoal, launchType, desiredCTA, primaryChannel, campaignDuration, competitors (optional), existingTagline (optional), brandVoice (optional), websiteURL (optional, validated as URL), customerTestimonials (optional), productDocs (optional), brandGuidelines (optional), existingCopy (optional)

**2. CampaignDashboard**
- **Purpose**: Single-screen view of entire campaign state
- **Location**: `/app/campaign/[id]/page.tsx`
- **Behavior**:
  - Server component that fetches campaign + strategy + assets + critique + calendar
  - Renders section for each pipeline stage with status indicator
  - Allows inline editing of Campaign_Assets with manual-edit indicator
  - Provides Fix_Campaign button that applies critique recommendation
  - Updates via server action + revalidation (no client-side state management)
- **Sections**: Campaign header (name, status, score), Product Intelligence card, Positioning Strategy (with messaging angle selector), AIDA Strategy breakdown, Campaign Assets by channel, Campaign Critique scores + recommendation, Launch Calendar day-by-day

**3. ProductIntelligenceCard**
- **Purpose**: Display AI-generated product analysis
- **Props**: `productIntelligence: ProductIntelligence`
- **Renders**: ICP, core problem, primary pain (customer language), desired outcome, core promise, differentiators (list), emotional drivers, objections (list), recommended messaging angle
- **Behavior**: Read-only display with clear typography hierarchy

**4. PositioningStrategySelector**
- **Purpose**: Present three messaging angles and capture user selection
- **Props**: `messagingAngles: MessagingAngle[]`, `onSelect: (angle) => void`
- **Behavior**:
  - Displays each angle as a card with title, tagline, rationale
  - Highlights selected angle
  - Calls `selectMessagingAngle` server action on selection
  - Disables further editing once selection is made

**5. AssetEditor**
- **Purpose**: Inline editing of Campaign_Assets
- **Props**: `asset: Asset`, `onSave: (content) => void`
- **Behavior**:
  - Textarea or rich text editor for asset content
  - Calls `updateAsset` server action on save
  - Marks asset as manually modified in database
  - Preserves user edits from AI regeneration operations

**6. CampaignCritiquePanel**
- **Purpose**: Display critique scores and actionable recommendations
- **Props**: `critique: Critique`
- **Renders**: Overall score, per-stage scores (Attention, Interest, Desire, Action), message consistency score, audience fit score, identified weaknesses, primary recommendation with Fix_Campaign button
- **Behavior**: Clicking Fix_Campaign triggers `applyCritiqueRecommendation` server action

### Backend Interfaces (Server Actions)

All server actions use `'use server'` directive and are defined in `src/actions/` directory.

**Campaign Creation and Orchestration**

```typescript
// src/actions/campaign.ts
'use server'

export async function createCampaignFromBrief(
  formData: FormData
): Promise<{ campaignId: string } | { error: string }>

export async function selectMessagingAngle(
  campaignId: string, 
  angleIndex: number
): Promise<{ success: true } | { error: string }>

export async function applyCritiqueRecommendation(
  campaignId: string
): Promise<{ success: true } | { error: string }>

export async function updateAsset(
  assetId: string,
  content: string
): Promise<{ success: true } | { error: string }>

export async function regenerateAsset(
  assetId: string
): Promise<{ success: true } | { error: string }>
```

**Pipeline Orchestrator**

The orchestrator coordinates sequential execution of all six AI agents:

```typescript
// src/lib/pipeline/orchestrator.ts

export async function runCampaignPipeline(
  campaignId: string,
  productBrief: ProductBriefData
): Promise<void> {
  // Execute agents sequentially with error handling
  // Each stage commits to database before proceeding
  // Allows resume from last successful stage on failure
}
```

### AI Agent Interfaces

Each agent exposes a single async function that accepts typed input and returns typed output validated against a Zod schema.

```typescript
// src/lib/agents/types.ts

export interface AgentInput<T> {
  data: T
  campaignId: string
}

export interface AgentOutput<T> {
  result: T
  metadata: {
    tokensUsed: number
    executionTimeMs: number
    modelVersion: string
  }
}

export type Agent<TInput, TOutput> = (
  input: AgentInput<TInput>
) => Promise<AgentOutput<TOutput>>
```

---

## Data Models

### Database Schema

The schema is defined in `prisma/schema.prisma` and uses the existing Neon PostgreSQL setup.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// User model (authentication - out of MVP scope, but included for future)
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  createdAt DateTime   @default(now())
  campaigns Campaign[]
}

// Campaign is the top-level entity grouping all pipeline outputs
model Campaign {
  id        String    @id @default(cuid())
  userId    String?   // Nullable in MVP (no auth)
  user      User?     @relation(fields: [userId], references: [id])
  name      String
  status    String    // "draft" | "intelligence_complete" | "positioning_complete" | "aida_complete" | "assets_complete" | "critique_complete" | "complete"
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  productBrief ProductBrief?
  strategy     Strategy?
  assets       Asset[]
  critique     Critique?
  calendar     LaunchCalendar?
}

// ProductBrief stores the user-submitted form data
model ProductBrief {
  id                    String   @id @default(cuid())
  campaignId            String   @unique
  campaign              Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  // Required fields
  productName           String
  description           String   @db.Text
  category              String
  productType           String
  targetCustomer        String   @db.Text
  customerProblem       String   @db.Text
  customerSophistication String
  mainBenefit           String   @db.Text
  keyDifferentiator     String   @db.Text
  price                 String
  marketingGoal         String
  launchType            String
  desiredCTA            String
  primaryChannel        String
  campaignDuration      String

  // Optional fields
  competitors           String?  @db.Text
  existingTagline       String?
  brandVoice            String?  @db.Text
  websiteURL            String?
  customerTestimonials  String?  @db.Text // JSON array of testimonials
  productDocs           String?  @db.Text
  brandGuidelines       String?  @db.Text
  existingCopy          String?  @db.Text

  createdAt             DateTime @default(now())
}

// Strategy stores outputs from Product Analyst, Positioning Strategist, and AIDA Strategist
model Strategy {
  id                   String   @id @default(cuid())
  campaignId           String   @unique
  campaign             Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  // Product Intelligence (from Product Analyst)
  productIntelligence  Json     // ProductIntelligence type

  // Positioning (from Positioning Strategist)
  positioning          Json     // Positioning type

  // Messaging Angles (3 candidates)
  messagingAngles      Json     // MessagingAngle[] type

  // Selected Messaging Angle index (0, 1, or 2)
  selectedAngleIndex   Int?

  // AIDA Strategy (from AIDA Strategist, generated after angle selection)
  aidaStrategy         Json?    // AidaStrategy type

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

// Asset stores each generated campaign piece
model Asset {
  id              String   @id @default(cuid())
  campaignId      String
  campaign        Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  channel         String   // "linkedin" | "email" | "landing_page" | "ads"
  stage           String   // "attention" | "interest" | "desire" | "action" | "multi-stage"
  assetType       String   // "post" | "email" | "page_section" | "ad"
  title           String?
  content         Json     // Structured content (varies by asset type)
  version         Int      @default(1)
  manuallyEdited  Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([campaignId, channel, stage])
}

// Critique stores the Campaign Critic output
model Critique {
  id                    String   @id @default(cuid())
  campaignId            String   @unique
  campaign              Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  overallScore          Float    // 0.0 - 10.0
  attentionScore        Int      // 1 - 10
  interestScore         Int      // 1 - 10
  desireScore           Int      // 1 - 10
  actionScore           Int      // 1 - 10
  messageConsistency    Int      // 1 - 10
  audienceFit           Int      // 1 - 10

  criticalStage         String   // "attention" | "interest" | "desire" | "action"
  findings              Json     // Array of finding objects
  recommendations       Json     // Array of recommendation objects
  primaryRecommendation Json     // Single recommendation object with fix instructions

  createdAt             DateTime @default(now())
}

// LaunchCalendar stores the 7-day execution plan
model LaunchCalendar {
  id          String   @id @default(cuid())
  campaignId  String   @unique
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  days        Json     // Array of day objects with date and actions

  createdAt   DateTime @default(now())
}
```

### TypeScript Types

All types are defined alongside their Zod schemas for validation.

```typescript
// src/lib/types/campaign.ts

import { z } from 'zod'

// Product Intelligence Schema
export const ProductIntelligenceSchema = z.object({
  idealCustomerProfile: z.string().min(10).max(500),
  coreProblem: z.string().min(10).max(500),
  primaryPain: z.string().min(5).max(200), // Customer language, first-person
  desiredOutcome: z.string().min(10).max(300),
  corePromise: z.string().min(10).max(300),
  differentiators: z.array(z.string()).min(1).max(5),
  emotionalDrivers: z.array(z.string()).min(1).max(5),
  objections: z.array(z.string()).min(2).max(5),
  recommendedMessagingAngle: z.enum(['pain', 'outcome', 'time'])
})

export type ProductIntelligence = z.infer<typeof ProductIntelligenceSchema>

// Positioning Schema
export const PositioningSchema = z.object({
  category: z.string().min(5).max(100),
  positioningStatement: z.string().min(10).max(300),
  valueProposition: z.string().min(10).max(500),
  primaryPain: z.string().min(10).max(300),
  desiredTransformation: z.string().min(10).max(500)
})

export type Positioning = z.infer<typeof PositioningSchema>

// Messaging Angle Schema
export const MessagingAngleSchema = z.object({
  type: z.enum(['pain', 'outcome', 'time']),
  tagline: z.string().min(10).max(200),
  coreMessage: z.string().min(20).max(500),
  rationale: z.string().min(20).max(500)
})

export type MessagingAngle = z.infer<typeof MessagingAngleSchema>

// AIDA Stage Schema
export const AidaStageSchema = z.object({
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  objective: z.string().min(20).max(500),
  contentDirection: z.string().min(50).max(1000),
  keyPoints: z.array(z.string()).min(2).max(5),
  proofRequirements: z.array(z.string()).optional() // e.g., "[TESTIMONIAL]", "[STAT]"
})

export type AidaStage = z.infer<typeof AidaStageSchema>

// AIDA Strategy Schema
export const AidaStrategySchema = z.object({
  attention: AidaStageSchema,
  interest: AidaStageSchema,
  desire: AidaStageSchema,
  action: AidaStageSchema
})

export type AidaStrategy = z.infer<typeof AidaStrategySchema>

// Asset Schemas (vary by type)

export const LinkedInPostSchema = z.object({
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  content: z.string().min(50).max(3000),
  strategicPurpose: z.string().min(20).max(300)
})

export type LinkedInPost = z.infer<typeof LinkedInPostSchema>

export const EmailAssetSchema = z.object({
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  subjectLine: z.string().min(10).max(60),
  previewText: z.string().min(10).max(90),
  body: z.string().min(100).max(3000),
  cta: z.string().min(5).max(100),
  strategicPurpose: z.string().min(20).max(300)
})

export type EmailAsset = z.infer<typeof EmailAssetSchema>

export const LandingPageSchema = z.object({
  headline: z.string().min(10).max(100),
  subheadline: z.string().min(20).max(200),
  primaryCTA: z.string().min(5).max(50),
  problemSection: z.string().min(100).max(1000),
  whyCurrentSolutionsFail: z.string().min(100).max(1000),
  productSolution: z.string().min(100).max(1000),
  benefits: z.array(z.string()).min(3).max(7),
  howItWorks: z.array(z.object({
    step: z.string(),
    description: z.string()
  })).min(3).max(5),
  objectionHandling: z.array(z.object({
    objection: z.string(),
    response: z.string()
  })).min(2).max(5),
  socialProof: z.string().min(50).max(500), // May contain placeholders
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).min(3).max(7),
  finalCTA: z.string().min(5).max(50)
})

export type LandingPage = z.infer<typeof LandingPageSchema>

export const AdConceptSchema = z.object({
  angle: z.enum(['pain', 'outcome', 'identity']),
  headline: z.string().min(10).max(100),
  primaryText: z.string().min(50).max(300),
  cta: z.string().min(5).max(50),
  targetAudience: z.string().min(20).max(200),
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  rationale: z.string().min(20).max(300)
})

export type AdConcept = z.infer<typeof AdConceptSchema>

// Critique Schema
export const CritiqueSchema = z.object({
  overallScore: z.number().min(1).max(10),
  attentionScore: z.number().int().min(1).max(10),
  interestScore: z.number().int().min(1).max(10),
  desireScore: z.number().int().min(1).max(10),
  actionScore: z.number().int().min(1).max(10),
  messageConsistency: z.number().int().min(1).max(10),
  audienceFit: z.number().int().min(1).max(10),
  criticalStage: z.enum(['attention', 'interest', 'desire', 'action']),
  findings: z.array(z.object({
    stage: z.string(),
    issue: z.string(),
    severity: z.enum(['low', 'medium', 'high'])
  })),
  recommendations: z.array(z.object({
    stage: z.string(),
    recommendation: z.string(),
    expectedImpact: z.string()
  })),
  primaryRecommendation: z.object({
    stage: z.string(),
    targetAssetIds: z.array(z.string()),
    recommendation: z.string(),
    suggestedFix: z.string() // Specific content replacement
  })
})

export type Critique = z.infer<typeof CritiqueSchema>

// Launch Calendar Schema
export const LaunchCalendarSchema = z.object({
  days: z.array(z.object({
    dayNumber: z.number().int().min(1).max(7),
    date: z.string().optional(), // Relative, e.g., "Day 1"
    actions: z.array(z.object({
      action: z.string(),
      assetId: z.string().optional(),
      stage: z.enum(['attention', 'interest', 'desire', 'action']).optional()
    })).min(1).max(3)
  })).length(7)
})

export type LaunchCalendar = z.infer<typeof LaunchCalendarSchema>
```

---

## AI Pipeline Implementation

### Pipeline Orchestrator

The orchestrator executes the six AI agents sequentially, committing each stage's output to the database before proceeding. This allows resumption from the last successful stage if a failure occurs.

```typescript
// src/lib/pipeline/orchestrator.ts

import { prisma } from '@/db'
import { productAnalystAgent } from './agents/product-analyst'
import { positioningStrategistAgent } from './agents/positioning-strategist'
import { aidaStrategistAgent } from './agents/aida-strategist'
import { campaignBuilderAgent } from './agents/campaign-builder'
import { campaignCriticAgent } from './agents/campaign-critic'
import { launchCalendarAgent } from './agents/launch-calendar'

export async function runCampaignPipeline(
  campaignId: string,
  productBrief: ProductBriefData
): Promise<void> {
  try {
    // Stage 1: Product Analyst
    await updateCampaignStatus(campaignId, 'intelligence_in_progress')
    const productIntelligence = await productAnalystAgent({
      data: productBrief,
      campaignId
    })
    await prisma.strategy.create({
      data: {
        campaignId,
        productIntelligence: productIntelligence.result,
        positioning: {}, // Populated in next stage
        messagingAngles: [], // Populated in next stage
      }
    })
    await updateCampaignStatus(campaignId, 'intelligence_complete')

    // Stage 2: Positioning Strategist
    await updateCampaignStatus(campaignId, 'positioning_in_progress')
    const positioning = await positioningStrategistAgent({
      data: { productBrief, productIntelligence: productIntelligence.result },
      campaignId
    })
    await prisma.strategy.update({
      where: { campaignId },
      data: {
        positioning: positioning.result.positioning,
        messagingAngles: positioning.result.messagingAngles
      }
    })
    await updateCampaignStatus(campaignId, 'positioning_complete')

    // Stage 3: User selects messaging angle (pipeline pauses here)
    // The selectMessagingAngle server action will resume the pipeline

  } catch (error) {
    await handlePipelineError(campaignId, error)
    throw error
  }
}

export async function resumePipelineAfterAngleSelection(
  campaignId: string,
  selectedAngleIndex: number
): Promise<void> {
  const strategy = await prisma.strategy.findUnique({
    where: { campaignId },
    include: { campaign: { include: { productBrief: true } } }
  })

  if (!strategy) throw new Error('Strategy not found')

  const selectedAngle = (strategy.messagingAngles as MessagingAngle[])[selectedAngleIndex]
  const productIntelligence = strategy.productIntelligence as ProductIntelligence
  const positioning = strategy.positioning as Positioning

  try {
    // Stage 4: AIDA Strategist
    await updateCampaignStatus(campaignId, 'aida_in_progress')
    const aidaStrategy = await aidaStrategistAgent({
      data: {
        productBrief: strategy.campaign.productBrief!,
        productIntelligence,
        positioning,
        selectedAngle
      },
      campaignId
    })
    await prisma.strategy.update({
      where: { campaignId },
      data: { aidaStrategy: aidaStrategy.result }
    })
    await updateCampaignStatus(campaignId, 'aida_complete')

    // Stage 5: Campaign Builder
    await updateCampaignStatus(campaignId, 'assets_in_progress')
    const assets = await campaignBuilderAgent({
      data: {
        productBrief: strategy.campaign.productBrief!,
        aidaStrategy: aidaStrategy.result,
        selectedAngle
      },
      campaignId
    })
    
    // Create all assets in a transaction
    await prisma.$transaction(
      assets.result.map(asset =>
        prisma.asset.create({
          data: {
            campaignId,
            channel: asset.channel,
            stage: asset.stage,
            assetType: asset.assetType,
            title: asset.title,
            content: asset.content
          }
        })
      )
    )
    await updateCampaignStatus(campaignId, 'assets_complete')

    // Stage 6: Campaign Critic
    await updateCampaignStatus(campaignId, 'critique_in_progress')
    const critique = await campaignCriticAgent({
      data: {
        campaign: strategy.campaign,
        aidaStrategy: aidaStrategy.result,
        assets: assets.result,
        productIntelligence
      },
      campaignId
    })
    await prisma.critique.create({
      data: {
        campaignId,
        overallScore: critique.result.overallScore,
        attentionScore: critique.result.attentionScore,
        interestScore: critique.result.interestScore,
        desireScore: critique.result.desireScore,
        actionScore: critique.result.actionScore,
        messageConsistency: critique.result.messageConsistency,
        audienceFit: critique.result.audienceFit,
        criticalStage: critique.result.criticalStage,
        findings: critique.result.findings,
        recommendations: critique.result.recommendations,
        primaryRecommendation: critique.result.primaryRecommendation
      }
    })
    await updateCampaignStatus(campaignId, 'critique_complete')

    // Stage 7: Launch Calendar
    await updateCampaignStatus(campaignId, 'calendar_in_progress')
    const launchCalendar = await launchCalendarAgent({
      data: {
        assets: assets.result,
        aidaStrategy: aidaStrategy.result
      },
      campaignId
    })
    await prisma.launchCalendar.create({
      data: {
        campaignId,
        days: launchCalendar.result.days
      }
    })
    await updateCampaignStatus(campaignId, 'complete')

  } catch (error) {
    await handlePipelineError(campaignId, error)
    throw error
  }
}

async function updateCampaignStatus(campaignId: string, status: string): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status }
  })
}

async function handlePipelineError(campaignId: string, error: unknown): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { 
      status: 'error',
      // Store error details in a separate ErrorLog model in production
    }
  })
  console.error(`Pipeline error for campaign ${campaignId}:`, errorMessage)
}
```

### Agent 1: Product Analyst

**Purpose**: Extract structured product intelligence from the raw Product_Brief.

**Input**: ProductBriefData (all form fields)

**Output**: ProductIntelligence (ICP, pain, outcome, differentiators, objections, emotional drivers, recommended angle)

**Processing Logic**:
1. Analyze target customer to define ICP
2. Extract core problem and express primary pain in customer language (first-person, 5-30 words)
3. Identify desired outcome (what customer wants to achieve)
4. Formulate core promise (what product delivers)
5. Extract 1-5 differentiators from keyDifferentiator and description
6. Derive 2-5 objections based on category and differentiators
7. Identify emotional drivers (fear, aspiration, identity)
8. Recommend one messaging angle (pain, outcome, or time)
9. Insert placeholders for any referenced proof not in productBrief

**Implementation**:

```typescript
// src/lib/pipeline/agents/product-analyst.ts

import { Agent } from '../types'
import { ProductIntelligence, ProductIntelligenceSchema } from '@/lib/types/campaign'
import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'
import { ProductBriefData } from '@/lib/types/product-brief'

export const productAnalystAgent: Agent<ProductBriefData, ProductIntelligence> = async (input) => {
  const startTime = Date.now()

  const systemPrompt = `You are a product intelligence analyst. Your job is to extract structured insights from a product brief.

CRITICAL RULES:
1. Express primary pain in CUSTOMER LANGUAGE using first-person statements (5-30 words)
   - Good: "I don't know where my money is really going"
   - Bad: "lack of financial visibility"
2. Derive objections from the product category and differentiators (2-5 objections)
3. If the brief references testimonials, metrics, or proof NOT provided in the data, DO NOT fabricate them
4. Recommended messaging angle must be ONE of: pain, outcome, time

OUTPUT FORMAT: Return valid JSON matching ProductIntelligence schema.`

  const userPrompt = `Analyze this product brief and extract product intelligence:

Product: ${input.data.productName}
Description: ${input.data.description}
Category: ${input.data.category}
Target Customer: ${input.data.targetCustomer}
Customer Problem: ${input.data.customerProblem}
Main Benefit: ${input.data.mainBenefit}
Key Differentiator: ${input.data.keyDifferentiator}
Price: ${input.data.price}
Marketing Goal: ${input.data.marketingGoal}
${input.data.competitors ? `Competitors: ${input.data.competitors}` : ''}
${input.data.customerTestimonials ? `Testimonials: ${input.data.customerTestimonials}` : ''}

Extract: ICP, core problem, primary pain (customer voice), desired outcome, core promise, differentiators, emotional drivers, objections, recommended messaging angle.`

  const result = await callLLMWithStructuredOutput<ProductIntelligence>({
    schema: ProductIntelligenceSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxRetries: 3
  })

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
```

### Agent 2: Positioning Strategist

**Purpose**: Define product category, positioning statement, value proposition, and generate three distinct messaging angles.

**Input**: ProductBriefData + ProductIntelligence

**Output**: { positioning: Positioning, messagingAngles: MessagingAngle[] }

**Processing Logic**:
1. Define product category (5-100 chars)
2. Craft positioning statement (10-300 words, incorporating differentiators)
3. Articulate value proposition (10-500 words)
4. Generate exactly 3 messaging angles:
   - One pain-focused (addresses primary pain)
   - One outcome-focused (emphasizes desired transformation)
   - One time/effort-focused (highlights efficiency gain)
5. For each angle: tagline (10-200 chars), core message (20-500 words), rationale (20-500 words)
6. Ensure no two angles share the same central claim

**Implementation**:

```typescript
// src/lib/pipeline/agents/positioning-strategist.ts

import { Agent } from '../types'
import { Positioning, MessagingAngle, PositioningSchema, MessagingAngleSchema } from '@/lib/types/campaign'
import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'
import { z } from 'zod'

const PositioningOutputSchema = z.object({
  positioning: PositioningSchema,
  messagingAngles: z.array(MessagingAngleSchema).length(3)
})

type PositioningOutput = z.infer<typeof PositioningOutputSchema>

interface PositioningInput {
  productBrief: ProductBriefData
  productIntelligence: ProductIntelligence
}

export const positioningStrategistAgent: Agent<PositioningInput, PositioningOutput> = async (input) => {
  const startTime = Date.now()

  const { productBrief, productIntelligence } = input.data

  const systemPrompt = `You are a positioning strategist. Your job is to define the product's market position and generate three distinct messaging angles.

CRITICAL RULES:
1. Generate EXACTLY 3 messaging angles with distinct types: pain, outcome, time
2. Each angle must have a unique central claim (no overlap)
3. Rationale must reference specific product, customer, and pain from intelligence
4. Positioning statement must be 10-300 words
5. If referencing competitive data or benchmarks not provided, insert placeholders

ANGLE EXAMPLES (for AI bookkeeping assistant):
- Pain: "Stop guessing where your money went"
- Outcome: "Know your real numbers without becoming an accountant"
- Time: "Take bookkeeping off your Sunday-night to-do list"

OUTPUT FORMAT: Return valid JSON matching PositioningOutput schema.`

  const userPrompt = `Define positioning and generate 3 messaging angles:

PRODUCT INTELLIGENCE:
- ICP: ${productIntelligence.idealCustomerProfile}
- Primary Pain: ${productIntelligence.primaryPain}
- Desired Outcome: ${productIntelligence.desiredOutcome}
- Core Promise: ${productIntelligence.corePromise}
- Differentiators: ${productIntelligence.differentiators.join(', ')}
- Objections: ${productIntelligence.objections.join(', ')}

PRODUCT BRIEF:
- Product: ${productBrief.productName}
- Category: ${productBrief.category}
- Main Benefit: ${productBrief.mainBenefit}
- Key Differentiator: ${productBrief.keyDifferentiator}

Generate: category, positioning statement, value proposition, 3 messaging angles (pain, outcome, time).`

  const result = await callLLMWithStructuredOutput<PositioningOutput>({
    schema: PositioningOutputSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
```

### Agent 3: AIDA Strategist

**Purpose**: Build a product-specific AIDA persuasion strategy grounded in the selected messaging angle.

**Input**: ProductBriefData + ProductIntelligence + Positioning + selectedAngle: MessagingAngle

**Output**: AidaStrategy (4 stages: Attention, Interest, Desire, Action)

**Processing Logic**:
1. **Attention Stage**:
   - Objective: Hook derived from primary pain or selected messaging angle
   - Content Direction: How to open without listing features (20-500 words)
   - Key Points: 2-5 hooks tied to pain/angle
2. **Interest Stage**:
   - Objective: Articulate cost/consequence of unsolved problem
   - Content Direction: Talking points about problem severity (50-1000 words)
   - Key Points: 2-5 points on why current solutions fail
3. **Desire Stage**:
   - Objective: Paint transformation from painful state to desired outcome
   - Content Direction: Emotional shift + proof requirements (50-1000 words)
   - Key Points: 2-5 transformation elements
   - Proof Requirements: List needed proof as placeholders (e.g., "[TESTIMONIAL]", "[STAT]")
4. **Action Stage**:
   - Objective: Clear CTA with friction reducers
   - Content Direction: How to ask for the action (50-1000 words)
   - Key Points: 2-5 friction reducers
   - Include primary CTA and secondary CTA if provided

**Implementation**:

```typescript
// src/lib/pipeline/agents/aida-strategist.ts

import { Agent } from '../types'
import { AidaStrategy, AidaStrategySchema } from '@/lib/types/campaign'
import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'

interface AidaInput {
  productBrief: ProductBriefData
  productIntelligence: ProductIntelligence
  positioning: Positioning
  selectedAngle: MessagingAngle
}

export const aidaStrategistAgent: Agent<AidaInput, AidaStrategy> = async (input) => {
  const startTime = Date.now()

  const { productBrief, productIntelligence, positioning, selectedAngle } = input.data

  const systemPrompt = `You are an AIDA persuasion strategist. Your job is to build a product-specific AIDA strategy grounded in the selected messaging angle.

CRITICAL RULES:
1. Attention stage: Open with pain or hook from messaging angle, NOT feature list
2. Interest stage: Focus on cost/consequence of unsolved problem
3. Desire stage: Focus on customer outcome (transformation), NOT feature list
4. Action stage: Include primary CTA; if secondary CTA provided, include both
5. When social proof is needed but not provided, insert placeholders: "[TESTIMONIAL]", "[STAT]", "[CASE_STUDY]"
6. All content direction must reference the specific product and customer

OUTPUT FORMAT: Return valid JSON matching AidaStrategy schema.`

  const userPrompt = `Build AIDA strategy for this product:

SELECTED MESSAGING ANGLE:
- Type: ${selectedAngle.type}
- Tagline: ${selectedAngle.tagline}
- Core Message: ${selectedAngle.coreMessage}

PRODUCT INTELLIGENCE:
- Primary Pain: ${productIntelligence.primaryPain}
- Desired Outcome: ${productIntelligence.desiredOutcome}
- Differentiators: ${productIntelligence.differentiators.join(', ')}
- Objections: ${productIntelligence.objections.join(', ')}

PRODUCT BRIEF:
- Product: ${productBrief.productName}
- Desired CTA: ${productBrief.desiredCTA}
${productBrief.secondaryCTA ? `- Secondary CTA: ${productBrief.secondaryCTA}` : ''}

Generate AIDA strategy: for each stage (Attention, Interest, Desire, Action), provide objective, content direction, key points, and proof requirements (if needed).`

  const result = await callLLMWithStructuredOutput<AidaStrategy>({
    schema: AidaStrategySchema,
    systemPrompt,
    userPrompt,
    temperature: 0.75,
    maxRetries: 3
  })

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
```

### Agent 4: Campaign Builder

**Purpose**: Generate all channel-specific campaign assets derived from the AIDA strategy.

**Input**: ProductBriefData + AidaStrategy + selectedAngle: MessagingAngle

**Output**: Array of Asset objects (LinkedIn posts, emails, landing page sections, ads)

**Processing Logic**:
1. **LinkedIn Posts**: Generate 4 posts, one per AIDA stage
   - Attention: Hook-driven (max 3000 chars)
   - Interest: Educational (max 3000 chars)
   - Desire: Transformation-focused (max 3000 chars)
   - Action: Product + CTA (max 3000 chars)
2. **Emails**: Generate 4 emails, one per AIDA stage
   - Each includes: subject (max 60 chars), preview (max 90 chars), body (max 500 words), CTA, strategic purpose
3. **Landing Page**: Generate structured landing page copy
   - Sections: headline, subheadline, primary CTA, problem, why-current-fails, product-solution, benefits, how-it-works, objection-handling, social-proof, FAQ, final CTA
   - Insert placeholders for social proof if not provided
4. **Ads**: Generate at least 3 ad concepts with distinct angles
   - Pain-based, outcome-based, identity-based
   - Each includes: headline, primary text, CTA, target audience, stage, rationale
5. **Constraint Enforcement**:
   - Use selected messaging angle as primary anchor across all assets
   - Reference product-specific differentiators from AIDA strategy
   - Insert placeholders for missing proof (testimonials, stats, case studies)

**Implementation**:

```typescript
// src/lib/pipeline/agents/campaign-builder.ts

import { Agent } from '../types'
import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'
import { z } from 'zod'

// Define output schema for all assets
const CampaignAssetsSchema = z.array(z.object({
  channel: z.enum(['linkedin', 'email', 'landing_page', 'ads']),
  stage: z.enum(['attention', 'interest', 'desire', 'action', 'multi-stage']),
  assetType: z.enum(['post', 'email', 'page_section', 'ad']),
  title: z.string().optional(),
  content: z.any() // Varies by asset type (LinkedInPost, EmailAsset, LandingPage, AdConcept)
}))

type CampaignAssets = z.infer<typeof CampaignAssetsSchema>

interface CampaignBuilderInput {
  productBrief: ProductBriefData
  aidaStrategy: AidaStrategy
  selectedAngle: MessagingAngle
}

export const campaignBuilderAgent: Agent<CampaignBuilderInput, CampaignAssets> = async (input) => {
  const startTime = Date.now()

  const { productBrief, aidaStrategy, selectedAngle } = input.data

  const systemPrompt = `You are a campaign builder. Your job is to generate channel-specific marketing assets from the AIDA strategy.

CRITICAL RULES:
1. Use the selected messaging angle as the PRIMARY message anchor in ALL assets
2. Reference product-specific differentiators from AIDA strategy (not generic claims)
3. LinkedIn posts: max 3000 chars each (4 posts: Attention, Interest, Desire, Action)
4. Emails: max 60 char subject, max 90 char preview, max 500 word body (4 emails)
5. Landing page: structured sections (headline, problem, solution, benefits, how-it-works, objections, social-proof, FAQ, CTA)
6. Ads: at least 3 concepts (pain-based, outcome-based, identity-based) with distinct angles
7. When proof is needed but not provided, insert placeholders: "[Insert customer testimonial here]", "[Insert metric here]"
8. DO NOT fabricate testimonials, stats, or case studies

EXAMPLES OF PLACEHOLDERS:
- Social proof section: "[Insert customer testimonial here]"
- Stats: "[Insert conversion rate or performance metric here]"
- Case study: "[Insert case study details here]"

OUTPUT FORMAT: Return valid JSON array of asset objects.`

  const userPrompt = `Generate campaign assets for this product:

SELECTED MESSAGING ANGLE:
- Type: ${selectedAngle.type}
- Tagline: ${selectedAngle.tagline}
- Core Message: ${selectedAngle.coreMessage}

AIDA STRATEGY:
Attention:
- Objective: ${aidaStrategy.attention.objective}
- Content Direction: ${aidaStrategy.attention.contentDirection}
- Key Points: ${aidaStrategy.attention.keyPoints.join(', ')}

Interest:
- Objective: ${aidaStrategy.interest.objective}
- Content Direction: ${aidaStrategy.interest.contentDirection}
- Key Points: ${aidaStrategy.interest.keyPoints.join(', ')}

Desire:
- Objective: ${aidaStrategy.desire.objective}
- Content Direction: ${aidaStrategy.desire.contentDirection}
- Key Points: ${aidaStrategy.desire.keyPoints.join(', ')}
${aidaStrategy.desire.proofRequirements ? `- Proof Requirements: ${aidaStrategy.desire.proofRequirements.join(', ')}` : ''}

Action:
- Objective: ${aidaStrategy.action.objective}
- Content Direction: ${aidaStrategy.action.contentDirection}
- Key Points: ${aidaStrategy.action.keyPoints.join(', ')}

PRODUCT:
- Name: ${productBrief.productName}
- CTA: ${productBrief.desiredCTA}
${productBrief.customerTestimonials ? `- Testimonials: ${productBrief.customerTestimonials}` : ''}

Generate: 4 LinkedIn posts, 4 emails, 1 landing page, 3+ ad concepts.`

  const result = await callLLMWithStructuredOutput<CampaignAssets>({
    schema: CampaignAssetsSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxRetries: 3
  })

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
```

### Agent 5: Campaign Critic

**Purpose**: Score and critique the generated campaign, identify weaknesses, and provide actionable recommendations.

**Input**: Campaign (all data), AidaStrategy, Assets, ProductIntelligence

**Output**: Critique (scores, critical stage, findings, recommendations, primary recommendation with suggestedFix)

**Processing Logic**:
1. **Scoring**: Rate each AIDA stage (1-10), message consistency (1-10), audience fit (1-10)
   - Overall score = arithmetic mean of all 6 scores, rounded to 1 decimal
2. **Critical Stage Identification**: Find lowest-scoring stage (if tie, pick earliest in sequence)
3. **Findings**: List specific issues per stage (severity: low/medium/high)
4. **Recommendations**: Provide actionable recommendations per stage with expected impact
5. **Primary Recommendation**: 
   - Target the critical stage
   - Reference actual product and customer from intelligence
   - Provide suggestedFix: specific content replacement
   - Include targetAssetIds: which assets to update

**Evaluation Criteria**:
- Audience fit: Does content speak to the ICP and address their pain?
- Specificity: Does content reference product-specific differentiators or use generic language?
- Differentiation: Is the unique value proposition clear?
- AIDA stage strength: Does each stage fulfill its strategic objective?
- CTA clarity: Is the call-to-action clear and compelling?
- Message consistency: Does messaging align across all channels and stages?
- Unsupported claims: Are placeholders used for missing proof, or is there fabrication?
- AI detection: Does language sound generic/robotic or authentic?

**Implementation**:

```typescript
// src/lib/pipeline/agents/campaign-critic.ts

import { Agent } from '../types'
import { Critique, CritiqueSchema } from '@/lib/types/campaign'
import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'

interface CriticInput {
  campaign: Campaign & { productBrief: ProductBrief, strategy: Strategy }
  aidaStrategy: AidaStrategy
  assets: Asset[]
  productIntelligence: ProductIntelligence
}

export const campaignCriticAgent: Agent<CriticInput, Critique> = async (input) => {
  const startTime = Date.now()

  const { campaign, aidaStrategy, assets, productIntelligence } = input.data

  const systemPrompt = `You are a campaign critic. Your job is to score and critique the campaign, identify the weakest stage, and provide an actionable recommendation.

CRITICAL RULES:
1. Score each AIDA stage (1-10), message consistency (1-10), audience fit (1-10)
2. Overall score = arithmetic mean of all 6 scores, rounded to 1 decimal
3. Critical stage = lowest-scoring stage (if tie, pick earliest: Attention → Interest → Desire → Action)
4. Primary recommendation must reference ACTUAL product and customer (not generic advice)
5. Suggested fix must be SPECIFIC content replacement (not "make it better")

EVALUATION CRITERIA:
- Audience fit: Does content address the ICP and their pain?
- Specificity: Product-specific differentiators or generic language?
- Differentiation: Is unique value clear?
- AIDA stage strength: Does each stage fulfill its objective?
- CTA clarity: Is the call-to-action compelling?
- Message consistency: Alignment across channels and stages?
- Unsupported claims: Proper placeholders for missing proof?
- AI detection: Generic/robotic or authentic language?

EXAMPLE PRIMARY RECOMMENDATION:
- Stage: desire
- Issue: "Your Desire stage is too feature-focused"
- Recommendation: "Replace 'Automated expense categorization' with 'Stop spending Sunday nights sorting receipts.'"
- Suggested Fix: [specific content replacement string]

OUTPUT FORMAT: Return valid JSON matching Critique schema.`

  const userPrompt = `Critique this campaign:

PRODUCT: ${campaign.productBrief?.productName}
ICP: ${productIntelligence.idealCustomerProfile}
PRIMARY PAIN: ${productIntelligence.primaryPain}
DIFFERENTIATORS: ${productIntelligence.differentiators.join(', ')}

AIDA STRATEGY:
${JSON.stringify(aidaStrategy, null, 2)}

ASSETS:
${assets.map(a => `[${a.channel}/${a.stage}] ${JSON.stringify(a.content)}`).join('\n\n')}

Score each stage, identify critical stage, provide findings and recommendations, and craft a primary recommendation with specific content fix.`

  const result = await callLLMWithStructuredOutput<Critique>({
    schema: CritiqueSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.6,
    maxRetries: 3
  })

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    }
  }
}
```

### Agent 6: Launch Calendar Generator

**Purpose**: Create a 7-day execution plan sequencing campaign assets into daily actions.

**Input**: Assets, AidaStrategy

**Output**: LaunchCalendar (7 days with actions)

**Processing Logic**:
1. **Stage Windows**: 
   - Attention: Days 1-2
   - Interest: Days 3-4
   - Desire: Days 5-6
   - Action: Day 7
2. **Asset Distribution**:
   - Landing page finalization: Day 1, first action
   - Distribute remaining assets across stage windows
   - Max 3 actions per day
3. **Empty Stage Handling**: If a stage has no assets, shift remaining stages to fill gap
4. **Overflow Handling**: If total assets > 21, schedule first 21 in AIDA order and warn about unscheduled assets
5. **Timing Expression**: Use relative days (Day 1, Day 2, etc.), not specific dates

**Implementation**:

```typescript
// src/lib/pipeline/agents/launch-calendar.ts

import { Agent } from '../types'
import { LaunchCalendar, LaunchCalendarSchema } from '@/lib/types/campaign'
import { callLLMWithStructuredOutput } from '@/lib/ai/llm-client'

interface LaunchCalendarInput {
  assets: Asset[]
  aidaStrategy: AidaStrategy
}

export const launchCalendarAgent: Agent<LaunchCalendarInput, LaunchCalendar> = async (input) => {
  const startTime = Date.now()

  const { assets, aidaStrategy } = input.data

  const systemPrompt = `You are a launch calendar generator. Your job is to create a 7-day execution plan sequencing campaign assets.

CRITICAL RULES:
1. Exactly 7 days (Day 1 through Day 7)
2. Stage windows: Attention (Day 1-2), Interest (Day 3-4), Desire (Day 5-6), Action (Day 7)
3. Landing page finalization: Day 1, first action
4. Max 3 actions per day
5. If total assets > 21, schedule first 21 in AIDA order and note unscheduled assets
6. Use relative timing (Day 1, Day 2, etc.), NOT specific dates
7. Each action must be imperative (e.g., "Publish Attention LinkedIn post", "Send Interest email")

OUTPUT FORMAT: Return valid JSON matching LaunchCalendar schema with 7 days.`

  const userPrompt = `Generate 7-day launch calendar for these assets:

ASSETS:
${assets.map(a => `[${a.channel}/${a.stage}] ${a.title || a.assetType} (ID: ${a.id})`).join('\n')}

AIDA STRATEGY STAGES:
- Attention: ${aidaStrategy.attention.objective}
- Interest: ${aidaStrategy.interest.objective}
- Desire: ${aidaStrategy.desire.objective}
- Action: ${aidaStrategy.action.objective}

Create 7-day plan with actions distributed across stage windows.`

  const result = await callLLMWithStructuredOutput<LaunchCalendar>({
    schema: LaunchCalendarSchema,
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxRetries: 3
  })

  return {
    result,
    metadata: {
      tokensUsed: result.tokensUsed || 0,
      executionTimeMs: Date.now() - startTime,
      modelVersion: 'gpt-4-turbo'
    }
  }
}
```

---

## Data Flow

### Campaign Creation Flow

```
User submits Product_Brief form
          ↓
createCampaignFromBrief server action
          ↓
1. Validate required fields
2. Create Campaign record (status: "draft")
3. Create ProductBrief record
4. Call runCampaignPipeline(campaignId, productBrief)
          ↓
Pipeline Stage 1: Product Analyst
  - Input: ProductBrief
  - Output: ProductIntelligence
  - Commit: Update Strategy record
  - Status: "intelligence_complete"
          ↓
Pipeline Stage 2: Positioning Strategist
  - Input: ProductBrief + ProductIntelligence
  - Output: Positioning + 3 MessagingAngles
  - Commit: Update Strategy record
  - Status: "positioning_complete"
          ↓
[PIPELINE PAUSES - USER SELECTS MESSAGING ANGLE]
          ↓
User selects messaging angle
          ↓
selectMessagingAngle server action
  - Update Strategy.selectedAngleIndex
  - Call resumePipelineAfterAngleSelection(campaignId, selectedAngleIndex)
          ↓
Pipeline Stage 3: AIDA Strategist
  - Input: ProductBrief + ProductIntelligence + Positioning + selectedAngle
  - Output: AidaStrategy
  - Commit: Update Strategy record
  - Status: "aida_complete"
          ↓
Pipeline Stage 4: Campaign Builder
  - Input: ProductBrief + AidaStrategy + selectedAngle
  - Output: Array of Assets
  - Commit: Create Asset records (transaction)
  - Status: "assets_complete"
          ↓
Pipeline Stage 5: Campaign Critic
  - Input: Campaign + AidaStrategy + Assets + ProductIntelligence
  - Output: Critique
  - Commit: Create Critique record
  - Status: "critique_complete"
          ↓
Pipeline Stage 6: Launch Calendar Generator
  - Input: Assets + AidaStrategy
  - Output: LaunchCalendar
  - Commit: Create LaunchCalendar record
  - Status: "complete"
          ↓
Campaign Dashboard displays all data
```

### Fix Campaign Flow

```
User clicks "Apply Recommendation" in Critique Panel
          ↓
applyCritiqueRecommendation server action
          ↓
1. Fetch Critique.primaryRecommendation
2. Extract targetAssetIds and suggestedFix
3. For each targetAssetId:
   a. Fetch Asset record
   b. Update Asset.content with suggestedFix
   c. Increment Asset.version
   d. Keep Asset.manuallyEdited = false (AI update)
4. Revalidate Campaign Dashboard path
          ↓
Dashboard re-renders with updated assets
```

### User Edit Flow

```
User edits Asset content inline
          ↓
AssetEditor calls updateAsset server action
          ↓
1. Update Asset.content with user's edits
2. Set Asset.manuallyEdited = true
3. Revalidate Campaign Dashboard path
          ↓
Dashboard re-renders with manual-edit indicator

[FUTURE REGENERATION OPERATIONS]
When regenerateAsset is called:
  - Skip assets where manuallyEdited = true
  - Only regenerate AI-managed assets
```

---

## Error Handling

### Pipeline Stage Failures

Each AI agent call is wrapped in retry logic with exponential backoff:

```typescript
// src/lib/ai/llm-client.ts

import { z } from 'zod'

interface LLMCallOptions<T> {
  schema: z.ZodSchema<T>
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxRetries?: number
}

export async function callLLMWithStructuredOutput<T>(
  options: LLMCallOptions<T>
): Promise<T & { tokensUsed?: number }> {
  const { schema, systemPrompt, userPrompt, temperature = 0.7, maxRetries = 3 } = options

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://anglework.vercel.app',
          'X-Title': 'Anglework'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
      }

      const completion = await response.json()
      const content = completion.choices?.[0]?.message?.content
      
      if (!content) throw new Error('Empty response from OpenRouter')

      const parsed = JSON.parse(content)
      const validated = schema.parse(parsed)
      
      return {
        ...validated,
        tokensUsed: completion.usage?.total_tokens
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  throw new Error(`LLM call failed after ${maxRetries} attempts: ${lastError?.message}`)
}
```

### Timeout Handling

Per requirements acceptance criteria (Req 2.7-2.8, Req 3.7, etc.), each pipeline stage has a 30-second timeout.

**Implementation Strategy**:
- Server Actions have a default timeout of 120 seconds in Vercel
- Each AI agent call should complete within 30 seconds
- If an agent exceeds 30 seconds, throw timeout error
- Pipeline orchestrator catches error and updates campaign status to "error"
- User can retry from the failed stage via UI button

```typescript
// src/lib/pipeline/agents/with-timeout.ts

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

// Usage in agent:
const result = await withTimeout(
  callLLMWithStructuredOutput({ ... }),
  30000,
  'Product Analyst agent exceeded 30 second timeout'
)
```

### Validation Errors

If an AI agent returns JSON that fails Zod validation:
1. Log the invalid response for debugging
2. Retry up to maxRetries times
3. If all retries fail, throw validation error
4. Pipeline orchestrator catches error and marks campaign as "error"
5. Display error message to user with option to retry

### Missing Required Fields

**Product_Brief Submission** (Req 1.4):
- Validate all required fields on form submission
- If any required field is empty, display field-specific error messages
- Do not create Campaign record until all required fields are populated

**Product_Intelligence Prerequisite** (Req 2.9):
- Before calling Product Analyst, check that ProductBrief contains: productName, targetCustomer, mainBenefit
- If any are missing, display error and prevent pipeline start

---

## Testing Strategy

### Unit Tests

**AI Agent Tests**:
- Mock OpenRouter API responses with valid structured outputs
- Test schema validation (valid and invalid inputs)
- Test placeholder insertion when proof is missing
- Test error handling and retry logic

**Server Action Tests**:
- Test form validation logic
- Test database transaction handling
- Test error responses and user-facing error messages

**Component Tests**:
- Test form field validation and error display
- Test inline asset editing and save behavior
- Test messaging angle selection flow

### Integration Tests

**Pipeline End-to-End**:
- Create a test campaign from a sample Product_Brief
- Mock all AI agent responses with realistic structured outputs
- Verify each pipeline stage commits data to database correctly
- Verify status transitions (draft → intelligence_complete → ... → complete)
- Test pipeline resumption after messaging angle selection
- Test Fix_Campaign flow (critique application)

**Database Tests**:
- Test Prisma schema migrations
- Test cascading deletes (Campaign → ProductBrief, Strategy, Assets, Critique, LaunchCalendar)
- Test asset query performance (by channel, by stage)

### Manual Testing Scenarios

1. **Happy Path**: Submit valid Product_Brief → select messaging angle → review complete campaign → apply critique recommendation
2. **Validation Errors**: Submit Product_Brief with missing required fields → verify field-specific errors
3. **Timeout**: Simulate slow AI response → verify timeout error handling and retry option
4. **Placeholder Insertion**: Submit Product_Brief without testimonials → verify placeholders in Desire-stage assets
5. **User Edits**: Edit LinkedIn post inline → regenerate campaign → verify edited post is NOT overwritten
6. **URL Validation** (Req 1.9): Submit Product_Brief with invalid website URL → verify validation error

---

## Key Implementation Decisions

### Why Structured Outputs at Every Stage?

**Problem**: Unstructured AI outputs (freeform text) lead to:
- Parsing failures when extracting specific fields
- Missing or malformed data that breaks dashboard rendering
- Inability to programmatically critique or regenerate content
- Type unsafety (no TypeScript guarantees)

**Solution**: Use JSON mode with Zod schemas for structured outputs:
- LLM returns valid JSON via OpenRouter's JSON mode
- Runtime validation catches malformed responses before database commit
- TypeScript types derived from schemas provide compile-time safety
- Critique can reliably access fields (e.g., `asset.content.subjectLine`)
- Fix_Campaign can target specific fields for replacement

**Implementation**: Each agent defines a Zod schema and uses it for validation. The LLM client sends requests to OpenRouter with JSON mode enabled and validates responses against the schema, retrying on parse failure.

### How "Never Fabricate Proof" Is Enforced

**Constraint**: When testimonials, metrics, or case studies are not provided in Product_Brief, the system must insert explicit placeholders rather than inventing data.

**Enforcement Mechanisms**:
1. **Agent Prompts**: Each agent's system prompt explicitly instructs: "If proof is referenced but not provided, insert placeholders: `[Insert customer testimonial here]`, `[Insert metric here]`, `[Insert case study here]`"
2. **Zod Schemas**: Proof-related fields are typed as `string` but validated for placeholder format in post-processing if needed
3. **Manual Review**: Campaign Critic evaluates for "unsupported claims" and flags fabricated content as a finding
4. **User Acceptance Criteria**: Req 1.6-1.7, Req 2.6, Req 3.8, Req 4.8, Req 5.7 all specify placeholder behavior

**Example**:
```typescript
// In AIDA Strategist output:
{
  stage: 'desire',
  contentDirection: 'Paint the transformation using customer outcomes. Reference social proof: [TESTIMONIAL], [STAT]',
  proofRequirements: ['[TESTIMONIAL]', '[STAT]']
}

// In Campaign Builder output (email body):
"Join [Insert number] freelancers who've reclaimed their Sundays. [Insert customer testimonial here]."
```

### How Single-Strategy-Many-Channels Is Maintained

**Constraint**: All campaign assets must derive from one AIDA strategy, not be generated independently per channel.

**Enforcement Mechanisms**:
1. **Sequential Pipeline**: Campaign Builder (Agent 4) receives the finalized AIDA_Strategy as input and generates all channel assets in a single invocation
2. **Messaging Angle Anchor**: The selected messaging angle is passed to both AIDA Strategist and Campaign Builder, ensuring consistent core message
3. **Prompt Instructions**: Campaign Builder system prompt states: "Use the selected messaging angle as the PRIMARY message anchor in ALL assets. Reference product-specific differentiators from AIDA strategy (not generic claims)."
4. **Critique Validation**: Campaign Critic scores "message consistency" across channels and flags deviations

**Data Flow**:
```
Selected Messaging Angle
          ↓
    AIDA Strategist (generates single strategy)
          ↓
    Campaign Builder (generates ALL assets from that strategy)
          ↓
    Campaign Critic (validates consistency)
```

### How Fix_Campaign Works

**User Flow**:
1. User views Campaign Dashboard with Critique Panel
2. Critique displays primary recommendation: "Your Desire stage is too feature-focused. Replace 'Automated expense categorization' with 'Stop spending Sunday nights sorting receipts.'"
3. User clicks "Apply Recommendation"
4. System updates the target assets with suggested fix
5. Dashboard re-renders with updated content

**Implementation**:
```typescript
// In Critique record:
{
  primaryRecommendation: {
    stage: 'desire',
    targetAssetIds: ['asset_id_1', 'asset_id_2'], // LinkedIn Desire post, Email 3
    recommendation: 'Replace feature-focused language with customer outcome',
    suggestedFix: 'Stop spending Sunday nights sorting receipts — get your time back without hiring an accountant.'
  }
}

// applyCritiqueRecommendation server action:
async function applyCritiqueRecommendation(campaignId: string) {
  const critique = await prisma.critique.findUnique({ where: { campaignId } })
  const { targetAssetIds, suggestedFix } = critique.primaryRecommendation

  await prisma.$transaction(
    targetAssetIds.map(assetId =>
      prisma.asset.update({
        where: { id: assetId },
        data: {
          content: {
            ...asset.content,
            // Update the specific field identified in recommendation
            // (e.g., LinkedIn post content, email body, etc.)
          },
          version: { increment: 1 }
        }
      })
    )
  )

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
```

**Why This Works**:
- Critique output includes targetAssetIds (specific assets to update)
- Critique output includes suggestedFix (exact content replacement)
- Structured output ensures we can reliably access and update specific fields
- Transaction ensures all updates succeed or fail atomically
- Revalidation triggers dashboard re-render with new content

### How User Edits Are Preserved

**Constraint**: User-edited assets must not be overwritten by AI regeneration operations (Req 8.3-8.4).

**Implementation**:
1. **manuallyEdited Flag**: Asset model includes `manuallyEdited: Boolean @default(false)`
2. **On User Edit**: When user saves an inline edit, `updateAsset` server action sets `manuallyEdited = true`
3. **On AI Regeneration**: When `regenerateAsset` is called (future feature), it checks `manuallyEdited` flag and skips those assets
4. **UI Indicator**: Dashboard displays a "manually modified" badge on edited assets

```typescript
// updateAsset server action:
async function updateAsset(assetId: string, content: string) {
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      content: JSON.parse(content), // Assumes JSON string from editor
      manuallyEdited: true,
      version: { increment: 1 }
    }
  })

  revalidatePath(`/campaign/${asset.campaignId}`)
  return { success: true }
}

// Future regenerateAsset server action:
async function regenerateAsset(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  
  if (asset.manuallyEdited) {
    return { error: 'Cannot regenerate manually edited asset' }
  }

  // Regenerate logic...
}
```

---

## Deployment

### Environment Variables

Required variables in Vercel project settings or `.env.local`:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.region.neon.tech/dbname?sslmode=require&connection_limit=10" # Pooled
DIRECT_DATABASE_URL="postgresql://user:password@host.region.neon.tech/dbname?sslmode=require" # Direct, for Prisma CLI

# OpenRouter API (free NVIDIA Nemotron model)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="nvidia/nemotron-3-super-120b-a12b:free"

# Next.js (auto-set by Vercel)
NEXTAUTH_URL="https://yourdomain.com" # If adding auth later
```

### Build Process

1. **Install Dependencies**: `npm install`
2. **Generate Prisma Client**: `prisma generate` (runs via `prebuild` script)
3. **Build Next.js**: `next build`
4. **Deploy to Vercel**: `vercel deploy`

### Database Setup

1. **Create Neon Project**: Sign up at neon.tech, create project, copy connection strings
2. **Set Environment Variables**: Add DATABASE_URL (pooled) and DIRECT_DATABASE_URL (direct) to Vercel
3. **Push Schema**: Run `prisma db push` to create tables (no migrations needed with Neon adapter)
4. **Verify Connection**: Run a test query via Prisma Studio or custom script

### Monitoring

- **Error Tracking**: Use Vercel's built-in error logging or integrate Sentry
- **AI Usage Tracking**: Log token usage per agent call for debugging (model is free, no cost tracking needed)
- **Pipeline Failures**: Set up alerts for campaigns stuck in "error" status
- **Performance**: Monitor server action execution time and database query duration

---

## Future Enhancements (Out of MVP Scope)

1. **Authentication**: Add NextAuth.js for user accounts (User model already defined)
2. **Batch Regeneration**: Allow regenerating multiple assets at once (respecting manuallyEdited flag)
3. **A/B Testing**: Generate multiple variants per asset for testing
4. **Export**: Export campaign assets to PDF, Google Docs, or marketing platforms
5. **Templates**: Save successful campaigns as templates for future use
6. **Analytics Integration**: Track campaign performance metrics
7. **Collaboration**: Multi-user editing and commenting on campaigns

---

## Appendix: Structured Output Implementation with OpenRouter

### LLM Client Implementation

The system uses OpenRouter's API with JSON mode and Zod validation to ensure structured outputs:

```typescript
// src/lib/ai/llm-client.ts

import { z } from 'zod'

interface LLMCallOptions<T> {
  schema: z.ZodSchema<T>
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxRetries?: number
}

export async function callLLMWithStructuredOutput<T>(
  options: LLMCallOptions<T>
): Promise<T & { tokensUsed?: number }> {
  const { schema, systemPrompt, userPrompt, temperature = 0.7, maxRetries = 3 } = options

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://anglework.vercel.app',
          'X-Title': 'Anglework'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
      }

      const completion = await response.json()
      const content = completion.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('Empty response from OpenRouter API')
      }

      const parsedJSON = JSON.parse(content)
      const validated = schema.parse(parsedJSON)
      
      return {
        ...validated,
        tokensUsed: completion.usage?.total_tokens
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      console.error(`LLM call attempt ${attempt + 1} failed:`, lastError.message)
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  throw new Error(`LLM call failed after ${maxRetries} attempts: ${lastError?.message}`)
}
```

### How It Works

1. **JSON Mode**: OpenRouter's `response_format: { type: 'json_object' }` instructs the model to return valid JSON
2. **Schema Validation**: Zod validates the parsed JSON against the expected schema
3. **Retry Logic**: If parsing or validation fails, the system retries with exponential backoff
4. **Type Safety**: TypeScript types are derived from Zod schemas, providing compile-time guarantees

### Key Differences from OpenAI Structured Outputs

- OpenAI's native structured outputs enforce schema at decode time (model cannot produce invalid JSON)
- OpenRouter with NVIDIA Nemotron uses JSON mode + post-validation (model produces JSON, we validate it)
- Both approaches achieve the same result: typed, validated JSON responses
- The retry logic handles cases where the model produces JSON that doesn't match the schema

### Schema Design Best Practices

1. **Use Descriptive Field Names**: `primaryPain` not `pain`
2. **Constrain String Lengths**: `z.string().min(10).max(500)`
3. **Constrain Array Lengths**: `z.array(z.string()).min(2).max(5)`
4. **Use Enums for Fixed Options**: `z.enum(['pain', 'outcome', 'time'])`
5. **Make Optional Fields Explicit**: `z.string().optional()` or `z.string().nullable()`
6. **Validate Nested Objects**: Use `.strict()` to disallow extra keys
7. **Include Schema Context in Prompts**: Reference field names and constraints in system prompts to guide the model
