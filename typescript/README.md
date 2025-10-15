# Stripe Agent Toolkit - TypeScript

The Stripe Agent Toolkit enables popular agent frameworks including LangChain and Vercel's AI SDK to integrate with Stripe APIs through function calling. It also provides tooling to quickly integrate metered billing for prompt and completion token usage.

## Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package run:

```
npm install @stripe/agent-toolkit
```

### Requirements

- Node 18+

## Usage

The library needs to be configured with your account's secret key which is available in your [Stripe Dashboard][api-keys]. Additionally, `configuration` enables you to specify the types of actions that can be taken using the toolkit.

```typescript
import {StripeAgentToolkit} from '@stripe/agent-toolkit/langchain';

const stripeAgentToolkit = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    actions: {
      paymentLinks: {
        create: true,
      },
    },
  },
});
```

### Tools

The toolkit works with LangChain and Vercel's AI SDK and can be passed as a list of tools. For example:

```typescript
import {AgentExecutor, createStructuredChatAgent} from 'langchain/agents';

const tools = stripeAgentToolkit.getTools();

const agent = await createStructuredChatAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});
```

#### Context

In some cases you will want to provide values that serve as defaults when making requests. Currently, the `account` context value enables you to make API calls for your [connected accounts](https://docs.stripe.com/connect/authentication).

```typescript
const stripeAgentToolkit = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    context: {
      account: 'acct_123',
    },
  },
});
```

### Metered billing

For Vercel's AI SDK, you can use middleware to submit billing events for usage. All that is required is the customer ID and the input/output meters to bill.

```typescript
import {StripeAgentToolkit} from '@stripe/agent-toolkit/ai-sdk';
import {openai} from '@ai-sdk/openai';
import {
  generateText,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from 'ai';

const stripeAgentToolkit = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    actions: {
      paymentLinks: {
        create: true,
      },
    },
  },
});

const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: stripeAgentToolkit.middleware({
    billing: {
      customer: 'cus_123',
      meters: {
        input: 'input_tokens',
        output: 'output_tokens',
      },
    },
  }),
});
```

This works with both `generateText` and `generateStream` from the Vercel AI SDK.

## Usage Tracking / Ingestion

For direct integration with OpenAI, Anthropic, and Gemini SDKs, you can use the ingestion module which provides drop-in wrappers that automatically track token usage and send billing events to Stripe.

```typescript
import { OpenAI } from '@stripe/agent-toolkit/ingestion';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  stripe: {
    stripeApiKey: process.env.STRIPE_API_KEY,
    verbose: true, // Optional: log meter events to console
  },
});

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello!' }],
  stripeCustomerId: 'cus_123456', // Your Stripe customer ID
});
// Token usage is automatically sent to Stripe
```

The ingestion module supports:
- **OpenAI**: Chat completions (streaming & non-streaming), Responses API, Embeddings, Tool/Function calling
- **Anthropic**: Messages (streaming & non-streaming), Tools, System prompts, Multi-turn conversations
- **Gemini**: Text generation (streaming & non-streaming), Function calling, System instructions, Multi-turn chat

For more information and examples, see the [ingestion examples](/typescript/examples/ingestion).

## Model Context Protocol

The Stripe Agent Toolkit also supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.com/). See `/examples/modelcontextprotocol` for an example. The same configuration options are available, and the server can be run with all supported transports.

```typescript
import {StripeAgentToolkit} from '@stripe/agent-toolkit/modelcontextprotocol';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    actions: {
      paymentLinks: {
        create: true,
      },
      products: {
        create: true,
      },
      prices: {
        create: true,
      },
    },
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stripe MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
```

[node-sdk]: https://github.com/stripe/stripe-node
[api-keys]: https://dashboard.stripe.com/account/apikeys
