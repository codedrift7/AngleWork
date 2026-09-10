/**
 * Model Configuration for Different Pipeline Agents
 * 
 * This allows fine-tuning which model handles each pipeline stage.
 * You can mix providers (e.g., Groq for fast tasks, OpenRouter for complex ones).
 */

import type { LLMProvider } from './llm-client'

export interface AgentModelConfig {
  provider: LLMProvider
  model?: string
  temperature?: number
}

/**
 * Default model configurations for each pipeline agent.
 * 
 * Recommendations:
 * - Groq (llama-3.3-70b-versatile): Fast, good for structured tasks
 * - Groq (llama-3.1-70b-versatile): Alternative fast model
 * - OpenRouter (nvidia/nemotron): Free, good quality
 * - OpenRouter (google/gemini-2.0-flash-exp:free): Fast, free
 */
export const AGENT_MODEL_CONFIG: Record<string, AgentModelConfig> = {
  // Stage 1: Product Intelligence Analysis
  productAnalyst: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7
  },

  // Stage 2: Positioning Strategy
  positioningStrategist: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.8
  },

  // Stage 3: AIDA Strategy
  aidaStrategist: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7
  },

  // Stage 4: Campaign Asset Generation
  campaignBuilder: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.9 // Higher creativity for content generation
  },

  // Stage 5: Campaign Critique
  campaignCritic: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6 // Lower for analytical tasks
  },

  // Stage 6: Launch Calendar
  launchCalendar: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5 // Structured output
  }
}

/**
 * Get model configuration for a specific agent
 */
export function getAgentModelConfig(agentName: string): AgentModelConfig {
  return AGENT_MODEL_CONFIG[agentName] || {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7
  }
}

/**
 * Merge agent-specific config with call-time overrides
 */
export function mergeModelConfig(
  agentName: string,
  overrides?: Partial<AgentModelConfig>
): AgentModelConfig {
  const baseConfig = getAgentModelConfig(agentName)
  return {
    ...baseConfig,
    ...overrides
  }
}

/**
 * Available Groq models
 */
export const GROQ_MODELS = {
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  LLAMA_3_1_70B: 'llama-3.1-70b-versatile',
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  GEMMA_2_9B: 'gemma2-9b-it'
} as const

/**
 * Available OpenRouter models (free tier)
 */
export const OPENROUTER_MODELS = {
  NVIDIA_NEMOTRON: 'nvidia/nemotron-3-super-120b-a12b:free',
  GEMINI_FLASH: 'google/gemini-2.0-flash-exp:free',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
  QWEN_32B: 'qwen/qwen-2.5-32b-instruct:free'
} as const
