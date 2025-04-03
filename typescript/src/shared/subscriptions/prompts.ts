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

export const updateSubscriptionPrompt = (_context: Context = {}): string => {
  return `
This tool will update an existing subscription in Stripe. If changing an existing subscription item, the existing subscription item has to be set to deleted and the new one has to be added.

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
