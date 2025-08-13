import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const listCouponsPrompt = (_context: Context = {}) => `
This tool will fetch a list of Coupons from Stripe.

It takes one optional argument:
- limit (int, optional): The number of coupons to return.
`;

export const listCouponsParameters = (_context: Context = {}) =>
  z.object({
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

export const listCouponsAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
  title: 'List coupons',
});

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

const tool = (context: Context): Tool => ({
  method: 'list_coupons',
  name: 'List Coupons',
  description: listCouponsPrompt(context),
  parameters: listCouponsParameters(context),
  annotations: listCouponsAnnotations(),
  actions: {
    coupons: {
      read: true,
    },
  },
  execute: listCoupons,
});

export default tool;
