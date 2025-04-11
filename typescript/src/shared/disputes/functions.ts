import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import {updateDisputeParameters, listDisputesParameters} from './parameters';

export const updateDispute = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof updateDisputeParameters>>
) => {
  try {
    const updateParams: Stripe.DisputeUpdateParams = {
      evidence: {
        cancellation_policy_disclosure:
          params.evidence__cancellation_policy_disclosure,
        duplicate_charge_explanation:
          params.evidence__duplicate_charge_explanation,
        uncategorized_text: params.evidence__uncategorized_text,
      },
      submit: params.submit,
    };

    const updatedDispute = await stripe.disputes.update(
      params.dispute,
      updateParams,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: updatedDispute.id};
  } catch (error) {
    return 'Failed to update dispute';
  }
};

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
