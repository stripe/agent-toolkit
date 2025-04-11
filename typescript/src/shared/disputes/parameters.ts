import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import Stripe from 'stripe';

export const updateDisputeParameters = (_context: Context = {}) =>
  z.object({
    dispute: z.string().describe('The ID of the dispute to update'),
    evidence: z
      .object({
        cancellation_policy_disclosure: z
          .string()
          .max(20000)
          .describe(
            'An explanation of how and when the customer was shown your refund policy prior to purchase.'
          ),
        cancellation_rebuttal: z
          .string()
          .max(20000)
          .describe(
            'A justification for why the customer’s subscription was not canceled. (ID of a file upload)'
          ),
        duplicate_charge_explanation: z
          .string()
          .max(20000)
          .describe(
            'An explanation of the difference between the disputed charge versus the prior charge that appears to be a duplicate.'
          ),
        uncategorized_text: z
          .string()
          .max(20000)
          .describe('Any additional evidence or statements.'),
      })
      .optional()
      .describe(
        'Evidence to upload, to respond to a dispute. Updating any field in the hash will submit all fields in the hash for review.'
      ),
    submit: z
      .boolean()
      .optional()
      .describe(
        'Whether to immediately submit evidence to the bank. If false, evidence is staged on the dispute.'
      ),
  });

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
      .min(1)
      .max(100)
      .default(10)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });
