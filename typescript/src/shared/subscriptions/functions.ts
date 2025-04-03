import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import {
  listSubscriptionsParameters,
  cancelSubscriptionParameters,
  updateSubscriptionParameters,
} from './parameters';

export const listSubscriptions = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listSubscriptionsParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const subscriptions = await stripe.subscriptions.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return subscriptions.data;
  } catch (error) {
    return 'Failed to list subscriptions';
  }
};

export const cancelSubscription = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof cancelSubscriptionParameters>>
) => {
  try {
    const {subscription: subscriptionId, ...cancelParams} = params;

    const subscription = await stripe.subscriptions.cancel(
      subscriptionId,
      cancelParams,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return subscription;
  } catch (error) {
    return 'Failed to cancel subscription';
  }
};

export const updateSubscription = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof updateSubscriptionParameters>>
) => {
  try {
    const {subscription: subscriptionId, ...updateParams} = params;

    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      updateParams,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return subscription;
  } catch (error) {
    return 'Failed to update subscription';
  }
};
