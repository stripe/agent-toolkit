# MCP Payments

A simple MCP server helper to require payment to use tools, whether subscription or usage-based.

This implementation works on Vercel with a standard MCP server.

## Usage Instructions for `registerPaidTool`

1. Import the `registerPaidTool` function from this package.
2. Call `registerPaidTool` with your MCP server, tool name, description, params schema, callback, and payment options.
3. Example usage:

```ts
import {registerPaidTool} from './register-paid-tool';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer({
  name: 'mcp-typescript server',
  version: '0.1.0',
});

registerPaidTool(
  server,
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
    successUrl: '{{CALLBACK_URL}}',
    email: '{{EMAIL}}',
    paymentReason:
      'You must pay a subscription to add two big numbers together.',
    stripeSecretKey: '{{SECRET_KEY}}',
  }
);
```
