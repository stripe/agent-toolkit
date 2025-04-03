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
