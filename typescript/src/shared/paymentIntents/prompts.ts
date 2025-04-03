import type {Context} from '@/shared/configuration';

export const listPaymentIntentsPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str, optional): The ID of the customer to list payment intents for.\n`;

  return `
This tool will list payment intents in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- limit (int, optional): The number of payment intents to return.
`;
};
