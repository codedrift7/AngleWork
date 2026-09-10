// TypeScript types and Zod schemas for Anglework campaign data models
// All schemas are defined alongside their types for validation and type safety

import { z } from 'zod'

// ============================================================================
// Product Intelligence Schema
// ============================================================================

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

// ============================================================================
// Positioning Schema
// ============================================================================

export const PositioningSchema = z.object({
  category: z.string().min(5).max(100),
  positioningStatement: z.string().min(10).max(300),
  valueProposition: z.string().min(10).max(500),
  primaryPain: z.string().min(10).max(300),
  desiredTransformation: z.string().min(10).max(500)
})

export type Positioning = z.infer<typeof PositioningSchema>

// ============================================================================
// Messaging Angle Schema
// ============================================================================

export const MessagingAngleSchema = z.object({
  type: z.enum(['pain', 'outcome', 'time']),
  tagline: z.string().min(10).max(200),
  coreMessage: z.string().min(20).max(500),
  rationale: z.string().min(20).max(500)
})

export type MessagingAngle = z.infer<typeof MessagingAngleSchema>

// ============================================================================
// AIDA Stage Schema
// ============================================================================

export const AidaStageSchema = z.object({
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  objective: z.string().min(20).max(500),
  contentDirection: z.string().min(50).max(1000),
  keyPoints: z.array(z.string()).min(2).max(5),
  proofRequirements: z.array(z.string()).optional() // e.g., "[TESTIMONIAL]", "[STAT]"
})

export type AidaStage = z.infer<typeof AidaStageSchema>

// ============================================================================
// AIDA Strategy Schema
// ============================================================================

export const AidaStrategySchema = z.object({
  attention: AidaStageSchema,
  interest: AidaStageSchema,
  desire: AidaStageSchema,
  action: AidaStageSchema
})

export type AidaStrategy = z.infer<typeof AidaStrategySchema>

// ============================================================================
// Asset Schemas (vary by type)
// ============================================================================

// LinkedIn Post Schema
export const LinkedInPostSchema = z.object({
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  content: z.string().min(50).max(3000),
  strategicPurpose: z.string().min(20).max(300)
})

export type LinkedInPost = z.infer<typeof LinkedInPostSchema>

// Email Asset Schema
export const EmailAssetSchema = z.object({
  stage: z.enum(['attention', 'interest', 'desire', 'action']),
  subjectLine: z.string().min(10).max(60),
  previewText: z.string().min(10).max(90),
  body: z.string().min(100).max(3000),
  cta: z.string().min(5).max(100),
  strategicPurpose: z.string().min(20).max(300)
})

export type EmailAsset = z.infer<typeof EmailAssetSchema>

// Landing Page Schema
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

// Ad Concept Schema
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

// ============================================================================
// Critique Schema
// ============================================================================

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

// ============================================================================
// Launch Calendar Schema
// ============================================================================

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

// ============================================================================
// Product Brief Schema (for form validation)
// ============================================================================

export const ProductBriefSchema = z.object({
  // Required fields
  productName: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Product description must be at least 10 characters'),
  category: z.string().min(1, 'Product category is required'),
  productType: z.string().min(1, 'Product type is required'),
  targetCustomer: z.string().min(10, 'Target customer description must be at least 10 characters'),
  customerProblem: z.string().min(10, 'Customer problem description must be at least 10 characters'),
  customerSophistication: z.string().min(1, 'Customer sophistication level is required'),
  mainBenefit: z.string().min(10, 'Main benefit must be at least 10 characters'),
  keyDifferentiator: z.string().min(10, 'Key differentiator must be at least 10 characters'),
  price: z.string().min(1, 'Price or pricing model is required'),
  marketingGoal: z.string().min(1, 'Marketing goal is required'),
  launchType: z.string().min(1, 'Launch type is required'),
  desiredCTA: z.string().min(5, 'Desired CTA must be at least 5 characters'),
  primaryChannel: z.string().min(1, 'Primary channel is required'),
  campaignDuration: z.string().min(1, 'Campaign duration is required'),

  // Optional fields
  competitors: z.string().optional(),
  existingTagline: z.string().optional(),
  brandVoice: z.string().optional(),
  websiteURL: z.string().optional().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
    { message: 'Website URL must be a valid URL (starting with http:// or https://)' }
  ),
  customerTestimonials: z.string().optional(), // JSON array of testimonials
  productDocs: z.string().optional(),
  brandGuidelines: z.string().optional(),
  existingCopy: z.string().optional()
})

export type ProductBriefData = z.infer<typeof ProductBriefSchema>

// ============================================================================
// Positioning Output Schema (for Positioning Strategist agent)
// ============================================================================

export const PositioningOutputSchema = z.object({
  positioning: PositioningSchema,
  messagingAngles: z.array(MessagingAngleSchema).length(3)
})

export type PositioningOutput = z.infer<typeof PositioningOutputSchema>

// ============================================================================
// Campaign Assets Output Schema (for Campaign Builder agent)
// ============================================================================

export const CampaignAssetOutputSchema = z.object({
  channel: z.enum(['linkedin', 'email', 'landing_page', 'ads']),
  stage: z.enum(['attention', 'interest', 'desire', 'action', 'multi-stage']),
  assetType: z.enum(['post', 'email', 'page_section', 'ad']),
  title: z.string().optional(),
  content: z.union([
    LinkedInPostSchema,
    EmailAssetSchema,
    LandingPageSchema,
    AdConceptSchema
  ])
})

export type CampaignAssetOutput = z.infer<typeof CampaignAssetOutputSchema>

export const CampaignAssetsSchema = z.array(CampaignAssetOutputSchema)

export type CampaignAssets = z.infer<typeof CampaignAssetsSchema>

// ============================================================================
// Campaign Status Type
// ============================================================================

export type CampaignStatus = 
  | 'draft'
  | 'intelligence_in_progress'
  | 'intelligence_complete'
  | 'positioning_in_progress'
  | 'positioning_complete'
  | 'aida_in_progress'
  | 'aida_complete'
  | 'assets_in_progress'
  | 'assets_complete'
  | 'critique_in_progress'
  | 'critique_complete'
  | 'calendar_in_progress'
  | 'complete'
  | 'error'

// ============================================================================
// Helper Types
// ============================================================================

export type AidaStageName = 'attention' | 'interest' | 'desire' | 'action'
export type ChannelName = 'linkedin' | 'email' | 'landing_page' | 'ads'
export type AssetTypeName = 'post' | 'email' | 'page_section' | 'ad'
