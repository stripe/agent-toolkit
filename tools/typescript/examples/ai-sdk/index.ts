import {StripeAgentToolkit} from '@stripe/agent-toolkit/ai-sdk';
import {openai} from '@ai-sdk/openai';
import {
  generateText,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from 'ai';

require('dotenv').config();

const stripeAgentToolkit = new StripeAgentToolkit({
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

const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: stripeAgentToolkit.middleware({
    billing: {
      customer: process.env.STRIPE_CUSTOMER_ID!,
      meters: {
        input: process.env.STRIPE_METER_INPUT!,
        output: process.env.STRIPE_METER_OUTPUT!,
      },
    },
  }),
});

(async () => {
  const result = await generateText({
    model: model,
    tools: {
      ...stripeAgentToolkit.getTools(),
    },
    maxSteps: 5,
    prompt:
      'Create a payment link for a new product called "test" with a price of $100. Come up with a funny description about buy bots, maybe a haiku.',
  });

  console.log(result);
})();
