import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will create a product in Stripe.

It takes two arguments:
- name (str): The name of the product.
- description (str, optional): The description of the product.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    name: z.string().describe('The name of the product.'),
    description: z
      .string()
      .optional()
      .describe('The description of the product.'),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const product = await stripe.products.create(
      {
        name: params.name,
        description: params.description,
      },
      context.account ? {stripeAccount: context.account} : undefined
    );

    return product;
  } catch (error) {
    return 'Failed to create product';
  }
};

// Export Tool as default
const createProductTool = (context: Context): Tool => ({
  method: 'create_product',
  name: 'Create Product',
  description: description(context),
  parameters: parameters(context),
  actions: {
    products: {
      create: true,
    },
  },
});

export default createProductTool;
