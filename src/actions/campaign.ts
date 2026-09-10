// Server actions for campaign management
// All actions use 'use server' directive and run on the server

'use server'

import { prisma } from '@/db'
import { ProductBriefSchema, type ProductBriefData, type MessagingAngle } from '@/lib/types/campaign'
import { runCampaignPipeline, resumePipelineAfterAngleSelection } from '@/lib/pipeline/orchestrator'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Types
// ============================================================================

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

interface CreateCampaignResult {
  campaignId: string
}

// ============================================================================
// Campaign Creation
// ============================================================================

/**
 * Creates a new campaign from a product brief form submission
 * 
 * This action:
 * 1. Validates all form data server-side
 * 2. Creates Campaign and ProductBrief records in a transaction
 * 3. Triggers the pipeline orchestrator to begin AI processing
 * 4. Redirects to the campaign dashboard on success
 * 
 * Requirements: 1.4, 1.5, 8.5
 * 
 * @param formData - The form data from the ProductBriefForm
 * @returns Never returns on success (redirects), returns ActionResult with error on failure
 */
export async function createCampaignFromBrief(
  formData: FormData
): Promise<never | ActionResult<CreateCampaignResult>> {
  try {
    console.log('[Server Action] createCampaignFromBrief - Starting')

    // ========================================================================
    // Step 1: Extract and validate form data
    // ========================================================================
    
    const rawData: Partial<ProductBriefData> = {
      // Required fields
      productName: formData.get('productName') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      productType: formData.get('productType') as string,
      targetCustomer: formData.get('targetCustomer') as string,
      customerProblem: formData.get('customerProblem') as string,
      customerSophistication: formData.get('customerSophistication') as string,
      mainBenefit: formData.get('mainBenefit') as string,
      keyDifferentiator: formData.get('keyDifferentiator') as string,
      price: formData.get('price') as string,
      marketingGoal: formData.get('marketingGoal') as string,
      launchType: formData.get('launchType') as string,
      desiredCTA: formData.get('desiredCTA') as string,
      primaryChannel: formData.get('primaryChannel') as string,
      campaignDuration: formData.get('campaignDuration') as string,

      // Optional fields
      competitors: formData.get('competitors') as string | undefined,
      existingTagline: formData.get('existingTagline') as string | undefined,
      brandVoice: formData.get('brandVoice') as string | undefined,
      websiteURL: formData.get('websiteURL') as string | undefined,
      customerTestimonials: formData.get('customerTestimonials') as string | undefined,
      productDocs: formData.get('productDocs') as string | undefined,
      brandGuidelines: formData.get('brandGuidelines') as string | undefined,
      existingCopy: formData.get('existingCopy') as string | undefined
    }

    // Convert empty strings to undefined for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => [
        key,
        typeof value === 'string' && value.trim() === '' ? undefined : value
      ])
    ) as Partial<ProductBriefData>

    // Validate with Zod schema
    const validationResult = ProductBriefSchema.safeParse(cleanedData)

    if (!validationResult.success) {
      console.log('[Server Action] Validation failed:', validationResult.error)
      
      // Convert Zod errors to field-specific error messages per Req 1.4
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string
        fieldErrors[fieldName] = issue.message
      })

      return {
        success: false,
        error: 'Please correct the errors in the form',
        fieldErrors
      }
    }

    const productBriefData = validationResult.data

    console.log('[Server Action] Validation successful')

    // ========================================================================
    // Step 2: Validate prerequisite fields for Product Intelligence (Req 2.9)
    // ========================================================================
    
    if (!productBriefData.productName || !productBriefData.targetCustomer || !productBriefData.mainBenefit) {
      console.error('[Server Action] Missing prerequisite fields for Product Intelligence')
      
      const fieldErrors: Record<string, string> = {}
      if (!productBriefData.productName) fieldErrors.productName = 'Required for Product Intelligence'
      if (!productBriefData.targetCustomer) fieldErrors.targetCustomer = 'Required for Product Intelligence'
      if (!productBriefData.mainBenefit) fieldErrors.mainBenefit = 'Required for Product Intelligence'
      
      return {
        success: false,
        error: 'Cannot start pipeline: Product name, target customer, and main benefit are required',
        fieldErrors
      }
    }

    // ========================================================================
    // Step 3: Create Campaign and ProductBrief in transaction (Req 1.5)
    // ========================================================================
    
    console.log('[Server Action] Creating campaign and product brief in database')

    const campaign = await prisma.$transaction(async (tx) => {
      // Generate campaign name from product name
      const campaignName = `${productBriefData.productName} - ${productBriefData.launchType} Campaign`

      // Create Campaign record
      const newCampaign = await tx.campaign.create({
        data: {
          name: campaignName,
          status: 'draft',
          // userId is null in MVP (no auth yet)
          productBrief: {
            create: {
              // Required fields
              productName: productBriefData.productName,
              description: productBriefData.description,
              category: productBriefData.category,
              productType: productBriefData.productType,
              targetCustomer: productBriefData.targetCustomer,
              customerProblem: productBriefData.customerProblem,
              customerSophistication: productBriefData.customerSophistication,
              mainBenefit: productBriefData.mainBenefit,
              keyDifferentiator: productBriefData.keyDifferentiator,
              price: productBriefData.price,
              marketingGoal: productBriefData.marketingGoal,
              launchType: productBriefData.launchType,
              desiredCTA: productBriefData.desiredCTA,
              primaryChannel: productBriefData.primaryChannel,
              campaignDuration: productBriefData.campaignDuration,

              // Optional fields (will be null if undefined)
              competitors: productBriefData.competitors || null,
              existingTagline: productBriefData.existingTagline || null,
              brandVoice: productBriefData.brandVoice || null,
              websiteURL: productBriefData.websiteURL || null,
              customerTestimonials: productBriefData.customerTestimonials || null,
              productDocs: productBriefData.productDocs || null,
              brandGuidelines: productBriefData.brandGuidelines || null,
              existingCopy: productBriefData.existingCopy || null
            }
          }
        },
        include: {
          productBrief: true
        }
      })

      return newCampaign
    })

    console.log('[Server Action] Campaign created successfully:', campaign.id)

    // ========================================================================
    // Step 4: Trigger pipeline orchestrator (Req 1.5)
    // ========================================================================
    
    console.log('[Server Action] Triggering pipeline orchestrator')

    // Run pipeline asynchronously (don't await to avoid timeout)
    // The pipeline will update campaign status as it progresses
    runCampaignPipeline(campaign.id, productBriefData).catch((error) => {
      console.error('[Server Action] Pipeline execution failed:', error)
      // Error is already handled by the pipeline orchestrator
      // which updates campaign status to 'error'
    })

    console.log('[Server Action] Pipeline started - redirecting to campaign dashboard')

    // ========================================================================
    // Step 5: Redirect to Campaign Dashboard
    // ========================================================================
    
    // Redirect to campaign dashboard (Req 8.5)
    redirect(`/campaign/${campaign.id}`)

  } catch (error) {
    // Check if this is a redirect BEFORE logging (Bug #1 fix)
    // Next.js throws NEXT_REDIRECT for redirects - don't log as error, just re-throw
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }

    // Now log genuine errors only
    console.error('[Server Action] createCampaignFromBrief error:', error)

    // Handle unexpected errors
    if (error instanceof z.ZodError) {
      // Additional Zod error handling (shouldn't reach here due to safeParse)
      const fieldErrors: Record<string, string> = {}
      error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string
        fieldErrors[fieldName] = issue.message
      })

      return {
        success: false,
        error: 'Validation failed',
        fieldErrors
      }
    }


    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign. Please try again.'
    }
  }
}

