# Stripe AI SDK Provider

The Stripe AI SDK Provider enables seamless integration with leading AI models through Stripe's unified LLM proxy at `llm.stripe.com`. This custom provider for the Vercel AI SDK automatically tracks token usage and integrates with Stripe's billing system, making it easy to monetize AI features in your applications.

## ⚠️ Private Preview Access Required

**Please note:** The Stripe AI SDK Provider is currently only available to organizations participating in the Billing for LLM Tokens Private Preview. If you do not have access and would like to request it, please visit:

**[Request Access to Billing for LLM Tokens Private Preview](https://docs.stripe.com/billing/token-billing)**

## Why Use Stripe AI SDK Provider?

- **Automatic Usage Tracking**: Token consumption is automatically tracked and reported to Stripe for billing
- **Multi-Model Support**: Access models from OpenAI, Google Gemini, and Anthropic Claude through a single API
- **Built-in Billing**: Seamlessly integrate AI costs into your existing Stripe billing workflow
- **Customer Attribution**: Automatically attribute usage to specific customers for accurate billing
- **Production-Ready**: Enterprise-grade infrastructure with Stripe's reliability
- **Transparent Costs**: Track and bill AI usage alongside your other Stripe products

Learn more about Stripe's Token Billing in the [Stripe Documentation](https://docs.stripe.com/billing/token-billing).

## Setup

The Stripe AI SDK Provider is available in the `@stripe/ai-sdk-provider` module. You can install it with:

```bash
npm install @stripe/ai-sdk-provider
```

## Provider Instance

To create a Stripe provider instance, use the `createStripe` function:

```typescript
import { createStripe } from '@stripe/ai-sdk-provider';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx', // Optional default customer ID
});
```

### Configuration Options

- **`apiKey`** (required): Your Stripe API key from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **`customerId`** (optional): Default customer ID to attribute usage to
- **`baseURL`** (optional): Custom base URL (defaults to `https://llm.stripe.com`)
- **`headers`** (optional): Additional headers to include in requests

## Supported Models

The Stripe provider supports models from multiple providers through a unified interface. Specify models using the format `provider/model-name`:

### OpenAI Models

```typescript
const model = stripe('openai/gpt-5');
const miniModel = stripe('openai/gpt-5-mini');
const reasoningModel = stripe('openai/o3');
```

**Available Models:**
- `openai/gpt-5`, `openai/gpt-5-mini`, `openai/gpt-5-nano`
- `openai/gpt-4.1`, `openai/gpt-4.1-mini`, `openai/gpt-4.1-nano`
- `openai/gpt-4o`, `openai/gpt-4o-mini`
- `openai/o3`, `openai/o3-mini`, `openai/o3-pro`
- `openai/o1`, `openai/o1-mini`, `openai/o1-pro`

### Google Gemini Models

```typescript
const model = stripe('google/gemini-2.5-pro');
const fastModel = stripe('google/gemini-2.5-flash');
```

**Available Models:**
- `google/gemini-2.5-pro`
- `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`
- `google/gemini-2.0-flash`, `google/gemini-2.0-flash-lite`

### Anthropic Claude Models

```typescript
const model = stripe('anthropic/claude-sonnet-4');
const capableModel = stripe('anthropic/claude-opus-4');
```

**Available Models:**
- `anthropic/claude-opus-4`, `anthropic/claude-opus-4-1`
- `anthropic/claude-sonnet-4`, `anthropic/claude-3-7-sonnet`
- `anthropic/claude-3-5-haiku`, `anthropic/claude-3-haiku`

## Examples

### Generate Text

```typescript
import { createStripe } from '@stripe/ai-sdk-provider';
import { generateText } from 'ai';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
});

const { text } = await generateText({
  model: stripe('openai/gpt-5'),
  prompt: 'What are the three primary colors?',
});

console.log(text);
```

### Stream Text

```typescript
import { createStripe } from '@stripe/ai-sdk-provider';
import { streamText } from 'ai';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
});

const result = streamText({
  model: stripe('google/gemini-2.5-flash'),
  prompt: 'Write a short story about AI.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Tool Calling

```typescript
import { createStripe } from '@stripe/ai-sdk-provider';
import { generateText } from 'ai';
import { z } from 'zod';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
});

const result = await generateText({
  model: stripe('anthropic/claude-sonnet-4'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: {
      description: 'Get the current weather for a location',
      parameters: z.object({
        location: z.string().describe('The city name'),
      }),
      execute: async ({ location }) => ({
        temperature: 72,
        condition: 'Sunny',
      }),
    },
  },
});

console.log(result.text);
```

### Multi-turn Conversations

```typescript
import { createStripe } from '@stripe/ai-sdk-provider';
import { generateText } from 'ai';

const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
});

const result = await generateText({
  model: stripe('openai/gpt-4.1'),
  messages: [
    { role: 'user', content: 'What is the capital of France?' },
    { role: 'assistant', content: 'The capital of France is Paris.' },
    { role: 'user', content: 'What is its population?' },
  ],
});

console.log(result.text);
```

## Customer ID Management

The Stripe provider offers flexible customer ID configuration to ensure accurate billing attribution. Customer IDs can be specified at three levels (in order of priority):

### 1. Per-Request Override (Highest Priority)

```typescript
await generateText({
  model: stripe('openai/gpt-5'),
  prompt: 'Hello!',
  providerOptions: {
    stripe: {
      customerId: 'cus_request_specific',
    },
  },
});
```

### 2. Model-Level Setting

```typescript
const model = stripe('openai/gpt-5', {
  customerId: 'cus_model_level',
});

await generateText({
  model,
  prompt: 'Hello!',
});
```

### 3. Provider-Level Default

```typescript
const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_provider_default',
});
```

## Advanced Features

### Custom Headers

Add custom headers to all requests:

```typescript
const stripe = createStripe({
  apiKey: process.env.STRIPE_API_KEY,
  customerId: 'cus_xxxxx',
  headers: {
    'X-Custom-Header': 'custom-value',
  },
});
```

### Model-Specific Settings

Configure settings for individual models:

```typescript
const model = stripe('anthropic/claude-sonnet-4', {
  customerId: 'cus_xxxxx',
  headers: {
    'X-Request-ID': 'unique-id',
  },
});
```

### Usage Tracking

Access token usage information after generation:

```typescript
const result = await generateText({
  model: stripe('openai/gpt-5'),
  prompt: 'Hello!',
});

console.log(result.usage);
// { inputTokens: 2, outputTokens: 10, totalTokens: 12 }
```

## Supported AI SDK Features

The Stripe provider supports all core AI SDK features:

- ✅ **Text Generation**: Both streaming and non-streaming
- ✅ **Tool Calling**: Full function calling support
- ✅ **Multi-turn Conversations**: Complex conversation histories
- ✅ **Streaming**: Real-time token streaming
- ✅ **Temperature & Sampling**: All standard generation parameters
- ✅ **Stop Sequences**: Custom stop sequence support
- ✅ **Token Limits**: Max output tokens configuration

## Additional Resources

- [Stripe Token Billing Documentation](https://docs.stripe.com/billing/token-billing)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [AI SDK Custom Providers Guide](https://sdk.vercel.ai/docs/providers/custom-providers)
- [Example Applications](./examples/)
