import Stripe from 'stripe';
import {z} from 'zod/v3';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const updateSubscriptionPrompt = (_context: Context = {}): string => {
  return `This tool will update an existing subscription in Stripe. If changing an existing subscription item, the existing subscription item has to be set to deleted and the new one has to be added.
  
  It takes the following arguments:
  - subscription (str, required): The ID of the subscription to update.
  - proration_behavior (str, optional): Determines how to handle prorations when the subscription items change. Options: 'create_prorations', 'none', 'always_invoice', 'none_implicit'.
  - items (array, optional): A list of subscription items to update, add, or remove. Each item can have the following properties:
    - id (str, optional): The ID of the subscription item to modify.
    - price (str, optional): The ID of the price to switch to.
    - quantity (int, optional): The quantity of the plan to subscribe to.
    - deleted (bool, optional): Whether to delete this item.
  `;
};

export const updateSubscription = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof updateSubscriptionParameters>>
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

export const updateSubscriptionParameters = (
  _context: Context = {}
): z.AnyZodObject => {
  return z.object({
    subscription: z.string().describe('The ID of the subscription to update.'),
    proration_behavior: z
      .enum(['create_prorations', 'none', 'always_invoice', 'none_implicit'])
      .optional()
      .describe(
        'Determines how to handle prorations when the subscription items change.'
      ),
    items: z
      .array(
        z.object({
          id: z
            .string()
            .optional()
            .describe('The ID of the subscription item to modify.'),
          price: z
            .string()
            .optional()
            .describe('The ID of the price to switch to.'),
          quantity: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('The quantity of the plan to subscribe to.'),
          deleted: z
            .boolean()
            .optional()
            .describe('Whether to delete this item.'),
        })
      )
      .optional()
      .describe('A list of subscription items to update, add, or remove.'),
  });
};

export const updateSubscriptionAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
  readOnlyHint: false,
  title: 'Update subscription',
});

const tool = (context: Context): StripeToolDefinition => ({
  method: 'update_subscription',
  name: 'Update Subscription',
  description: updateSubscriptionPrompt(context),
  inputSchema: updateSubscriptionParameters(context),
  annotations: updateSubscriptionAnnotations(),
  actions: {
    subscriptions: {
      update: true,
    },
  },
  execute: updateSubscription,
});

export default tool;
