/**
 * Pipeline orchestrator for Anglework MVP
 * Coordinates sequential execution of all six AI agents
 * 
 * Stage 1: Product Analyst ? Product Intelligence
 * Stage 2: Positioning Strategist ? Positioning + 3 Messaging Angles
 * [User selects messaging angle]
 * Stage 3: AIDA Strategist ? AIDA Strategy  
 * Stage 4: Campaign Builder ? All Campaign Assets
 * Stage 5: Campaign Critic ? Critique + Recommendations
 * Stage 6: Launch Calendar ? 7-Day Launch Plan
 * 
 * Requirements: 2.1-2.8, 3.1-3.8, 4.1-4.9, 5.1-5.3, 6.1-6.8, 7.1-7.8
 */

import { prisma } from '@/db'
import { withTimeout } from '@/lib/ai/llm-client'
import { CampaignAssetOutput, CampaignAssetOutputSchema, MessagingAngle, ProductBriefData, ProductIntelligence } from '@/lib/types/campaign'
import { aidaStrategistAgent } from './agents/aida-strategist'
import { campaignBuilderAgent } from './agents/campaign-builder'
import { campaignCriticAgent } from './agents/campaign-critic'
import { launchCalendarAgent } from './agents/launch-calendar'
import { positioningStrategistAgent } from './agents/positioning-strategist'
import { productAnalystAgent } from './agents/product-analyst'

// ============================================================================
// Type Definitions
// ============================================================================

export interface PipelineError extends Error {
  stage?: string
  campaignId?: string
  retryable: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Updates campaign status in database
 * @param campaignId - Campaign ID
 * @param status - New campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: string
): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status }
  })
}

/**
 * Creates a structured pipeline error with campaign context
 * @param message - Error message
 * @param stage - Pipeline stage where error occurred
 * @param campaignId - Campaign ID
 * @param retryable - Whether the error is retryable
 */
export function createPipelineError(
  message: string,
  stage?: string,
  campaignId?: string,
  retryable: boolean = true
): PipelineError {
  const error = new Error(message) as PipelineError
  error.stage = stage
  error.campaignId = campaignId
  error.retryable = retryable
  return error
}

/**
 * Handles pipeline errors with campaign status updates
 * @param error - The error that occurred
 * @param campaignId - Campaign ID
 * @param stage - Pipeline stage
 */
export async function handlePipelineError(
  error: Error,
  campaignId: string,
  stage: string
): Promise<void> {
  console.error(`[Pipeline Error] Campaign: ${campaignId}`, {
    stage: stage || 'unknown',
    message: error.message,
    stack: error.stack
  })

  // Update campaign status to error state
  await updateCampaignStatus(campaignId, 'error')
}

/**
 * Validates that a campaign is in the expected status before resuming
 * @param campaignId - Campaign ID
 * @param expectedStatus - Expected campaign status
 */
export async function validateCampaignStatus(
  campaignId: string,
  expectedStatus: string
): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true }
  })

  return campaign?.status === expectedStatus
}

/**
 * Checks if a campaign can be resumed from a given status
 * @param campaignId - Campaign ID  
 */
export async function checkPipelineResumability(
  campaignId: string
): Promise<{ canResume: boolean; currentStatus: string | null }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true }
  })

  const resumableStatuses = ['positioning_complete', 'angle_selected']
  
  return {
    canResume: campaign ? resumableStatuses.includes(campaign.status) : false,
    currentStatus: campaign?.status || null
  }
}

/**
 * Converts Prisma ProductBrief to ProductBriefData
 */
export function toProductBriefData(brief: any): ProductBriefData {
  return {
    productName: brief.productName,
    description: brief.description,
    category: brief.category,
    productType: brief.productType,
    targetCustomer: brief.targetCustomer,
    customerProblem: brief.customerProblem,
    customerSophistication: brief.customerSophistication,
    mainBenefit: brief.mainBenefit,
    keyDifferentiator: brief.keyDifferentiator,
    price: brief.price,
    marketingGoal: brief.marketingGoal,
    launchType: brief.launchType,
    desiredCTA: brief.desiredCTA,
    primaryChannel: brief.primaryChannel,
    campaignDuration: brief.campaignDuration,
    competitors: brief.competitors || undefined,
    existingTagline: brief.existingTagline || undefined,
    brandVoice: brief.brandVoice || undefined,
    websiteURL: brief.websiteURL || undefined,
    customerTestimonials: brief.customerTestimonials || undefined,
    productDocs: brief.productDocs || undefined,
    brandGuidelines: brief.brandGuidelines || undefined,
    existingCopy: brief.existingCopy || undefined
  }
}