// ============================================================================
// Placeholder functions for future tasks
// ============================================================================

/**
 * Selects a messaging angle and resumes the pipeline
 * 
 * This action:
 * 1. Validates the angleIndex parameter (must be 0, 1, or 2)
 * 2. Fetches the Strategy record for the campaign
 * 3. Verifies the campaign is in 'positioning_complete' status
 * 4. Updates Strategy.selectedAngleIndex in the database
 * 5. Calls resumePipelineAfterAngleSelection to trigger AIDA Strategy generation
 * 
 * Requirements: 3.3, 3.5
 * 
 * @param campaignId - The campaign ID
 * @param angleIndex - The index (0, 1, or 2) of the selected messaging angle
 * @returns ActionResult with success indicator or error details
 */
export async function selectMessagingAngle(
  campaignId: string,
  angleIndex: number
): Promise<ActionResult<{ success: true }>> {
  try {
    console.log('[Server Action] selectMessagingAngle - Starting', { campaignId, angleIndex })

    // ========================================================================
    // Step 1: Validate angleIndex parameter
    // ========================================================================
    
    if (!Number.isInteger(angleIndex) || angleIndex < 0 || angleIndex > 2) {
      console.error('[Server Action] Invalid angleIndex:', angleIndex)
      return {
        success: false,
        error: 'Invalid angle index. Must be 0, 1, or 2.'
      }
    }

    // ========================================================================
    // Step 2: Fetch Strategy and Campaign
    // ========================================================================
    
    const strategy = await prisma.strategy.findUnique({
      where: { campaignId },
      include: { campaign: true }
    })

    if (!strategy) {
      console.error('[Server Action] Strategy not found for campaign:', campaignId)
      return {
        success: false,
        error: 'Campaign strategy not found'
      }
    }

    // ========================================================================
    // Step 3: Verify campaign status
    // ========================================================================
    
    if (strategy.campaign.status !== 'positioning_complete') {
      console.error('[Server Action] Invalid campaign status:', strategy.campaign.status)
      return {
        success: false,
        error: `Cannot select messaging angle. Campaign status is '${strategy.campaign.status}', expected 'positioning_complete'.`
      }
    }

    // Verify the messaging angles array exists and has the selected index
    const messagingAngles = strategy.messagingAngles as MessagingAngle[]
    if (!Array.isArray(messagingAngles) || messagingAngles.length !== 3) {
      console.error('[Server Action] Invalid messaging angles:', messagingAngles)
      return {
        success: false,
        error: 'Campaign does not have valid messaging angles'
      }
    }

    if (!messagingAngles[angleIndex]) {
      console.error('[Server Action] Angle index out of bounds:', angleIndex)
      return {
        success: false,
        error: `Invalid angle index: ${angleIndex}`
      }
    }

    // ========================================================================
    // Step 4: Update selectedAngleIndex in database
    // ========================================================================
    
    console.log('[Server Action] Updating selectedAngleIndex in database')

    await prisma.strategy.update({
      where: { campaignId },
      data: { 
        selectedAngleIndex: angleIndex,
        updatedAt: new Date()
      }
    })

    console.log('[Server Action] selectedAngleIndex updated successfully')

    // ========================================================================
    // Step 5: Trigger pipeline resumption
    // ========================================================================
    
    console.log('[Server Action] Triggering pipeline resumption')

    // Run pipeline asynchronously (don't await to avoid timeout)
    // The pipeline will update campaign status as it progresses
    resumePipelineAfterAngleSelection(campaignId, angleIndex).catch((error) => {
      console.error('[Server Action] Pipeline resumption failed:', error)
      // Error is already handled by the pipeline orchestrator
      // which updates campaign status to 'error'
    })

    console.log('[Server Action] Pipeline resumption started - revalidating path')

    // ========================================================================
    // Step 6: Revalidate the campaign dashboard path
    // ========================================================================
    
    revalidatePath(`/campaign/${campaignId}`)

    return {
      success: true,
      data: { success: true }
    }

  } catch (error) {
    console.error('[Server Action] selectMessagingAngle error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to select messaging angle. Please try again.'
    }
  }
}

