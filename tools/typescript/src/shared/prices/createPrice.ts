import Stripe from 'stripe';
import {z} from 'zod/v3';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const createPricePrompt = (_context: Context = {}) => `
This tool will create a price in Stripe. If a product has not already been specified, a product should be created first.

It takes three arguments:
- product (str): The ID of the product to create the price for.
- unit_amount (int): The unit amount of the price in cents.
- currency (str): The currency of the price.
`;

export const createPrice = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createPriceParameters>>
) => {
  try {
    const price = await stripe.prices.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return price;
  } catch (error) {
    return 'Failed to create price';
  }
};

export const createPriceParameters = (_context: Context = {}) =>
  z.object({
    product: z
      .string()
      .describe('The ID of the product to create the price for.'),
    unit_amount: z
      .number()
      .int()
      .describe('The unit amount of the price in cents.'),
    currency: z.string().describe('The currency of the price.'),
  });

export const createPriceAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
  readOnlyHint: false,
  title: 'Create price',
});

const tool = (context: Context): StripeToolDefinition => ({
  method: 'create_price',
  name: 'Create Price',
  description: createPricePrompt(context),
  inputSchema: createPriceParameters(context),
  annotations: createPriceAnnotations(),
  actions: {
    prices: {
      create: true,
    },
  },
  execute: createPrice,
});

export default tool;
