import type {Context} from '@/shared/configuration';

export const createInvoiceItemPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str): The ID of the customer to create the invoice item for.\n`;

  return `
This tool will create an invoice item in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- price (str): The ID of the price to create the invoice item for.
- invoice (str): The ID of the invoice to create the invoice item for.
`;
};