/**
 * Converts Prisma Asset to CampaignAssetOutput with validation
 * @param asset - Prisma Asset record
 * @returns Validated CampaignAssetOutput
 */
export function toCampaignAssetOutput(asset: {
  id: string
  channel: string
  stage: string
  assetType: string
  title: string | null
  content: any
}): CampaignAssetOutput {
  // Convert nullable title to optional title
  const baseAsset = {
    channel: asset.channel,
    stage: asset.stage,
    assetType: asset.assetType,
    content: asset.content,
    ...(asset.title ? { title: asset.title } : {})
  }

  // Validate and parse using the schema to ensure type safety
  return CampaignAssetOutputSchema.parse(baseAsset)
}

// ============================================================================
// Stage 1-2: Product Intelligence + Positioning (Before Angle Selection)
// ============================================================================

/**
 * Runs pipeline stages 1-2:
 * - Stage 1: Product Analyst ? Product Intelligence
 * - Stage 2: Positioning Strategist ? Positioning + 3 Messaging Angles
 * 
 * After completion, campaign status is 'positioning_complete' and user selects angle.
 * 
 * @param campaignId - Campaign ID
 * @param productBrief - Product brief data
 */
export async function runCampaignPipeline(
  campaignId: string,
  productBrief: ProductBriefData
): Promise<void> {
  try {
    console.log(`[Pipeline] Starting pipeline for campaign: ${campaignId}`)

    // ========================================================================
    // Stage 1: Product Analyst
    // ========================================================================
    console.log(`[Pipeline] Stage 1: Product Analyst - Starting`)
    await updateCampaignStatus(campaignId, 'intelligence_in_progress')

    // Call Product Analyst agent with 120-second timeout per Req 2.8 (Bug #2 fix)
    const productIntelligenceResult = await withTimeout(
      productAnalystAgent({
        data: productBrief,
        campaignId
      }),
      120000, // 120 seconds - increased from 30s to accommodate LLM analysis time (Bug #2 fix)
      'Product Analyst agent exceeded 120 second timeout'
    )

    await updateCampaignStatus(campaignId, 'intelligence_complete')
    console.log(`[Pipeline] Stage 1: Product Analyst - Complete`)
    console.log(`[Pipeline] Product Intelligence generated:`, {
      icp: productIntelligenceResult.result.idealCustomerProfile.substring(0, 50),
      recommendedAngle: productIntelligenceResult.result.recommendedMessagingAngle
    })

    // ========================================================================
    // Stage 2: Positioning Strategist
    // ========================================================================
    console.log(`[Pipeline] Stage 2: Positioning Strategist - Starting`)
    await updateCampaignStatus(campaignId, 'positioning_in_progress')

    // Call Positioning Strategist agent with 120-second timeout per Req 3.7
    const positioningResult = await withTimeout(
      positioningStrategistAgent({
        data: { 
          productBrief, 
          productIntelligence: productIntelligenceResult.result 
        },
        campaignId
      }),
      120000, // 120 seconds
      'Positioning Strategist agent exceeded 120 second timeout'
    )

    // Create Strategy record with all required fields after both Stage 1 and Stage 2 complete
    await prisma.strategy.create({
      data: {
        campaignId,
        productIntelligence: productIntelligenceResult.result as any,
        positioning: positioningResult.result.positioning,
        messagingAngles: positioningResult.result.messagingAngles
      }
    })

    await updateCampaignStatus(campaignId, 'positioning_complete')
    console.log(`[Pipeline] Stage 2: Positioning Strategist - Complete`)
    console.log(`[Pipeline] Positioning generated:`, {
      category: positioningResult.result.positioning.category,
      angles: positioningResult.result.messagingAngles.map((a: MessagingAngle) => a.type)
    })

    console.log(`[Pipeline] Stages 1-2 complete - awaiting user angle selection`)

  } catch (error) {
    await handlePipelineError(error as Error, campaignId, 'unknown')
    throw error
  }
}

