# PaidMcpAgent

An example of how to monetize an MCP server with Stripe.

## Setup

1. Copy `.dev.vars.example` to `.dev.vars` and add your Stripe API key.
2. Configure the required Stripe environment variables:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_ONETIME_SUBSCRIPTION_PRICE_ID`: Price ID for one-time payment
   - `STRIPE_USAGE_BASED_SUBSCRIPTION_PRICE_ID`: Price ID for usage-based subscription
   - `STRIPE_METER_EVENT_NAME`: Event name for usage metering
3. This demo uses an example fake OAuth implementation for the MCP server. We recommend following the [authorization](https://developers.cloudflare.com/agents/model-context-protocol/authorization/) Cloudflare docs.

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
npx wrangler secret put STRIPE_ONE_TIME_PAYMENT_PRICE_ID
npx wrangler secret put STRIPE_ONETIME_SUBSCRIPTION_PRICE_ID
npx wrangler secret put STRIPE_USAGE_BASED_SUBSCRIPTION_PRICE_ID
```

### Feedback

Please leave feedback throught the GitHub issues and discussions on how you
would use the `PaidMcpAgent`!
