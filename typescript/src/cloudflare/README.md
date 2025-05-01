# Usage

Import the `PaidMcpAgent`

```ts
import {
  PaymentState,
  experimental_PaidMcpAgent as PaidMcpAgent,
} from '@stripe/agent-toolkit/cloudflare';
```

Here is a regular tool:

```ts
this.server.tool('add', {a: z.number(), b: z.number()}, ({a, b}) => {
  return {
    content: [{type: 'text', text: `Result: ${a + b}`}],
  };
});
```

To make this paid using a subscription, create a product and price in the Stripe Dashboard.

Then, replace `this.server.tool` with `this.paidTool` and add a `priceId` and `paymentReason`

```ts
this.paidTool(
  'big_add',
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
    priceId: 'price_1RJJwjR1bGyW9S0UCIDTSU3V',
    paymentReason:
      'You must pay a subscription to add two big numbers together.',
  }
);
```

And make sure you extend `PaidMcpAgent` instead of `McpAgent`
