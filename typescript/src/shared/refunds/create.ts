import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will refund a payment intent in Stripe.

It takes three arguments:
- payment_intent (str): The ID of the payment intent to refund.
- amount (int, optional): The amount to refund in cents.
- reason (str, optional): The reason for the refund.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
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

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
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

// Export Tool as default
const createRefundTool = (context: Context): Tool => ({
  method: 'create_refund',
  name: 'Create Refund',
  description: description(context),
  parameters: parameters(context),
  actions: {
    refunds: {
      create: true,
    },
  },
});

export default createRefundTool;
