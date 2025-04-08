import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '../tools';

// Description
export const description = (_context: Context = {}) => `
This tool will create a payment link in Stripe.

It takes two arguments:
- price (str): The ID of the price to create the payment link for.
- quantity (int): The quantity of the product to include in the payment link.
`;

// Parameters
export const parameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    price: z
      .string()
      .describe('The ID of the price to create the payment link for.'),
    quantity: z
      .number()
      .int()
      .describe('The quantity of the product to include.'),
  });

// Function
export const execute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof parameters>>
) => {
  try {
    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: [
          {
            price: params.price,
            quantity: params.quantity,
          },
        ],
      },
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: paymentLink.id, url: paymentLink.url};
  } catch (error) {
    return 'Failed to create payment link';
  }
};

// Export Tool as default
const createPaymentLinkTool = (context: Context): Tool => ({
  method: 'create_payment_link',
  name: 'Create Payment Link',
  description: description(context),
  parameters: parameters(context),
  actions: {
    paymentLinks: {
      create: true,
    },
  },
});

export default createPaymentLinkTool;
