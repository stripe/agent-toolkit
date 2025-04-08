import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will retrieve the balance from Stripe. It takes no input.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({});

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const balance = await stripe.balance.retrieve(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return balance;
  } catch (error) {
    return 'Failed to retrieve balance';
  }
};

// Export Tool as default
const retrieveBalanceTool = (context: Context): Tool => ({
  method: 'retrieve_balance',
  name: 'Retrieve Balance',
  description: description(context),
  parameters: parameters(context),
  actions: {
    balance: {
      read: true,
    },
  },
});

export default retrieveBalanceTool;