// ============================================================================
// Stage 3-6: AIDA + Assets + Critique + Calendar (After Angle Selection)
// ============================================================================

/**
 * Resumes pipeline after user selects messaging angle:
 * - Stage 3: AIDA Strategist ? AIDA Strategy
 * - Stage 4: Campaign Builder ? All Campaign Assets
 * - Stage 5: Campaign Critic ? Critique + Recommendations
 * - Stage 6: Launch Calendar ? 7-Day Launch Plan
 * 
 * After completion, campaign status is 'complete'.
 * 
 * @param campaignId - Campaign ID
 * @param selectedAngleIndex - Index of selected messaging angle (0-2)
 */
export async function resumePipelineAfterAngleSelection(
  campaignId: string,
  selectedAngleIndex: number
): Promise<void> {
  try {
    console.log(`[Pipeline] Resuming pipeline for campaign: ${campaignId}`)
    console.log(`[Pipeline] Selected angle index: ${selectedAngleIndex}`)

    // Fetch campaign data with all relations
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        productBrief: true,
        strategy: true
      }
    })

    if (!campaign || !campaign.productBrief || !campaign.strategy) {
      throw createPipelineError(
        'Campaign, product brief, or strategy not found',
        'validation',
        campaignId,
        false
      )
    }

    const productBrief = toProductBriefData(campaign.productBrief)
    const productIntelligence = campaign.strategy.productIntelligence as ProductIntelligence
    const positioning = campaign.strategy.positioning as any
    const messagingAngles = campaign.strategy.messagingAngles as MessagingAngle[]
    const selectedAngle = messagingAngles[selectedAngleIndex]

    if (!selectedAngle) {
      throw createPipelineError(
        `Invalid angle index: ${selectedAngleIndex}`,
        'validation',
        campaignId,
        false
      )
    }

    // ========================================================================
    // Stage 3: AIDA Strategist
    // ========================================================================
    console.log(`[Pipeline] Stage 3: AIDA Strategist - Starting`)
    await updateCampaignStatus(campaignId, 'aida_in_progress')

    // Call AIDA Strategist agent with 120-second timeout per Req 4.7, 4.9
    const aidaStrategyResult = await withTimeout(
      aidaStrategistAgent({
        data: {
          productBrief,
          productIntelligence,
          positioning,
          selectedAngle
        },
        campaignId
      }),
      120000, // 120 seconds
      'AIDA Strategist agent exceeded 120 second timeout'
    )

    // Update Strategy with AIDA strategy
    await prisma.strategy.update({
      where: { campaignId },
      data: {
        aidaStrategy: aidaStrategyResult.result as any,
        selectedAngleIndex
      }
    })

    await updateCampaignStatus(campaignId, 'aida_complete')
    console.log(`[Pipeline] Stage 3: AIDA Strategist - Complete`)
    console.log(`[Pipeline] AIDA Strategy generated for stages: attention, interest, desire, action`)

    // ========================================================================
    // Stage 4: Campaign Builder
    // ========================================================================
    console.log(`[Pipeline] Stage 4: Campaign Builder - Starting`)
    await updateCampaignStatus(campaignId, 'assets_in_progress')

    // Call Campaign Builder agent with 90-second timeout per Req 5.2
    const assetBuilderResult = await withTimeout(
      campaignBuilderAgent({
        data: {
          productBrief,
          aidaStrategy: aidaStrategyResult.result,
          productIntelligence,
          selectedAngle
        },
        campaignId
      }),
      120000, // 120 seconds
      'Campaign Builder agent exceeded 120 second timeout'
    )

    // Create all assets in database
    const assetPromises = assetBuilderResult.result.map((asset: any) => {
      return prisma.asset.create({
        data: {
          campaignId,
          channel: asset.channel,
          stage: asset.stage,
          assetType: asset.assetType,
          title: asset.title,
          content: asset.content,
          version: 1,
          manuallyEdited: false
        }
      })
    })

    await Promise.all(assetPromises)

    await updateCampaignStatus(campaignId, 'assets_complete')
    console.log(`[Pipeline] Stage 4: Campaign Builder - Complete`)
    console.log(`[Pipeline] ${assetBuilderResult.result.length} assets created`)

    // ========================================================================
    // Stage 5: Campaign Critic
    // ========================================================================
    console.log(`[Pipeline] Stage 5: Campaign Critic - Starting`)
    await updateCampaignStatus(campaignId, 'critique_in_progress')

    // Fetch all campaign assets for critique
    const campaignAssets = await prisma.asset.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' }
    })

    // Get fresh strategy with AIDA
    const strategyWithAIDA = await prisma.strategy.findUnique({
      where: { campaignId },
      include: { campaign: true }
    })

    if (!strategyWithAIDA) {
      throw createPipelineError(
        'Strategy not found for critique',
        'critique',
        campaignId,
        false
      )
    }

    const aidaStrategy = strategyWithAIDA.aidaStrategy as any

    // Convert Prisma assets to validated CampaignAssetOutput with proper types
    const assetOutputs: CampaignAssetOutput[] = campaignAssets.map(toCampaignAssetOutput)

    // Call Campaign Critic agent with 120-second timeout per Req 6.7
    const critiqueResult = await withTimeout(
      campaignCriticAgent({
        data: {
          campaign: {
            id: strategyWithAIDA.campaign.id,
            name: strategyWithAIDA.campaign.name,
            productBrief
          },
          aidaStrategy,
          assets: assetOutputs,
          productIntelligence
        },
        campaignId
      }),
      120000, // 120 seconds
      'Campaign Critic agent exceeded 120 second timeout'
    )

    // Create Critique record
    await prisma.critique.create({
      data: {
        campaignId,
        overallScore: critiqueResult.result.overallScore,
        attentionScore: critiqueResult.result.attentionScore,
        interestScore: critiqueResult.result.interestScore,
        desireScore: critiqueResult.result.desireScore,
        actionScore: critiqueResult.result.actionScore,
        messageConsistency: critiqueResult.result.messageConsistency,
        audienceFit: critiqueResult.result.audienceFit,
        criticalStage: critiqueResult.result.criticalStage,
        findings: critiqueResult.result.findings,
        recommendations: critiqueResult.result.recommendations,
        primaryRecommendation: critiqueResult.result.primaryRecommendation
      }
    })

    await updateCampaignStatus(campaignId, 'critique_complete')
    console.log(`[Pipeline] Stage 5: Campaign Critic - Complete`)
    console.log(`[Pipeline] Critique generated - Overall score: ${critiqueResult.result.overallScore}/10`)

    // ========================================================================
    // Stage 6: Launch Calendar
    // ========================================================================
    console.log(`[Pipeline] Stage 6: Launch Calendar - Starting`)
    await updateCampaignStatus(campaignId, 'calendar_in_progress')

    // Call Launch Calendar agent with 120-second timeout per Req 7.8
    const launchCalendarResult = await withTimeout(
      launchCalendarAgent({
        data: {
          assets: campaignAssets,
          aidaStrategy
        },
        campaignId
      }),
      120000, // 120 seconds
      'Launch Calendar agent exceeded 120 second timeout'
    )

    // Create LaunchCalendar record
    await prisma.launchCalendar.create({
      data: {
        campaignId,
        days: launchCalendarResult.result.days
      }
    })

    await updateCampaignStatus(campaignId, 'complete')
    console.log(`[Pipeline] Stage 6: Launch Calendar - Complete`)
    console.log(`[Pipeline] Launch calendar generated - ${launchCalendarResult.result.days.length} days`)

    console.log(`[Pipeline] All stages complete - Campaign ready!`)

  } catch (error) {
    await handlePipelineError(error as Error, campaignId, 'unknown')
    throw error
  }
}
