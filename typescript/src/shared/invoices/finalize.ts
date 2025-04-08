import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will finalize an invoice in Stripe.

It takes one argument:
- invoice (str): The ID of the invoice to finalize.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    invoice: z.string().describe('The ID of the invoice to finalize.'),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const invoice = await stripe.invoices.finalizeInvoice(
      params.invoice,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: invoice.id,
      url: invoice.hosted_invoice_url,
      customer: invoice.customer,
      status: invoice.status,
    };
  } catch (error) {
    return 'Failed to finalize invoice';
  }
};

// Export Tool as default
const finalizeInvoiceTool = (context: Context): Tool => ({
  method: 'finalize_invoice',
  name: 'Finalize Invoice',
  description: description(context),
  parameters: parameters(context),
  actions: {
    invoices: {
      update: true,
    },
  },
});

export default finalizeInvoiceTool;