/**
 * Applies the Campaign Critic's primary recommendation
 * 
 * This action:
 * 1. Fetches the Critique record for the campaign
 * 2. Extracts the primaryRecommendation with targetAssetIds and suggestedFix
 * 3. Updates only the assets identified in targetAssetIds
 * 4. Applies the suggestedFix to the asset content
 * 5. Increments the asset version
 * 6. Keeps manuallyEdited = false (this is an AI-generated fix)
 * 7. Revalidates the campaign dashboard path
 * 
 * Requirements: 6.5, 6.6
 * 
 * @param campaignId - The campaign ID
 * @returns ActionResult with success indicator or error details
 */
export async function applyCritiqueRecommendation(
  campaignId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    console.log('[Server Action] applyCritiqueRecommendation - Starting', { campaignId })

    // ========================================================================
    // Step 1: Fetch Critique record
    // ========================================================================
    
    const critique = await prisma.critique.findUnique({
      where: { campaignId }
    })

    if (!critique) {
      console.error('[Server Action] Critique not found for campaign:', campaignId)
      return {
        success: false,
        error: 'Campaign critique not found'
      }
    }

    // ========================================================================
    // Step 2: Extract primaryRecommendation
    // ========================================================================
    
    const primaryRecommendation = critique.primaryRecommendation as {
      stage: string
      targetAssetIds: string[]
      recommendation: string
      suggestedFix: string
    }

    if (!primaryRecommendation || !primaryRecommendation.targetAssetIds || primaryRecommendation.targetAssetIds.length === 0) {
      console.error('[Server Action] Invalid primary recommendation:', primaryRecommendation)
      return {
        success: false,
        error: 'No target assets specified in recommendation'
      }
    }

    console.log('[Server Action] Primary recommendation:', {
      stage: primaryRecommendation.stage,
      targetAssetIds: primaryRecommendation.targetAssetIds,
      recommendation: primaryRecommendation.recommendation
    })

    // ========================================================================
    // Step 3: Fetch target assets
    // ========================================================================
    
    const targetAssets = await prisma.asset.findMany({
      where: {
        campaignId,
        id: {
          in: primaryRecommendation.targetAssetIds
        }
      }
    })

    if (targetAssets.length === 0) {
      console.error('[Server Action] No assets found with IDs:', primaryRecommendation.targetAssetIds)
      return {
        success: false,
        error: 'Target assets not found'
      }
    }

    console.log('[Server Action] Found target assets:', targetAssets.map(a => ({
      id: a.id,
      channel: a.channel,
      stage: a.stage,
      assetType: a.assetType
    })))

    // ========================================================================
    // Step 4: Apply suggestedFix to each target asset
    // ========================================================================
    
    // The suggestedFix is the new content to apply
    // Since different asset types have different content structures,
    // we need to intelligently update the content field
    
    const updatePromises = targetAssets.map(async (asset) => {
      const currentContent = asset.content as Record<string, any>
      
      // Determine which field to update based on asset type
      // For most assets, we'll update the primary content field
      let updatedContent = { ...currentContent }
      
      // Apply the fix based on asset type
      if (asset.assetType === 'post') {
        // LinkedIn post - update the content field
        updatedContent.content = primaryRecommendation.suggestedFix
      } else if (asset.assetType === 'email') {
        // Email - update the body field
        updatedContent.body = primaryRecommendation.suggestedFix
      } else if (asset.assetType === 'page_section') {
        // Landing page - this is more complex, might update specific sections
        // For now, we'll update the primary content field that matches the stage
        if (primaryRecommendation.stage === 'attention') {
          updatedContent.headline = primaryRecommendation.suggestedFix
        } else {
          // Update the most relevant section
          updatedContent.problemSection = primaryRecommendation.suggestedFix
        }
      } else if (asset.assetType === 'ad') {
        // Ad concept - update the primaryText field
        updatedContent.primaryText = primaryRecommendation.suggestedFix
      }
      
      // Update the asset in the database
      return prisma.asset.update({
        where: { id: asset.id },
        data: {
          content: updatedContent,
          version: asset.version + 1,
          manuallyEdited: false, // AI-generated fix, not manual
          updatedAt: new Date()
        }
      })
    })

    await Promise.all(updatePromises)

    console.log('[Server Action] Successfully updated', targetAssets.length, 'assets')

    // ========================================================================
    // Step 5: Revalidate the campaign dashboard path
    // ========================================================================
    
    revalidatePath(`/campaign/${campaignId}`)

    console.log('[Server Action] Path revalidated')

    return {
      success: true,
      data: { success: true }
    }

  } catch (error) {
    console.error('[Server Action] applyCritiqueRecommendation error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply recommendation. Please try again.'
    }
  }
}

