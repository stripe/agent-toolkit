import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will fetch a list of Customers from Stripe.

It takes no input.
`;

// Parameters
export const parameters = (_context: Context = {}) =>
  z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
    email: z
      .string()
      .optional()
      .describe(
        "A case-sensitive filter on the list based on the customer's email field. The value must be a string."
      ),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const customers = await stripe.customers.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return customers.data.map((customer) => ({id: customer.id}));
  } catch (error) {
    return 'Failed to list customers';
  }
};

// Export Tool as default
const listCustomersTool = (context: Context): Tool => ({
  method: 'list_customers',
  name: 'List Customers',
  description: description(context),
  parameters: parameters(context),
  actions: {
    customers: {
      read: true,
    },
  },
});

export default listCustomersTool;
