import Stripe from 'stripe';
import {z} from 'zod/v3';
import type {Context} from '@/shared/configuration';
import type {StripeToolDefinition} from '@/shared/tools';

export const listPaymentIntentsPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? `The customer is already set in the context: ${context.customer}.`
    : `- customer (str, optional): The ID of the customer to list payment intents for.\n`;

  return `
This tool will list payment intents in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- limit (int, optional): The number of payment intents to return.
`;
};

export const listPaymentIntents = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listPaymentIntentsParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const paymentIntents = await stripe.paymentIntents.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return paymentIntents.data;
  } catch (error) {
    return 'Failed to list payment intents';
  }
};

export const listPaymentIntentsAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
  title: 'List payment intents',
});

export const listPaymentIntentsParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list payment intents for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

const tool = (context: Context): StripeToolDefinition => ({
  method: 'list_payment_intents',
  name: 'List Payment Intents',
  description: listPaymentIntentsPrompt(context),
  inputSchema: listPaymentIntentsParameters(context),
  annotations: listPaymentIntentsAnnotations(),
  actions: {
    paymentIntents: {
      read: true,
    },
  },
  execute: listPaymentIntents,
});

export default tool;
