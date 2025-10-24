# Web Search Example

This example shows how to use the Stripe Agent Toolkit with OpenAI to create an agent that can search the web and charge for outcomes.

## Setup

1. Create a OpenAI Vector Store following the [OpenAI documentation](https://platform.openai.com/docs/api-reference/vector-stores-files) and add the files you want to search.

2. Copy `.env.template` to `.env` populate with the relevant values.

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_VECTOR_STORE_ID=your_openai_vector_store_id
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Usage

```bash
python main.py
```

You can see the invoices created in the Stripe Dashboard.
