import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will cancel a subscription in Stripe.

It takes two arguments:
- subscription (str): The ID of the subscription to cancel.
- invoice_now (bool, optional): If true, the invoice will be finalized immediately. If false, the subscription will be canceled at the end of the current period.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    subscription: z.string().describe('The ID of the subscription to cancel.'),
    invoice_now: z
      .boolean()
      .optional()
      .describe(
        'If true, the invoice will be finalized immediately. If false, the subscription will be canceled at the end of the current period.'
      ),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const {subscription: subscriptionId, ...cancelParams} = params;

    const subscription = await stripe.subscriptions.cancel(
      subscriptionId,
      cancelParams,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return subscription;
  } catch (error) {
    return 'Failed to cancel subscription';
  }
};

// Export Tool as default
const cancelSubscriptionTool = (context: Context): Tool => ({
  method: 'cancel_subscription',
  name: 'Cancel Subscription',
  description: description(context),
  parameters: parameters(context),
  actions: {
    subscriptions: {
      update: true,
    },
  },
});

export default cancelSubscriptionTool;
