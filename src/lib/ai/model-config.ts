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
 * Using OpenAI GPT-OSS-120B via Groq (FREE):
 * - 120 billion parameters
 * - ~500 tokens/sec throughput
 * - Built-in reasoning capabilities
 * - FREE tier: 30 RPM, 1K RPD, 8K TPM, 200K TPD
 */
export const AGENT_MODEL_CONFIG: Record<string, AgentModelConfig> = {
  // Stage 1: Product Intelligence Analysis
  productAnalyst: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    temperature: 0.7
  },

  // Stage 2: Positioning Strategy
  positioningStrategist: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    temperature: 0.8
  },

  // Stage 3: AIDA Strategy
  aidaStrategist: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    temperature: 0.7
  },

  // Stage 4: Campaign Asset Generation
  campaignBuilder: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    temperature: 0.9 // Higher creativity for content generation
  },

  // Stage 5: Campaign Critique
  campaignCritic: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    temperature: 0.6 // Lower for analytical tasks
  },

  // Stage 6: Launch Calendar
  launchCalendar: {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    temperature: 0.5 // Structured output
  }
}

/**
 * Get model configuration for a specific agent
 */
export function getAgentModelConfig(agentName: string): AgentModelConfig {
  return AGENT_MODEL_CONFIG[agentName] || {
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
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
 * Available Groq models (FREE tier)
 */
export const GROQ_MODELS = {
  // OpenAI GPT-OSS Models (FREE, recommended)
  GPT_OSS_120B: 'openai/gpt-oss-120b',      // 120B params, ~500 tok/s, reasoning
  GPT_OSS_20B: 'openai/gpt-oss-20b',        // 20B params, ~1000 tok/s, fast
  
  // Qwen Models (FREE)
  QWEN_3_8_27B: 'qwen/qwen3.8-27b',         // 27B params, good quality
  QWEN_3_6_27B: 'qwen/qwen3.6-27b',         // 27B params, alternative
  
  // Compound AI Models (FREE, with tool orchestration)
  COMPOUND: 'groq/compound',                 // Multi-agent system
  COMPOUND_MINI: 'groq/compound-mini',       // Lightweight multi-agent
  
  // Note: Llama models are NOT free anymore, avoid using them
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
