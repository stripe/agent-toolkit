# Web Search Example

This example shows how to use the Stripe Agent Toolkit with OpenAI to create an agent that can search the web and charge for outcomes.

## Setup

1. Create a Stripe Billing Meter and Stripe Customer following the [Stripe documentation](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide).

2. Copy `.env.template` to `.env` populate with the relevant values.

```bash
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_CUSTOMER_ID=your_stripe_customer_id
STRIPE_METER=your_stripe_meter
```

## Usage

```bash
python main.py
```

You can see the usage in the Stripe Dashboard.
