import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will create a customer in Stripe.

It takes two arguments:
- name (str): The name of the customer.
- email (str, optional): The email of the customer.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    name: z.string().describe('The name of the customer'),
    email: z.string().email().optional().describe('The email of the customer'),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const customer = await stripe.customers.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: customer.id};
  } catch (error) {
    return 'Failed to create customer';
  }
};

// Export Tool as default
const createCustomerTool = (context: Context): Tool => ({
  method: 'create_customer',
  name: 'Create Customer',
  description: description(context),
  parameters: parameters(context),
  actions: {
    customers: {
      create: true,
    },
  },
});

export default createCustomerTool;
