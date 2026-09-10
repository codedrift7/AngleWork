// Campaign Dashboard Page - Main view for a single campaign
// Task 12.1: Complete data fetching with error handling
// Task 12.2: Complete dashboard layout with all sections

import { prisma } from '@/db'
import { notFound } from 'next/navigation'
import type { Campaign, ProductBrief, Strategy, Asset, Critique, LaunchCalendar } from '@/generated/prisma/client'
import { ProductIntelligenceCard } from '@/components/ProductIntelligenceCard'
import { PositioningStrategySelector } from '@/components/PositioningStrategySelector'
import { AidaStrategyDisplay } from '@/components/AidaStrategyDisplay'
import { CampaignCritiquePanel } from '@/components/CampaignCritiquePanel'
import { LaunchCalendarDisplay } from '@/components/LaunchCalendarDisplay'
import { LinkedInPostCard } from '@/components/assets/LinkedInPostCard'
import { EmailAssetCard } from '@/components/assets/EmailAssetCard'
import { LandingPageDisplay } from '@/components/assets/LandingPageDisplay'
import { AdConceptCard } from '@/components/assets/AdConceptCard'
import type { 
  ProductIntelligence, 
  Positioning, 
  MessagingAngle, 
  AidaStrategy,
  Critique as CritiqueType,
  LaunchCalendar as LaunchCalendarType
} from '@/lib/types/campaign'

interface CampaignPageProps {
  params: Promise<{
    id: string
  }>
}

