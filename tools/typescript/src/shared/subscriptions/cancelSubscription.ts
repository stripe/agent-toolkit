import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const cancelSubscription = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof cancelSubscriptionParameters>>
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

export const cancelSubscriptionParameters = (
  _context: Context = {}
): z.AnyZodObject => {
  return z.object({
    subscription: z.string().describe('The ID of the subscription to cancel.'),
  });
};
export const cancelSubscriptionPrompt = (_context: Context = {}): string => {
  return `
This tool will cancel a subscription in Stripe.

It takes the following arguments:
- subscription (str, required): The ID of the subscription to cancel.
`;
};

export const cancelSubscriptionAnnotations = () => ({
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: false,
  title: 'Cancel subscription',
});

const tool = (context: Context): Tool => ({
  method: 'cancel_subscription',
  name: 'Cancel Subscription',
  description: cancelSubscriptionPrompt(context),
  parameters: cancelSubscriptionParameters(context),
  annotations: cancelSubscriptionAnnotations(),
  actions: {
    subscriptions: {
      update: true,
    },
  },
  execute: cancelSubscription,
});

export default tool;
