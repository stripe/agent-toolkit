import type {Context} from '@/shared/configuration';

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

export const cancelSubscriptionPrompt = (_context: Context = {}): string => {
  return `
This tool will cancel a subscription in Stripe.

It takes the following arguments:
- subscription (str, required): The ID of the subscription to cancel.
`;
};
