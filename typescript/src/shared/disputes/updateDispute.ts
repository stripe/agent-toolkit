import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';

export const updateDisputePrompt = (_context: Context = {}) => `
When you receive a dispute, contacting your customer is always the best first step. If that doesn't work, you can submit evidence to help resolve the dispute in your favor. This tool helps.

It takes the following arguments:
- dispute (string): The ID of the dispute to update
- evidence (object, optional): Evidence to upload for the dispute.
    - cancellation_policy_disclosure (string)
    - cancellation_rebuttal (string)
    - duplicate_charge_explanation (string)
    - uncategorized_text (string, optional): Any additional evidence or statements.
- submit (boolean, optional): Whether to immediately submit evidence to the bank. If false, evidence is staged on the dispute.
`;

export const updateDisputeParameters = (_context: Context = {}) =>
  z.object({
    dispute: z.string().describe('The ID of the dispute to update'),
    evidence: z
      .object({
        cancellation_policy_disclosure: z
          .string()
          .max(20000)
          .optional()
          .describe(
            'An explanation of how and when the customer was shown your refund policy prior to purchase.'
          ),
        duplicate_charge_explanation: z
          .string()
          .max(20000)
          .optional()
          .describe(
            'An explanation of the difference between the disputed charge versus the prior charge that appears to be a duplicate.'
          ),
        uncategorized_text: z
          .string()
          .max(20000)
          .optional()
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

export const updateDisputeAnnotations = () => ({
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
  readOnlyHint: false,
  title: 'Update dispute',
});

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

const tool = (context: Context): Tool => ({
  method: 'update_dispute',
  name: 'Update Dispute',
  description: updateDisputePrompt(context),
  parameters: updateDisputeParameters(context),
  annotations: updateDisputeAnnotations(),
  actions: {
    disputes: {
      update: true,
    },
  },
  execute: updateDispute,
});

export default tool;
