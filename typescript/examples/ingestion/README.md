# Stripe Agent Toolkit - Ingestion Module

Drop-in SDK wrappers for **OpenAI**, **Anthropic**, and **Gemini** that automatically track token usage and send billing events to Stripe.

This is part of the [@stripe/agent-toolkit](https://github.com/stripe/agent-toolkit) package.

## Why Use This?

If you're building an AI application and want to implement usage-based billing with Stripe, this SDK handles all the token tracking and meter event reporting for you. Simply swap your AI SDK client with the wrapped version, and token usage is automatically sent to Stripe as meter events.

## Is this a proxy?

**No.** This is not a proxy service. Your API calls go directly from your application to the AI provider (OpenAI, Anthropic, or Gemini). This SDK simply wraps the official SDK clients to extract token usage from responses and report it to Stripe for billing.

### Stripe Account Configuration

Before using this toolkit, you'll need to configure your Stripe account for **Billing for LLM Tokens**. This feature automates all of the setup required to track billing for LLM tokens, including allowing you to add a desired percent markup for each model.

**Note:** Billing for LLM Tokens is currently in private preview. You can request access and learn more about setup in the [Stripe Token Billing documentation](https://docs.stripe.com/billing/token-billing).

## Installation

```bash
npm install @stripe/agent-toolkit

# Install only the SDK(s) you need:
npm install openai                    # For OpenAI
npm install @anthropic-ai/sdk         # For Anthropic
npm install @google/generative-ai     # For Gemini
```

## Quick Start

### OpenAI

```typescript
import {OpenAI} from '@stripe/agent-toolkit/ingestion';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  stripe: {
    stripeApiKey: process.env.STRIPE_API_KEY,
    verbose: true, // Optional: log meter events to console
  },
});

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{role: 'user', content: 'Hello!'}],
  stripeCustomerId: 'cus_123456', // Your Stripe customer ID
});

// Token usage is automatically sent to Stripe
```

**Supports:** Chat completions (streaming & non-streaming), Responses API (streaming, non-streaming, with `parse()`), Embeddings, Tool/Function calling

### Anthropic

```typescript
import {Anthropic} from '@stripe/agent-toolkit/ingestion';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  stripe: {
    stripeApiKey: process.env.STRIPE_API_KEY,
    verbose: true,
  },
});

const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{role: 'user', content: 'Hello!'}],
  stripeCustomerId: 'cus_123456',
});

// Token usage is automatically sent to Stripe
```

**Supports:** Messages (streaming & non-streaming), Tools, System prompts, Multi-turn conversations

### Gemini

```typescript
import {GoogleGenerativeAI} from '@stripe/agent-toolkit/ingestion';

const client = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  stripe: {
    stripeApiKey: process.env.STRIPE_API_KEY,
    verbose: true,
  },
});

const model = client.getGenerativeModel({model: 'gemini-2.0-flash-exp'});

const result = await model.generateContent({
  contents: [{role: 'user', parts: [{text: 'Hello!'}]}],
  stripeCustomerId: 'cus_123456',
});

// Token usage is automatically sent to Stripe
```

**Supports:** Text generation (streaming & non-streaming), Function calling, System instructions, Multi-turn chat

## How It Works

When you make an API call with a `stripeCustomerId` parameter, the wrapper:

1. Sends the request to the AI provider (OpenAI, Anthropic, or Gemini)
2. Extracts token usage from the response
3. Sends meter events to Stripe with the format:

```json
{
  "event_name": "token-billing-tokens",
  "timestamp": "2025-10-15T15:31:05.250Z",
  "payload": {
    "stripe_customer_id": "cus_123456",
    "value": "128",
    "model": "openai/gpt-4o-mini",
    "token_type": "input"
  }
}
```

Separate events are sent for input tokens and output tokens.

## Configuration

All clients require a `stripe` configuration object with your Stripe API key:

```typescript
import {OpenAI} from '@stripe/agent-toolkit/ingestion';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  stripe: {
    stripeApiKey: process.env.STRIPE_API_KEY,
  },
});
```

The `stripeCustomerId` parameter is optional on each API call. If omitted, no meter events will be sent to Stripe (useful for internal/test requests):

```typescript
// No billing event sent
const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{role: 'user', content: 'Hello!'}],
  // No stripeCustomerId provided
});
```

## Full Examples

For comprehensive examples including streaming, tool calling, multi-turn conversations, and more, see this directory:

- [`openai.ts`](./openai.ts) - All OpenAI features (chat, streaming, tools, responses API, embeddings)
- [`anthropic.ts`](./anthropic.ts) - All Anthropic features (messages, streaming, tools)
- [`gemini.ts`](./gemini.ts) - All Gemini features (generation, streaming, functions)

## API Compatibility

These wrappers are **drop-in replacements** for the official SDKs. All methods, types, and behaviors are preserved - we only add the `stripeCustomerId` parameter and automatic usage tracking.
