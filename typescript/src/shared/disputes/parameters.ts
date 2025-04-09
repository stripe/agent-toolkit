import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import Stripe from 'stripe';

export const updateDisputeParameters = (_context: Context = {}) =>
  z.object({
    dispute: z.string().describe('The ID of the dispute to update'),
    evidence: z
      .object({})
      .optional()
      .describe(
        'Evidence to upload, to respond to a dispute. Updating any field in the hash will submit all fields in the hash for review.'
      ),
    metadata: z
      .record(z.string())
      .optional()
      .describe(
        'Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.'
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
