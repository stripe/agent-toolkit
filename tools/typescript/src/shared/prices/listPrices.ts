import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const listPrices = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listPricesParameters>>
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

export const listPricesParameters = (_context: Context = {}): z.AnyZodObject =>
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

export const listPricesAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
  title: 'List prices',
});

export const listPricesPrompt = (_context: Context = {}) => `
This tool will fetch a list of Prices from Stripe.

It takes two arguments.
- product (str, optional): The ID of the product to list prices for.
- limit (int, optional): The number of prices to return.
`;

const tool = (context: Context): StripeToolDefinition => ({
  method: 'list_prices',
  name: 'List Prices',
  description: listPricesPrompt(context),
  inputSchema: listPricesParameters(context),
  annotations: listPricesAnnotations(),
  actions: {
    prices: {
      read: true,
    },
  },
  execute: listPrices,
});

export default tool;
