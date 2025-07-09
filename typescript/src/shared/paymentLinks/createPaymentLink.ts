import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const createPaymentLinkPrompt = (_context: Context = {}) => `
This tool will create a payment link in Stripe.

It takes two arguments:
- price (str): The ID of the price to create the payment link for.
- quantity (int): The quantity of the product to include in the payment link.
- redirect_url (str, optional): The URL to redirect to after the payment is completed.
`;

export const createPaymentLink = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createPaymentLinkParameters>>
) => {
  try {
    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: [{price: params.price, quantity: params.quantity}],
        ...(params.redirect_url
          ? {
              after_completion: {
                type: 'redirect',
                redirect: {
                  url: params.redirect_url,
                },
              },
            }
          : undefined),
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
    redirect_url: z
      .string()
      .optional()
      .describe('The URL to redirect to after the payment is completed.'),
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