// Type for campaign with all relations
type CampaignWithRelations = Campaign & {
  productBrief: ProductBrief | null
  strategy: Strategy | null
  assets: Asset[]
  critique: Critique | null
  calendar: LaunchCalendar | null
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params

  // Validate campaign ID format (CUID format check)
  if (!id || typeof id !== 'string' || id.length === 0) {
    notFound()
  }

  // Fetch campaign with all relations in a single query
  let campaign: CampaignWithRelations | null
  
  try {
    campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        productBrief: true,
        strategy: true,
        assets: {
          orderBy: [
            { channel: 'asc' },
            { stage: 'asc' },
            { createdAt: 'asc' }
          ]
        },
        critique: true,
        calendar: true
      }
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    throw new Error('Failed to fetch campaign data')
  }

  // Handle campaign not found
  if (!campaign) {
    notFound()
  }

  // Determine overall campaign state
  const isComplete = campaign.status === 'complete'
  const hasError = campaign.status === 'error'
  const isProcessing = !isComplete && !hasError

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Campaign Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="mt-2 flex items-center gap-4 flex-wrap">
                <StatusBadge status={campaign.status} />
                <span className="text-sm text-gray-600">
                  Created: {campaign.createdAt.toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-600">
                  Updated: {campaign.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Overall Score Display */}
            {campaign.critique && (
              <div className="ml-4 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {campaign.critique.overallScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Overall Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Error State - Show prominently if error occurred */}
        {hasError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Pipeline Error</h3>
                <p className="mt-2 text-sm text-red-700">
                  An error occurred while processing your campaign. The pipeline has been halted at the current stage.
                  You can retry from this point or contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing State - Show if campaign is still being generated */}
        {isProcessing && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">Processing Campaign</h3>
                <p className="mt-2 text-sm text-blue-700">
                  Your campaign is being generated. This page will update as each stage completes.
                  You can refresh to see the latest status.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Pipeline Progress */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pipeline Progress</h2>
            <div className="space-y-3">
              <PipelineStageIndicator 
                name="Product Intelligence" 
                status={getPipelineStageStatus(campaign.status, 'intelligence')}
                hasData={campaign.strategy !== null}
              />
              <PipelineStageIndicator 
                name="Positioning Strategy" 
                status={getPipelineStageStatus(campaign.status, 'positioning')}
                hasData={campaign.strategy !== null && campaign.strategy.messagingAngles !== null}
              />
              <PipelineStageIndicator 
                name="AIDA Strategy" 
                status={getPipelineStageStatus(campaign.status, 'aida')}
                hasData={campaign.strategy?.aidaStrategy !== null}
              />
              <PipelineStageIndicator 
                name="Campaign Assets" 
                status={getPipelineStageStatus(campaign.status, 'assets')}
                hasData={campaign.assets.length > 0}
              />
              <PipelineStageIndicator 
                name="Campaign Critique" 
                status={getPipelineStageStatus(campaign.status, 'critique')}
                hasData={campaign.critique !== null}
              />
              <PipelineStageIndicator 
                name="Launch Calendar" 
                status={getPipelineStageStatus(campaign.status, 'calendar')}
                hasData={campaign.calendar !== null}
              />
            </div>
          </div>

          {/* Product Brief Summary */}
          {campaign.productBrief && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Brief</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Product Name" value={campaign.productBrief.productName} />
                <InfoField label="Category" value={campaign.productBrief.category} />
                <InfoField label="Product Type" value={campaign.productBrief.productType} />
                <InfoField label="Price" value={campaign.productBrief.price} />
                <InfoField label="Primary Channel" value={campaign.productBrief.primaryChannel} />
                <InfoField label="Campaign Duration" value={campaign.productBrief.campaignDuration} />
                <InfoField label="Marketing Goal" value={campaign.productBrief.marketingGoal} />
                <InfoField label="Launch Type" value={campaign.productBrief.launchType} />
              </div>
              
              <div className="mt-4 space-y-3">
                <InfoField label="Target Customer" value={campaign.productBrief.targetCustomer} fullWidth />
                <InfoField label="Customer Problem" value={campaign.productBrief.customerProblem} fullWidth />
                <InfoField label="Main Benefit" value={campaign.productBrief.mainBenefit} fullWidth />
                <InfoField label="Key Differentiator" value={campaign.productBrief.keyDifferentiator} fullWidth />
                <InfoField label="Desired CTA" value={campaign.productBrief.desiredCTA} fullWidth />
              </div>
            </div>
          )}

          {/* Product Intelligence Section */}
          {campaign.strategy?.productIntelligence && (
            <ProductIntelligenceCard 
              productIntelligence={campaign.strategy.productIntelligence as ProductIntelligence}
            />
          )}

          {/* Positioning Strategy Section */}
          {campaign.strategy?.positioning && campaign.strategy?.messagingAngles && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Positioning Strategy</h2>
              
              {/* Show positioning details */}
              <div className="mb-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Category</h3>
                  <p className="text-gray-900">{(campaign.strategy.positioning as Positioning).category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Positioning Statement</h3>
                  <p className="text-gray-900">{(campaign.strategy.positioning as Positioning).positioningStatement}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Value Proposition</h3>
                  <p className="text-gray-900">{(campaign.strategy.positioning as Positioning).valueProposition}</p>
                </div>
              </div>

              {/* Messaging Angle Selector */}
              <div className="pt-6 border-t border-gray-200">
                <PositioningStrategySelector
                  messagingAngles={campaign.strategy.messagingAngles as MessagingAngle[]}
                  selectedAngleIndex={campaign.strategy.selectedAngleIndex}
                  campaignId={campaign.id}
                />
              </div>
            </div>
          )}

          {/* AIDA Strategy Section */}
          {campaign.strategy?.aidaStrategy && (
            <AidaStrategyDisplay 
              aidaStrategy={campaign.strategy.aidaStrategy as AidaStrategy}
            />
          )}

          {/* Campaign Assets Section - Organized by Channel */}
          {campaign.assets.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Assets</h2>
              
              {/* LinkedIn Assets */}
              {getAssetsByChannel(campaign.assets, 'linkedin').length > 0 && (
                <section className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">LinkedIn Posts</h3>
                  <div className="space-y-4">
                    {getAssetsByChannel(campaign.assets, 'linkedin').map((asset) => (
                      <LinkedInPostCard key={asset.id} asset={asset as any} />
                    ))}
                  </div>
                </section>
              )}

              {/* Email Assets */}
              {getAssetsByChannel(campaign.assets, 'email').length > 0 && (
                <section className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Campaign</h3>
                  <div className="space-y-4">
                    {getAssetsByChannel(campaign.assets, 'email').map((asset) => (
                      <EmailAssetCard key={asset.id} asset={asset as any} />
                    ))}
                  </div>
                </section>
              )}

              {/* Landing Page Assets */}
              {getAssetsByChannel(campaign.assets, 'landing_page').length > 0 && (
                <section className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Landing Page</h3>
                  <div className="space-y-4">
                    {getAssetsByChannel(campaign.assets, 'landing_page').map((asset) => (
                      <LandingPageDisplay key={asset.id} asset={asset as any} />
                    ))}
                  </div>
                </section>
              )}

              {/* Ad Assets */}
              {getAssetsByChannel(campaign.assets, 'ads').length > 0 && (
                <section className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Concepts</h3>
                  <div className="space-y-4">
                    {getAssetsByChannel(campaign.assets, 'ads').map((asset) => (
                      <AdConceptCard key={asset.id} asset={asset as any} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Campaign Critique Section */}
          {campaign.critique && (
            <CampaignCritiquePanel 
              critique={campaign.critique as unknown as CritiqueType}
              campaignId={campaign.id}
            />
          )}

          {/* Launch Calendar Section */}
          {campaign.calendar && (
            <LaunchCalendarDisplay 
              calendar={campaign.calendar.days as unknown as LaunchCalendarType}
            />
          )}

          {/* Incomplete State Message */}
          {!campaign.productBrief && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No product brief found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This campaign was created but no product brief data is available.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to determine pipeline stage status
function getPipelineStageStatus(
  campaignStatus: string,
  stage: 'intelligence' | 'positioning' | 'aida' | 'assets' | 'critique' | 'calendar'
): 'pending' | 'in-progress' | 'complete' | 'error' {
  // Handle error state
  if (campaignStatus === 'error') {
    return 'error'
  }

  const statusOrder = [
    'draft',
    'intelligence_in_progress',
    'intelligence_complete',
    'positioning_in_progress',
    'positioning_complete',
    'aida_in_progress',
    'aida_complete',
    'assets_in_progress',
    'assets_complete',
    'critique_in_progress',
    'critique_complete',
    'calendar_in_progress',
    'complete'
  ]

  const currentIndex = statusOrder.indexOf(campaignStatus)
  
  if (currentIndex === -1) {
    // Unknown status - default to pending
    return 'pending'
  }
  
  const stageMap: Record<string, { inProgress: string; complete: string }> = {
    intelligence: { inProgress: 'intelligence_in_progress', complete: 'intelligence_complete' },
    positioning: { inProgress: 'positioning_in_progress', complete: 'positioning_complete' },
    aida: { inProgress: 'aida_in_progress', complete: 'aida_complete' },
    assets: { inProgress: 'assets_in_progress', complete: 'assets_complete' },
    critique: { inProgress: 'critique_in_progress', complete: 'critique_complete' },
    calendar: { inProgress: 'calendar_in_progress', complete: 'complete' }
  }

  const stageStatuses = stageMap[stage]
  const inProgressIndex = statusOrder.indexOf(stageStatuses.inProgress)
  const completeIndex = statusOrder.indexOf(stageStatuses.complete)

  if (currentIndex >= completeIndex) {
    return 'complete'
  } else if (currentIndex === inProgressIndex) {
    return 'in-progress'
  } else {
    return 'pending'
  }
}

// Helper to get unique channels from assets
function getUniqueChannels(assets: Asset[]): string[] {
  const channels = new Set(assets.map(a => a.channel))
  return Array.from(channels).sort()
}

// Helper to get assets by channel
function getAssetsByChannel(assets: Asset[], channel: string): Asset[] {
  return assets
    .filter(a => a.channel === channel)
    .sort((a, b) => {
      // Sort by stage order (attention, interest, desire, action, multi-stage)
      const stageOrder: Record<string, number> = {
        attention: 1,
        interest: 2,
        desire: 3,
        action: 4,
        'multi-stage': 5
      }
      const orderA = stageOrder[a.stage] || 999
      const orderB = stageOrder[b.stage] || 999
      return orderA - orderB
    })
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    'intelligence_in_progress': { label: 'Analyzing Product', color: 'bg-blue-100 text-blue-800' },
    'intelligence_complete': { label: 'Intelligence Complete', color: 'bg-green-100 text-green-800' },
    'positioning_in_progress': { label: 'Building Positioning', color: 'bg-blue-100 text-blue-800' },
    'positioning_complete': { label: 'Positioning Complete', color: 'bg-green-100 text-green-800' },
    'aida_in_progress': { label: 'Building Strategy', color: 'bg-blue-100 text-blue-800' },
    'aida_complete': { label: 'Strategy Complete', color: 'bg-green-100 text-green-800' },
    'assets_in_progress': { label: 'Generating Assets', color: 'bg-blue-100 text-blue-800' },
    'assets_complete': { label: 'Assets Complete', color: 'bg-green-100 text-green-800' },
    'critique_in_progress': { label: 'Critiquing Campaign', color: 'bg-blue-100 text-blue-800' },
    'critique_complete': { label: 'Critique Complete', color: 'bg-green-100 text-green-800' },
    'calendar_in_progress': { label: 'Building Calendar', color: 'bg-blue-100 text-blue-800' },
    'complete': { label: 'Complete', color: 'bg-green-100 text-green-800' },
    'error': { label: 'Error', color: 'bg-red-100 text-red-800' }
  }

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

// Pipeline Stage Indicator Component
function PipelineStageIndicator({ 
  name, 
  status,
  hasData 
}: { 
  name: string
  status: 'pending' | 'in-progress' | 'complete' | 'error'
  hasData?: boolean
}) {
  const statusConfig = {
    pending: {
      icon: '○',
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      label: 'Pending'
    },
    'in-progress': {
      icon: '◐',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'In Progress'
    },
    complete: {
      icon: '●',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'Complete'
    },
    error: {
      icon: '✕',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'Error'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-lg ${config.bgColor}`}>
      <span className={`text-xl ${config.color} font-bold`}>{config.icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{name}</span>
          {hasData && status === 'complete' && (
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

// Info Field Component
function InfoField({ 
  label, 
  value, 
  fullWidth = false 
}: { 
  label: string
  value: string
  fullWidth?: boolean 
}) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <dt className="text-sm font-medium text-gray-700">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 break-words">{value}</dd>
    </div>
  )
}
