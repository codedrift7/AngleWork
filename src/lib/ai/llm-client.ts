import { z } from 'zod'

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openrouter' | 'groq'

/**
 * Provider-specific configuration
 */
interface ProviderConfig {
  apiKey: string
  model: string
  baseUrl: string
}

/**
 * Options for calling the LLM with structured output validation
 */
interface LLMCallOptions<T> {
  /** Zod schema for validating the LLM's JSON response */
  schema: z.ZodSchema<T>
  /** System prompt that defines the LLM's role and constraints */
  systemPrompt: string
  /** User prompt containing the specific task and data */
  userPrompt: string
  /** Temperature for response randomness (0-1). Default: 0.7 */
  temperature?: number
  /** Maximum number of retry attempts on failure. Default: 3 */
  maxRetries?: number
  /** Maximum time allowed for each provider request. */
  requestTimeoutMs?: number
  /** Maximum number of tokens the provider may generate. */
  maxTokens?: number
  /** LLM provider to use. Default: from env or 'groq' */
  provider?: LLMProvider
  /** Specific model to use (overrides env defaults) */
  model?: string
}

/**
 * Get provider configuration based on provider type
 */
function getProviderConfig(provider: LLMProvider, modelOverride?: string): ProviderConfig {
  switch (provider) {
    case 'groq': {
      const apiKey = process.env.GROQ_API_KEY
      if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is not set')
      }
      return {
        apiKey,
        model: modelOverride || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions'
      }
    }
    case 'openrouter': {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set')
      }
      return {
        apiKey,
        model: modelOverride || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions'
      }
    }
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Call LLM API with structured JSON output and Zod validation.
 * 
 * Supports multiple providers (Groq, OpenRouter) with automatic fallback.
 * 
 * This function:
 * - Sends requests to the configured LLM provider with JSON mode enabled
 * - Validates responses against the provided Zod schema
 * - Retries on failure with exponential backoff
 * - Returns typed, validated data
 * 
 * @throws Error if API call fails after all retries or if validation fails
 */
export async function callLLMWithStructuredOutput<T>(
  options: LLMCallOptions<T>
): Promise<T & { tokensUsed?: number; provider?: LLMProvider }> {
  const {
    schema,
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxRetries = 3,
    requestTimeoutMs = 110000,
    maxTokens,
    provider = (process.env.LLM_PROVIDER as LLMProvider) || 'groq',
    model
  } = options

  const providerConfig = getProviderConfig(provider, model)
  
  console.log(`[LLM] Using ${provider} with model ${providerConfig.model}`)

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController()
    const requestTimeout = setTimeout(() => controller.abort(), requestTimeoutMs)

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      }

      // Add OpenRouter-specific headers
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = process.env.NEXTAUTH_URL || 'https://anglework.vercel.app'
        headers['X-Title'] = 'Anglework'
      }

      const requestBody: any = {
        model: providerConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        ...(maxTokens ? { max_tokens: maxTokens } : {})
      }

      // Both Groq and OpenRouter support response_format for JSON mode
      requestBody.response_format = { type: 'json_object' }

      const response = await fetch(providerConfig.baseUrl, {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${provider} API error: ${response.status} ${errorText}`)
      }

      const completion = await response.json()
      const content = completion.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error(`Empty response from ${provider} API`)
      }

      // Parse JSON response
      const parsedJSON = JSON.parse(content)
      
      // Validate against schema
      const validated = schema.parse(parsedJSON)
      
      return {
        ...validated,
        tokensUsed: completion.usage?.total_tokens,
        provider
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Check for network/abort errors that should trigger immediate retry
      const isNetworkError = lastError.message.includes('aborted') || 
                            lastError.message.includes('network') ||
                            lastError.message.includes('fetch')
      
      // Enhanced error logging for Zod validation failures
      if (error instanceof z.ZodError) {
        const validationDetails = error.issues.map(issue => 
          `  - ${issue.path.join('.')}: ${issue.message}`
        ).join('\n')
        console.error(`[${provider}] Attempt ${attempt + 1} - Zod validation failed:\n${validationDetails}`)
        lastError = new Error(`ZodError: Validation failed:\n${validationDetails}`)
      } else {
        console.error(`[${provider}] Attempt ${attempt + 1} failed:`, lastError.message)
      }
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delayMs = isNetworkError ? 500 : Math.pow(2, attempt) * 1000
        console.log(`Retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } finally {
      clearTimeout(requestTimeout)
    }
  }

  throw new Error(`[${provider}] LLM call failed after ${maxRetries} attempts: ${lastError?.message}`)
}

/**
 * Wraps a promise with a timeout.
 * 
 * If the promise doesn't resolve within the specified time,
 * the timeout promise rejects with the provided error message.
 * 
 * Used to enforce 30-second timeouts on AI agent calls per requirements.
 * 
 * @param promise - The promise to wrap with a timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param errorMessage - Error message to use if timeout occurs
 * @returns The result of the promise if it resolves in time
 * @throws Error with errorMessage if timeout occurs
 */
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
