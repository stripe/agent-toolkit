import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will fetch a list of Products from Stripe.

It takes one optional argument:
- limit (int, optional): The number of products to return.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
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
    const products = await stripe.products.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return products.data;
  } catch (error) {
    return 'Failed to list products';
  }
};

// Export Tool as default
const listProductsTool = (context: Context): Tool => ({
  method: 'list_products',
  name: 'List Products',
  description: description(context),
  parameters: parameters(context),
  actions: {
    products: {
      read: true,
    },
  },
});

export default listProductsTool;
