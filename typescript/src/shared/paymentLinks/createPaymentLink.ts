import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const createPaymentLinkPrompt = (_context: Context = {}) => `
This tool will create a payment link in Stripe.

It takes two arguments:
- price (str): The ID of the price to create the payment link for.
- quantity (int): The quantity of the product to include in the payment link.
`;

export const createPaymentLink = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createPaymentLinkParameters>>
) => {
  try {
    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: [params],
      },
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: paymentLink.id, url: paymentLink.url};
  } catch (error) {
    return 'Failed to create payment link';
  }
};

export const createPaymentLinkParameters = (_context: Context = {}) =>
  z.object({
    price: z
      .string()
      .describe('The ID of the price to create the payment link for.'),
    quantity: z
      .number()
      .int()
      .describe('The quantity of the product to include.'),
  });

const tool = (context: Context): Tool => ({
  method: 'create_payment_link',
  name: 'Create Payment Link',
  description: createPaymentLinkPrompt(context),
  parameters: createPaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      create: true,
    },
  },
  execute: createPaymentLink,
});

export default tool;
