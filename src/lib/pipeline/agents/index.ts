/**
 * AI Agents for Anglework Pipeline
 * 
 * Each agent is responsible for a specific stage of the campaign generation pipeline.
 */

export { productAnalystAgent } from './product-analyst'
export type { ProductAnalystInput, ProductAnalystOutput } from './product-analyst'

export { positioningStrategistAgent } from './positioning-strategist'
export type { PositioningStrategistInput, PositioningStrategistOutput } from './positioning-strategist'

export { aidaStrategistAgent } from './aida-strategist'
export type { AidaStrategistInput, AidaStrategistOutput } from './aida-strategist'

export { 
  campaignBuilderLinkedInAgent, 
  campaignBuilderEmailAgent, 
  campaignBuilderLandingPageAgent,
  campaignBuilderAdsAgent,
  campaignBuilderAgent
} from './campaign-builder'
export type { 
  CampaignBuilderLinkedInInput, 
  CampaignBuilderLinkedInOutput,
  CampaignBuilderEmailInput,
  CampaignBuilderEmailOutput,
  CampaignBuilderLandingPageInput,
  CampaignBuilderLandingPageOutput,
  CampaignBuilderAdsInput,
  CampaignBuilderAdsOutput,
  CampaignBuilderInput,
  CampaignBuilderOutput
} from './campaign-builder'

export { campaignCriticAgent } from './campaign-critic'
export type { CampaignCriticInput, CampaignCriticOutput } from './campaign-critic'

export { launchCalendarAgent } from './launch-calendar'
export type { LaunchCalendarInput, LaunchCalendarOutput } from './launch-calendar'
