import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will update a subscription in Stripe.

It takes two or more arguments:
- subscription (str): The ID of the subscription to update.
- metadata (dict, optional): Set of key-value pairs that you can attach to an object.
- items (list, optional): A list of items the customer is subscribing to.
- cancel_at_period_end (bool, optional): If true, the subscription will be canceled at the end of the current period.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    subscription: z.string().describe('The ID of the subscription to update.'),
    metadata: z
      .record(z.string())
      .optional()
      .describe('Set of key-value pairs that you can attach to an object.'),
    items: z
      .array(
        z.object({
          id: z.string().optional(),
          price: z.string().optional(),
          quantity: z.number().int().optional(),
        })
      )
      .optional()
      .describe('A list of items the customer is subscribing to.'),
    cancel_at_period_end: z
      .boolean()
      .optional()
      .describe(
        'Boolean indicating whether this subscription should cancel at the end of the current period.'
      ),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const {subscription: subscriptionId, ...updateParams} = params;

    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      updateParams,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return subscription;
  } catch (error) {
    return 'Failed to update subscription';
  }
};

// Export Tool as default
const updateSubscriptionTool = (context: Context): Tool => ({
  method: 'update_subscription',
  name: 'Update Subscription',
  description: description(context),
  parameters: parameters(context),
  actions: {
    subscriptions: {
      update: true,
    },
  },
});

export default updateSubscriptionTool;
