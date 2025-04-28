import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const finalizeInvoiceParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    invoice: z.string().describe('The ID of the invoice to finalize.'),
  });

export const finalizeInvoicePrompt = (_context: Context = {}) => `
This tool will finalize an invoice in Stripe.

It takes one argument:
- invoice (str): The ID of the invoice to finalize.
`;

export const finalizeInvoice = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof finalizeInvoiceParameters>>
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

const tool = (context: Context): Tool => ({
  method: 'finalize_invoice',
  name: 'Finalize Invoice',
  description: finalizeInvoicePrompt(context),
  parameters: finalizeInvoiceParameters(context),
  actions: {
    invoices: {
      update: true,
    },
  },
  execute: finalizeInvoice,
});

export default tool;
