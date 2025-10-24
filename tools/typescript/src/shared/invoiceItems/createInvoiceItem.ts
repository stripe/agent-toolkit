import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const createInvoiceItem = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createInvoiceItemParameters>>
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

export const createInvoiceItemAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
  readOnlyHint: false,
  title: 'Create invoice item',
});

export const createInvoiceItemParameters = (
  context: Context = {}
): z.AnyZodObject => {
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

export const createInvoiceItemPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str): The ID of the customer to create the invoice item for.\n`;

  return `
This tool will create an invoice item in Stripe.

It takes ${context.customer ? 'two' : 'three'} arguments'}:
${customerArg}
- price (str): The ID of the price to create the invoice item for.
- invoice (str): The ID of the invoice to create the invoice item for.
`;
};

const tool = (context: Context): Tool => ({
  method: 'create_invoice_item',
  name: 'Create Invoice Item',
  description: createInvoiceItemPrompt(context),
  parameters: createInvoiceItemParameters(context),
  annotations: createInvoiceItemAnnotations(),
  actions: {
    invoiceItems: {
      create: true,
    },
  },
  execute: createInvoiceItem,
});

export default tool;
