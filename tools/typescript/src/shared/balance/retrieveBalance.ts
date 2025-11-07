import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const retrieveBalancePrompt = (_context: Context = {}) => `
This tool will retrieve the balance from Stripe. It takes no input.
`;

export const retrieveBalanceParameters = (
  _context: Context = {}
): z.AnyZodObject => z.object({});

export const retrieveBalanceAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
  title: 'Retrieve balance',
});

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

const tool = (context: Context): StripeToolDefinition => ({
  method: 'retrieve_balance',
  name: 'Retrieve Balance',
  description: retrieveBalancePrompt(context),
  inputSchema: retrieveBalanceParameters(context),
  annotations: retrieveBalanceAnnotations(),
  actions: {
    balance: {
      read: true,
    },
  },
  execute: retrieveBalance,
});

export default tool;
