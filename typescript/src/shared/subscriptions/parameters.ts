import {z} from 'zod';
import type {Context} from '@/shared/configuration';

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

export const cancelSubscriptionParameters = (
  _context: Context = {}
): z.AnyZodObject => {
  return z.object({
    subscription: z.string().describe('The ID of the subscription to cancel.'),
  });
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
