# PaidMcpAgent

An example of how to monetize an MCP server with Stripe.

## Setup

1. Copy `.dev.vars.example` and add your Stripe API key.
2. This demo uses an example fake OAuth implementation for the MCP server. We recommend following the [authorization](https://developers.cloudflare.com/agents/model-context-protocol/authorization/) Cloudflare docs.

## Development

```
pnpm i
pnpm dev
```

## Testing

Open up the inspector and connect to your MCP server.

```
npx @modelcontextprotocol/inspector@latest http://localhost:4242/sse
```

### Deploy

```
npx wrangler secret put STRIPE_SECRET_KEY
```

### Feedback

Please leave feedback throught the GitHub issues and discussions on how you
would use the `PaidMcpAgent`!
