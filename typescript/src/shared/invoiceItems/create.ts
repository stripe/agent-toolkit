import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (context: Context = {}) => {
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

// Parameters
export const parameters = (context: Context = {}): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .describe('The ID of the customer to create the invoice item for.'),
    price: z.string().describe('The ID of the price for the item.'),
    invoice: z
      .string()
      .describe('The ID of the invoice to create the item for.'),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const invoiceItem = await stripe.invoiceItems.create(
      // @ts-ignore
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: invoiceItem.id,
      invoice: invoiceItem.invoice,
    };
  } catch (error) {
    return 'Failed to create invoice item';
  }
};

// Export Tool as default
const createInvoiceItemTool = (context: Context): Tool => ({
  method: 'create_invoice_item',
  name: 'Create Invoice Item',
  description: description(context),
  parameters: parameters(context),
  actions: {
    invoiceItems: {
      create: true,
    },
  },
});

export default createInvoiceItemTool;
