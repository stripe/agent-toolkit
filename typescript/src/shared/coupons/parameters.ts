import {z} from 'zod';
import type {Context} from '@/shared/configuration';

export const createCouponParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    name: z
      .string()
      .describe(
        'Name of the coupon displayed to customers on invoices or receipts'
      ),
    percent_off: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe(
        'A positive float larger than 0, and smaller or equal to 100, that represents the discount the coupon will apply (required if amount_off is not passed)'
      ),
    amount_off: z
      .number()
      .describe(
        'A positive integer representing the amount to subtract from an invoice total (required if percent_off is not passed)'
      ),
    currency: z
      .string()
      .optional()
      .default('USD')
      .describe(
        'Three-letter ISO code for the currency of the amount_off parameter (required if amount_off is passed). Infer based on the amount_off. For example, if a coupon is $2 off, set currency to be USD.'
      ),
    duration: z
      .enum(['once', 'repeating', 'forever'])
      .default('once')
      .optional()
      .describe('How long the discount will last. Defaults to "once"'),
    duration_in_months: z
      .number()
      .optional()
      .describe(
        'The number of months the discount will last if duration is repeating'
      ),
  });

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
