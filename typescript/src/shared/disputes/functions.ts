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
      evidence: params.evidence,
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
