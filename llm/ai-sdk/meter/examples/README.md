# AI SDK Billing Wrapper Examples

This directory contains examples demonstrating how to use the AI SDK Billing Wrapper to automatically track and report token usage to Stripe for billing purposes when using the Vercel AI SDK.

## Overview

The AI SDK Billing Wrapper intercepts calls to language models and automatically sends usage data to Stripe's meter events API, enabling you to bill customers based on their AI token consumption without manually tracking usage.

## Setup

1. Install dependencies from the ai-sdk-billing-wrapper directory:

```bash
cd llm/ai-sdk-billing-wrapper
npm install
```

2. Set up environment variables in the examples directory:

```bash
cd examples
cp .env.example .env
```

Then edit `.env` and add your credentials:

```bash
# Required for all examples
STRIPE_API_KEY=sk_test_...
STRIPE_CUSTOMER_ID=cus_...

# Provider-specific (only required for the provider you want to test)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## Running Examples

Run examples from the examples directory using ts-node:

### OpenAI Examples

```bash
npx ts-node openai.ts
```

Demonstrates:
- Basic text generation
- Streaming responses
- System messages
- Multi-turn conversations
- Different GPT models (GPT-4o-mini, GPT-4)
- Max tokens configuration

### Anthropic Claude Examples

```bash
npx ts-node anthropic.ts
```

Demonstrates:
- Basic text generation with Claude Sonnet
- Streaming responses
- System messages
- Multi-turn conversations
- Claude Haiku for faster responses
- Max tokens configuration

### Google Gemini Examples

```bash
npx ts-node google.ts
```

Demonstrates:
- Basic text generation with Gemini
- Streaming with Gemini Flash
- System messages
- Multi-turn conversations
- Temperature control

## How It Works

The `meteredModel` wrapper automatically:

1. **Intercepts API Calls**: Wraps any AI SDK v2 language model
2. **Tracks Token Usage**: Captures input tokens, output tokens, and model information
3. **Reports to Stripe**: Sends meter events to Stripe after each generation
4. **Handles Streaming**: Works with both streaming and non-streaming responses

## Basic Usage Pattern

```typescript
import { meteredModel } from '@stripe/ai-sdk-billing-wrapper';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const model = meteredModel(
  openai('gpt-4o-mini'),
  process.env.STRIPE_API_KEY,
  'cus_xxxxx'
);

const { text } = await generateText({
  model,
  prompt: 'Hello!',
});
```

## Supported Providers

The wrapper works with any AI SDK provider that implements the v2 specification (`LanguageModelV2`):

**Supported:**
- OpenAI (`@ai-sdk/openai`)
- Anthropic Claude (`@ai-sdk/anthropic`)
- Google Gemini (`@ai-sdk/google`)
- Azure OpenAI (via `@ai-sdk/openai`)
- Amazon Bedrock (`@ai-sdk/amazon-bedrock`)
- Together AI (via `createOpenAI`)
- Any custom provider implementing `LanguageModelV2`

**Not Supported:**
- Groq (`@ai-sdk/groq`) - uses v1 specification
- Any provider using `LanguageModelV1`

The wrapper enforces v2-only models at TypeScript compile time.

## Stripe Meter Events

Each API call generates meter events sent to Stripe:

```javascript
{
  event_name: 'token-billing-tokens',
  payload: {
    stripe_customer_id: 'cus_xxxxx',
    value: '100',
    model: 'openai/gpt-4o-mini',
    token_type: 'input'
  }
}
```

Metadata included:
- Provider (e.g., "openai", "anthropic", "google")
- Model ID (e.g., "gpt-4o-mini", "claude-sonnet-4")
- Input tokens
- Output tokens

## Error Handling

The wrapper handles errors gracefully:

- **Invalid Customer ID**: Throws an error before making the API call
- **Unsupported Models**: TypeScript prevents usage at compile time
- **Stripe API Errors**: Logged but don't interrupt the AI generation
- **Missing Tokens**: Handles responses without usage information

## Additional Resources

- [Stripe Meter Events Documentation](https://docs.stripe.com/api/billing/meter-event)
- [Stripe Token Billing Documentation](https://docs.stripe.com/billing/token-billing)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [AI SDK Providers](https://sdk.vercel.ai/docs/providers)
