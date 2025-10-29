import Stripe from 'stripe';
import {z} from 'zod/v3';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const listDisputesPrompt = (_context: Context = {}) => `
This tool will fetch a list of disputes in Stripe.

It takes the following arguments:
- charge (string, optional): Only return disputes associated to the charge specified by this charge ID.
- payment_intent (string, optional): Only return disputes associated to the PaymentIntent specified by this PaymentIntent ID.
`;

export const listDisputesParameters = (_context: Context = {}) =>
  z.object({
    charge: z
      .string()
      .optional()
      .describe(
        'Only return disputes associated to the charge specified by this charge ID.'
      ),
    payment_intent: z
      .string()
      .optional()
      .describe(
        'Only return disputes associated to the PaymentIntent specified by this PaymentIntent ID.'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

export const listDisputesAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
  title: 'List disputes',
});

export const listDisputes = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listDisputesParameters>>
) => {
  try {
    const disputes = await stripe.disputes.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return disputes.data.map((dispute) => ({id: dispute.id}));
  } catch (error) {
    return 'Failed to list disputes';
  }
};

const tool = (context: Context): StripeToolDefinition => ({
  method: 'list_disputes',
  name: 'List Disputes',
  description: listDisputesPrompt(context),
  inputSchema: listDisputesParameters(context),
  annotations: listDisputesAnnotations(),
  actions: {
    disputes: {
      read: true,
    },
  },
  execute: listDisputes,
});

export default tool;
