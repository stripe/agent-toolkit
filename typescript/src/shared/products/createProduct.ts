import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';
export const createProductPrompt = (_context: Context = {}) => `
This tool will create a product in Stripe.

It takes two arguments:
- name (str): The name of the product.
- description (str, optional): The description of the product.
`;

export const createProduct = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createProductParameters>>
) => {
  try {
    const product = await stripe.products.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return product;
  } catch (error) {
    return 'Failed to create product';
  }
};

export const createProductParameters = (_context: Context = {}) =>
  z.object({
    name: z.string().describe('The name of the product.'),
    description: z
      .string()
      .optional()
      .describe('The description of the product.'),
  });

const tool = (context: Context): Tool => ({
  method: 'create_product',
  name: 'Create Product',
  description: createProductPrompt(context),
  parameters: createProductParameters(context),
  actions: {
    products: {
      create: true,
    },
  },
  execute: createProduct,
});

export default tool;
