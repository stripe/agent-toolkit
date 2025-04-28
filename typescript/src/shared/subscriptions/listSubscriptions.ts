import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const listSubscriptions = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listSubscriptionsParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const subscriptions = await stripe.subscriptions.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return subscriptions.data;
  } catch (error) {
    return 'Failed to list subscriptions';
  }
};

export const listSubscriptionsParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list subscriptions for.'),
    price: z
      .string()
      .optional()
      .describe('The ID of the price to list subscriptions for.'),
    status: z
      .enum([
        'active',
        'past_due',
        'unpaid',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'all',
      ])
      .optional()
      .describe('The status of the subscriptions to retrieve.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const listSubscriptionsPrompt = (context: Context = {}): string => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str, optional): The ID of the customer to list subscriptions for.\n`;

  return `
This tool will list all subscriptions in Stripe.

It takes ${context.customer ? 'three' : 'four'} arguments:
${customerArg}
- price (str, optional): The ID of the price to list subscriptions for.
- status (str, optional): The status of the subscriptions to list.
- limit (int, optional): The number of subscriptions to return.
`;
};

const tool = (context: Context): Tool => ({
  method: 'list_subscriptions',
  name: 'List Subscriptions',
  description: listSubscriptionsPrompt(context),
  parameters: listSubscriptionsParameters(context),
  actions: {
    subscriptions: {
      read: true,
    },
  },
  execute: listSubscriptions,
});

export default tool;
