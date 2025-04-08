import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will create a price in Stripe. If a product has not already been specified, a product should be created first.

It takes three arguments:
- product (str): The ID of the product to create the price for.
- unit_amount (int): The unit amount of the price in cents.
- currency (str): The currency of the price.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
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

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const price = await stripe.prices.create(
      {
        product: params.product,
        unit_amount: params.unit_amount,
        currency: params.currency,
      },
      context.account ? {stripeAccount: context.account} : undefined
    );

    return price;
  } catch (error) {
    return 'Failed to create price';
  }
};

// Export Tool as default
const createPriceTool = (context: Context): Tool => ({
  method: 'create_price',
  name: 'Create Price',
  description: description(context),
  parameters: parameters(context),
  actions: {
    prices: {
      create: true,
    },
  },
});

export default createPriceTool;
