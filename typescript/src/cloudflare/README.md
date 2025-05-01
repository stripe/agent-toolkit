# PaidMcpAgent

`PaidMcpAgent` extends [Cloudflare's `McpAgent`](https://github.com/cloudflare/agents) to make it simple to require payment to use tools. For a full end-to-end example, see [/examples/cloudflare](../../examples/cloudflare/).

## Usage

### Setup

Modify your existing MCP server by extending with `PaidMcpAgent` instead of `McpAgent`.

```ts
import {
  PaymentState,
  experimental_PaidMcpAgent as PaidMcpAgent,
} from '@stripe/agent-toolkit/cloudflare';

type Props = {
  userEmail: string;
};

type State = PaymentState & {};

export class MyMCP extends PaidMcpAgent<Bindings, State, Props> {}
```

Lastly, set your `STRIPE_SECRET_KEY` in `.dev.vars` to test, and then `npx wrangler secret put STRIPE_SECRET_KEY` when ready for production.

### Monetizing a tool

Consider a basic tool that can add two numbers together:

```ts
this.server.tool('add', {a: z.number(), b: z.number()}, ({a, b}) => {
  return {
    content: [{type: 'text', text: `Result: ${a + b}`}],
  };
});
```

To make this paid using a subscription, first create a product and price in the Stripe Dashboard.

Then, replace `this.server.tool` with `this.paidTool` and add your payment config: `priceId`, `paymentReason`, and `successUrl`.

```ts
this.paidTool(
  'add_numbers',
  {
    a: z.number(),
    b: z.number(),
  },
  ({a, b}) => {
    return {
      content: [{type: 'text', text: `Result: ${a + b}`}],
    };
  },
  {
    priceId: '{{PRICE_ID}}',
    successUrl: 'https://mcp.mysite.com/success',
    paymentReason:
      'You must pay a subscription to add two big numbers together.',
  }
);
```

## Authentication

`PaidMcp` relies on `props.userEmail` to identify (or create) a Stripe customer. You can prepopulate this directly, or integrate with `OAuthProvider` from `@cloudflare/workers-oauth-provider` to set the prop on succesful authentication.
