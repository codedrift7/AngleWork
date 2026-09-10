# LLM Provider Configuration Guide

This application now supports multiple LLM providers with per-agent model configuration. You can use Groq, OpenRouter, or mix them for different pipeline stages.

## Quick Start

### Using Groq (Default)

Groq is now the default provider for fast, high-quality responses.

1. Add your Groq API key to `.env.local`:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

2. Get a free API key at: https://console.groq.com/keys

3. That's it! The application will now use Groq for all pipeline stages.

### Using OpenRouter

To use OpenRouter instead:

1. Update `.env.local`:
```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
```

## Available Models

### Groq Models (Fast, High Quality)

| Model | Name | Use Case |
|-------|------|----------|
| **Llama 3.3 70B** | `llama-3.3-70b-versatile` | Best overall quality (Default) |
| Llama 3.1 70B | `llama-3.1-70b-versatile` | Alternative, slightly faster |
| Mixtral 8x7B | `mixtral-8x7b-32768` | Long context tasks |
| Gemma 2 9B | `gemma2-9b-it` | Lightweight tasks |

### OpenRouter Models (Free Tier)

| Model | Name | Use Case |
|-------|------|----------|
| Nvidia Nemotron | `nvidia/nemotron-3-super-120b-a12b:free` | High quality, free |
| Gemini 2.0 Flash | `google/gemini-2.0-flash-exp:free` | Fast, efficient |
| Mistral 7B | `mistralai/mistral-7b-instruct:free` | Lightweight |
| Qwen 32B | `qwen/qwen-2.5-32b-instruct:free` | Balanced quality |

## Per-Agent Configuration

You can configure different models for each pipeline stage. Edit `src/lib/ai/model-config.ts`:

```typescript
export const AGENT_MODEL_CONFIG: Record<string, AgentModelConfig> = {
  // Stage 1: Product Intelligence
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

  // Stage 4: Asset Generation (higher creativity)
  campaignBuilder: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.9
  },

  // Stage 5: Critique (lower temperature for analysis)
  campaignCritic: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6
  },

  // Stage 6: Calendar (structured output)
  launchCalendar: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5
  }
}
```

### Example: Mixed Provider Setup

Use Groq for fast tasks, OpenRouter for complex analysis:

```typescript
export const AGENT_MODEL_CONFIG: Record<string, AgentModelConfig> = {
  productAnalyst: {
    provider: 'openrouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.7
  },
  
  positioningStrategist: {
    provider: 'openrouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.8
  },
  
  // Use Groq for fast content generation
  campaignBuilder: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.9
  },

  // Groq for quick structured output
  launchCalendar: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5
  }
}
```

## Environment Variables Reference

### Required Variables

```env
# Database (Required)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Choose your provider
LLM_PROVIDER=groq  # or 'openrouter'
```

### Groq Configuration

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### OpenRouter Configuration

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
```

## Performance Comparison

### Groq
- ⚡ **Speed**: ~2-5 seconds per call
- ✅ **Quality**: Excellent (Llama 3.3 70B)
- 💰 **Cost**: Free tier available
- 📊 **Best for**: All pipeline stages

### OpenRouter
- ⏱️ **Speed**: ~10-30 seconds per call
- ✅ **Quality**: Varies by model
- 💰 **Cost**: Free tier with rate limits
- 📊 **Best for**: When Groq is unavailable

## Monitoring

The application logs which provider and model is used for each call:

```
[LLM] Using groq with model llama-3.3-70b-versatile
```

Check your server console to verify the correct provider is being used.

## Troubleshooting

### "GROQ_API_KEY environment variable is not set"

Add `GROQ_API_KEY=your_key` to `.env.local` and restart the dev server.

### "rate limit exceeded"

Groq free tier has limits. Wait a few seconds or switch to OpenRouter:
```env
LLM_PROVIDER=openrouter
```

### Slow responses

If using OpenRouter and experiencing slow responses, switch to Groq:
```env
LLM_PROVIDER=groq
```

### Testing specific providers

Override at call-time in tests:
```typescript
await callLLMWithStructuredOutput({
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  // ... other options
})
```

## Implementation Details

The multi-provider system is implemented in:
- `src/lib/ai/llm-client.ts` - Core provider logic
- `src/lib/ai/model-config.ts` - Per-agent configuration
- Each agent imports and uses `getAgentModelConfig()`

All agents have been updated to use the configuration system, allowing seamless provider switching without code changes.
