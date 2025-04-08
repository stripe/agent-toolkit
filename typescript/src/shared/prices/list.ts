import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will fetch a list of Prices from Stripe.

It takes two arguments.
- product (str, optional): The ID of the product to list prices for.
- limit (int, optional): The number of prices to return.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    product: z
      .string()
      .optional()
      .describe('The ID of the product to list prices for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const prices = await stripe.prices.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return prices.data;
  } catch (error) {
    return 'Failed to list prices';
  }
};

// Export Tool as default
const listPricesTool = (context: Context): Tool => ({
  method: 'list_prices',
  name: 'List Prices',
  description: description(context),
  parameters: parameters(context),
  actions: {
    prices: {
      read: true,
    },
  },
});

export default listPricesTool;
