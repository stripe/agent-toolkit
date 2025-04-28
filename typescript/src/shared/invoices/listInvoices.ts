import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const listInvoices = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listInvoicesParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const invoices = await stripe.invoices.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return invoices.data;
  } catch (error) {
    return 'Failed to list invoices';
  }
};

export const listInvoicesParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list invoices for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const listInvoicesPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str, optional): The ID of the customer to list invoices for.\n`;

  return `
This tool will fetch a list of Invoices from Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- limit (int, optional): The number of invoices to return.
`;
};

export const finalizeInvoicePrompt = (_context: Context = {}) => `
This tool will finalize an invoice in Stripe.

It takes one argument:
- invoice (str): The ID of the invoice to finalize.
`;

const tool = (context: Context): Tool => ({
  method: 'list_invoices',
  name: 'List Invoices',
  description: listInvoicesPrompt(context),
  parameters: listInvoicesParameters(context),
  actions: {
    invoices: {
      read: true,
    },
  },
  execute: listInvoices,
});

export default tool;
