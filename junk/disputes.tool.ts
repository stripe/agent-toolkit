// Generated Zod Schema
import { z } from "zod";
import { Context } from "../src/types";

export const listDisputesParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    charge: z
      .string()
      .optional()
      .describe(
        "Only return disputes associated to the charge specified by this charge ID."
      ),
    limit: z
      .number()
      .optional()
      .describe(
        "A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10."
      ),
    payment_intent: z
      .string()
      .optional()
      .describe(
        "Only return disputes associated to the PaymentIntent specified by this PaymentIntent ID."
      ),
  });

// Generated Prompt
export const getDisputesPrompt = (_context: Context = {}) => `
This tool will fetch a list of disputes in Stripe.

It takes the following arguments:
- charge (string, optional): Only return disputes associated to the charge specified by this charge ID.
- limit (int, optional): A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
- payment_intent (string, optional): Only return disputes associated to the PaymentIntent specified by this PaymentIntent ID.
`;

// Example Usage
// List Example:
/*
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('{{TEST_SECRET_KEY}}');

const disputes = await stripe.disputes.list();
*/
