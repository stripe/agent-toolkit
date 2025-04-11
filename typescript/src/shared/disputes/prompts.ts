import type {Context} from '@/shared/configuration';

export const updateDisputePrompt = (_context: Context = {}) => `
This tool will update a dispute in Stripe.

When you receive a dispute, contacting your customer is always the best first step. If that doesn't work, you can submit evidence to help resolve the dispute in your favor.

It takes the following arguments:
- dispute (string): The ID of the dispute to update
- evidence (object, optional): Evidence to upload for the dispute. Updating any field will submit all fields for review.
    - cancellation_policy_disclosure (string, optional): An explanation of how and when the customer was shown your refund policy prior to purchase.
    - cancellation_rebuttal (string, optional): A justification for why the customer’s subscription was not canceled.
    - duplicate_charge_explanation (string, optional): An explanation of the difference between the disputed charge versus the prior charge that appears to be a duplicate.
    - uncategorized_text (string, optional): Any additional evidence or statements.
- submit (boolean, optional): Whether to immediately submit evidence to the bank. If false, evidence is staged on the dispute.
`;

export const listDisputesPrompt = (_context: Context = {}) => `
This tool will fetch a list of disputes in Stripe.

It takes the following arguments:
- charge (string, optional): Only return disputes associated to the charge specified by this charge ID.
- payment_intent (string, optional): Only return disputes associated to the PaymentIntent specified by this PaymentIntent ID.
- limit (int, optional): A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
`;