/**
 * Updates a campaign asset with user edits
 * 
 * This action:
 * 1. Validates the assetId and content parameters
 * 2. Fetches the asset from the database
 * 3. Updates the asset content with the user's edits
 * 4. Sets manuallyEdited flag to true (per Req 8.3-8.4)
 * 5. Increments the asset version
 * 6. Persists changes within 2 seconds (per Req 8.3)
 * 7. Revalidates the campaign dashboard path
 * 
 * Requirements: 8.3, 8.4
 * 
 * @param assetId - The asset ID
 * @param content - The updated content as a JSON string
 * @returns ActionResult with success indicator or error details
 */
export async function updateAsset(
  assetId: string,
  content: string
): Promise<ActionResult<{ success: true }>> {
  try {
    console.log('[Server Action] updateAsset - Starting', { assetId })

    // ========================================================================
    // Step 1: Validate parameters
    // ========================================================================
    
    if (!assetId || typeof assetId !== 'string') {
      console.error('[Server Action] Invalid assetId:', assetId)
      return {
        success: false,
        error: 'Invalid asset ID'
      }
    }

    if (!content || typeof content !== 'string') {
      console.error('[Server Action] Invalid content:', content)
      return {
        success: false,
        error: 'Invalid content'
      }
    }

    // ========================================================================
    // Step 2: Parse content JSON
    // ========================================================================
    
    let parsedContent: any
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      console.error('[Server Action] Failed to parse content JSON:', parseError)
      return {
        success: false,
        error: 'Invalid content format'
      }
    }

    // ========================================================================
    // Step 3: Fetch asset from database
    // ========================================================================
    
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      console.error('[Server Action] Asset not found:', assetId)
      return {
        success: false,
        error: 'Asset not found'
      }
    }

    console.log('[Server Action] Found asset:', {
      id: asset.id,
      channel: asset.channel,
      stage: asset.stage,
      assetType: asset.assetType
    })

    // ========================================================================
    // Step 4: Update asset with user edits
    // ========================================================================
    
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        content: parsedContent,
        manuallyEdited: true, // Per Req 8.4
        version: asset.version + 1,
        updatedAt: new Date()
      }
    })

    console.log('[Server Action] Asset updated successfully:', {
      id: updatedAsset.id,
      version: updatedAsset.version,
      manuallyEdited: updatedAsset.manuallyEdited
    })

    // ========================================================================
    // Step 5: Revalidate the campaign dashboard path
    // ========================================================================
    
    revalidatePath(`/campaign/${asset.campaignId}`)

    console.log('[Server Action] Path revalidated')

    return {
      success: true,
      data: { success: true }
    }

  } catch (error) {
    console.error('[Server Action] updateAsset error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update asset. Please try again.'
    }
  }
}

/**
 * Regenerates a campaign asset
 * TODO: Implement in future enhancement
 */
export async function regenerateAsset(
  assetId: string
): Promise<ActionResult<{ success: true }>> {
  // Placeholder for future enhancement
  console.log('[Server Action] regenerateAsset - Not yet implemented')
  return {
    success: false,
    error: 'Not yet implemented'
  }
}
