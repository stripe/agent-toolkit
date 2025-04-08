import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (context: Context = {}) => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str): The ID of the customer to create the invoice for.\n`;

  return `
This tool will create an invoice in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- days_until_due (int, optional): The number of days until the invoice is due.
`;
};

// Parameters
export const parameters = (context: Context = {}): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .describe('The ID of the customer to create the invoice for.'),
    days_until_due: z
      .number()
      .int()
      .optional()
      .describe('The number of days until the invoice is due.'),
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

    const invoice = await stripe.invoices.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: invoice.id,
      url: invoice.hosted_invoice_url,
      customer: invoice.customer,
      status: invoice.status,
    };
  } catch (error) {
    return 'Failed to create invoice';
  }
};

// Export Tool as default
const createInvoiceTool = (context: Context): Tool => ({
  method: 'create_invoice',
  name: 'Create Invoice',
  description: description(context),
  parameters: parameters(context),
  actions: {
    invoices: {
      create: true,
    },
  },
});

export default createInvoiceTool;
