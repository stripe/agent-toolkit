import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import {createCouponParameters, listCouponsParameters} from './parameters';

export const createCoupon = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createCouponParameters>>
) => {
  try {
    const coupon = await stripe.coupons.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: coupon.id};
  } catch (error: any) {
    return `Failed to create coupon: ${error.message}`;
  }
};

export const listCoupons = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listCouponsParameters>>
) => {
  try {
    const coupons = await stripe.coupons.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return coupons.data.map((coupon) => ({
      id: coupon.id,
      name: coupon.name,
      percent_off: coupon.percent_off,
      amount_off: coupon.amount_off,
      duration: coupon.duration,
    }));
  } catch (error) {
    return 'Failed to list coupons';
  }
};
