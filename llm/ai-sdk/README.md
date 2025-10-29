# Stripe AI SDK - Provider and metering utilities for Vercel AI SDK

The Stripe AI SDK provides comprehensive tools for integrating AI models with Stripe's billing infrastructure. This unified package includes both a custom Vercel AI SDK provider and metering utilities for tracking token usage across any AI SDK provider.

## ⚠️ Private Preview Access Required

**Please note:** The Stripe AI SDK is currently only available to organizations participating in the Billing for LLM Tokens Private Preview. If you do not have access and would like to request it, please visit:

**[Request Access to Billing for LLM Tokens Private Preview](https://docs.stripe.com/billing/token-billing)**

## Overview

This package contains two main components:

### 1. **Provider** (`@stripe/ai-sdk/provider`)

A custom Vercel AI SDK provider that routes requests through Stripe's LLM proxy at `llm.stripe.com`, enabling automatic usage tracking and billing integration.

**Key Features:**
- 🎯 **Unified API**: Access OpenAI, Google Gemini, and Anthropic Claude through a single interface
- 📊 **Automatic Tracking**: Token usage is automatically reported to Stripe
- 💰 **Built-in Billing**: Seamlessly integrate AI costs into your Stripe billing workflow
- 👥 **Customer Attribution**: Automatically attribute usage to specific customers
- 🔒 **Production-Ready**: Enterprise-grade infrastructure with Stripe's reliability

**Quick Start:**
```typescript
import { createStripe } from '@stripe/ai-sdk/provider';
import { generateText } from 'ai';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
});

const { text } = await generateText({
  model: stripe('openai/gpt-5'),
  prompt: 'What are the three primary colors?',
});
```

[→ Full Provider Documentation](./provider/README.md)

### 2. **Meter** (`@stripe/ai-sdk/meter`)

A wrapper utility that adds billing tracking to any Vercel AI SDK language model, allowing you to use your preferred provider while still tracking usage in Stripe.

**Key Features:**
- 🌐 **Universal Compatibility**: Works with any AI SDK v2 provider
- 🔌 **Non-Intrusive**: Preserves all original model functionality
- 🚀 **Fire-and-Forget**: Billing events are sent asynchronously
- 📈 **Automatic Metering**: Token consumption is automatically tracked
- 🎯 **Customer Attribution**: Attribute usage to specific customers

**Quick Start:**
```typescript
import { meteredModel } from '@stripe/ai-sdk/meter';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const model = meteredModel(
  openai('gpt-4o-mini'),
  process.env.STRIPE_API_KEY,
  'cus_xxxxx'
);

const { text } = await generateText({
  model,
  prompt: 'What are the three primary colors?',
});
```

[→ Full Meter Documentation](./meter/README.md)

## Installation

```bash
npm install @stripe/ai-sdk
```

## Which Should I Use?

### Use the **Provider** when:
- You want a unified interface to multiple AI providers
- You prefer routing through Stripe's LLM proxy
- You want automatic usage tracking without any wrapper code
- You're building a new application

### Use the **Meter** when:
- You need to use specific provider features or configurations
- You want to keep your existing provider setup
- You need direct access to the native provider APIs
- You're integrating into an existing codebase

## Usage Examples

### Provider Example

```typescript
import { createStripe } from '@stripe/ai-sdk/provider';
import { streamText } from 'ai';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
});

// Works with any supported model
const result = await streamText({
  model: stripe('anthropic/claude-sonnet-4'),
  prompt: 'Write a short story about AI.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Meter Example

```typescript
import { meteredModel } from '@stripe/ai-sdk/meter';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

const model = meteredModel(
  anthropic('claude-3-5-sonnet-20241022'),
  process.env.STRIPE_API_KEY,
  'cus_xxxxx'
);

const result = await streamText({
  model,
  prompt: 'Write a short story about AI.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

## Supported Models

### Provider Models
The provider supports models from:
- **OpenAI**: GPT-5, GPT-4.1, o3, o1, and more
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash, and more
- **Anthropic**: Claude Opus 4, Claude Sonnet 4, Claude Haiku, and more

### Meter Compatibility
The meter works with any AI SDK v2 provider, including:
- OpenAI (`@ai-sdk/openai`)
- Anthropic (`@ai-sdk/anthropic`)
- Google Gemini (`@ai-sdk/google`)
- Azure OpenAI
- Amazon Bedrock
- And any custom v2 provider

## Token Usage Tracking

Both components automatically report token usage to Stripe meter events:

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

## Documentation

- [Provider Documentation](./provider/README.md)
- [Meter Documentation](./meter/README.md)
- [Stripe Token Billing Documentation](https://docs.stripe.com/billing/token-billing)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)

## Examples

- [Provider Examples](./provider/examples/)
- [Meter Examples](./meter/examples/)

## License

MIT

