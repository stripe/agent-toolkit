import type {Context} from '@/shared/configuration';

export const createCouponPrompt = (_context: Context = {}) => `
This tool will create a coupon in Stripe.


It takes several arguments:
- name (str): The name of the coupon.

Only use one of percent_off or amount_off, not both:
- percent_off (number, optional): The percentage discount to apply (between 0 and 100).
- amount_off (number, optional): The amount to subtract from an invoice (in cents).

Optional arugments for duration. Use if specific duration is desired, otherwise default to 'once'.
- duration (str, optional): How long the discount will last ('once', 'repeating', or 'forever'). Defaults to 'once'.
- duration_in_months (number, optional): The number of months the discount will last if duration is repeating.
`;

export const listCouponsPrompt = (_context: Context = {}) => `
This tool will fetch a list of Coupons from Stripe.

It takes one optional argument:
- limit (int, optional): The number of coupons to return.
`;
