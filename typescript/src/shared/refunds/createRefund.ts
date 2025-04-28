import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const createRefundPrompt = (_context: Context = {}) => `
This tool will refund a payment intent in Stripe.

It takes three arguments:
- payment_intent (str): The ID of the payment intent to refund.
- amount (int, optional): The amount to refund in cents.
- reason (str, optional): The reason for the refund.
`;

export const createRefund = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createRefundParameters>>
) => {
  try {
    const refund = await stripe.refunds.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  } catch (error) {
    return 'Failed to create refund';
  }
};

export const createRefundParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    payment_intent: z
      .string()
      .describe('The ID of the PaymentIntent to refund.'),
    amount: z
      .number()
      .int()
      .optional()
      .describe('The amount to refund in cents.'),
  });

const tool = (context: Context): Tool => ({
  method: 'create_refund',
  name: 'Create Refund',
  description: createRefundPrompt(context),
  parameters: createRefundParameters(context),
  actions: {
    refunds: {
      create: true,
    },
  },
  execute: createRefund,
});

export default tool;
