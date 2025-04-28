import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const retrieveBalancePrompt = (_context: Context = {}) => `
This tool will retrieve the balance from Stripe. It takes no input.
`;

export const retrieveBalanceParameters = (
  _context: Context = {}
): z.AnyZodObject => z.object({});

export const retrieveBalance = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof retrieveBalanceParameters>>
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

const tool = (context: Context): Tool => ({
  method: 'retrieve_balance',
  name: 'Retrieve Balance',
  description: retrieveBalancePrompt(context),
  parameters: retrieveBalanceParameters(context),
  actions: {
    balance: {
      read: true,
    },
  },
  execute: retrieveBalance,
});

export default tool;
