import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const updatePaymentMethodConfigPrompt = (_context: Context = {}) => `
This tool will update a payment method configuration in Stripe.

It takes the following arguments:
- configuration (str): The ID of the payment method configuration to update.
- payment_method (str): The payment method type to modify (e.g., 'link').
- preference (str): Either 'on' or 'off'.
`;

export const updatePaymentMethodConfigParameters = (_context: Context = {}) =>
  z.object({
    configuration: z.string().describe('The ID of the configuration to update.'),
    payment_method: z.string().describe('The payment method type to modify.'),
    preference: z.enum(['on', 'off']).describe("Display preference ('on' or 'off')."),
  });

export const updatePaymentMethodConfig = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof updatePaymentMethodConfigParameters>>
) => {
  try {
    const updateParams: any = {
      [params.payment_method]: {
        display_preference: {preference: params.preference},

      },
    };

    const config = await stripe.paymentMethodConfigurations.update(
      params.configuration,
      updateParams,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: config.id};
  } catch (error) {
    return 'Failed to update payment method configuration';
  }
};

const tool = (context: Context): Tool => ({
  method: 'update_payment_method_config',
  name: 'Update Payment Method Config',
  description: updatePaymentMethodConfigPrompt(context),
  parameters: updatePaymentMethodConfigParameters(context),
  actions: {
    paymentMethodConfigurations: {
      update: true,
    },
  },
  execute: updatePaymentMethodConfig,
});

export default tool;
