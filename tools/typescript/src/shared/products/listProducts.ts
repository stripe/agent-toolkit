import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const listProductsPrompt = (_context: Context = {}) => `
This tool will fetch a list of Products from Stripe.

It takes one optional argument:
- limit (int, optional): The number of products to return.
`;

export const listProducts = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listProductsParameters>>
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

export const listProductsParameters = (
  _context: Context = {}
): z.AnyZodObject =>
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

export const listProductsAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
  title: 'List products',
});

const tool = (context: Context): StripeToolDefinition => ({
  method: 'list_products',
  name: 'List Products',
  description: listProductsPrompt(context),
  inputSchema: listProductsParameters(context),
  annotations: listProductsAnnotations(),
  actions: {
    products: {
      read: true,
    },
  },
  execute: listProducts,
});

export default tool;
