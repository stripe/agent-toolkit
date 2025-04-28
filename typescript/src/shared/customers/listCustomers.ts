import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const listCustomersPrompt = (_context: Context = {}) => `
This tool will fetch a list of Customers from Stripe.

It takes two arguments:
- limit (int, optional): The number of customers to return.
- email (str, optional): A case-sensitive filter on the list based on the customer's email field.
`;

export const listCustomersParameters = (_context: Context = {}) =>
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

export const listCustomers = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listCustomersParameters>>
) => {
  try {
    const customers = await stripe.customers.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return customers.data.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    }));
  } catch (error) {
    return 'Failed to list customers';
  }
};

const tool = (context: Context): Tool => ({
  method: 'list_customers',
  name: 'List Customers',
  description: listCustomersPrompt(context),
  parameters: listCustomersParameters(context),
  actions: {
    customers: {
      read: true,
    },
  },
  execute: listCustomers,
});

export default tool;
