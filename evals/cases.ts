require("dotenv").config();

import {
  assert,
  EvalCaseFunction,
  EvalInput,
  expectToolCall,
  expectToolCallArgs,
  llmCriteriaMet,
} from "./scorer";
import { Configuration as StripeAgentToolkitConfig } from "../typescript/src/shared/configuration";
import Stripe from "stripe";

/*
 * A single test case that is used to evaluate the agent.
 * It contains an input, a toolkit config, and an function to use to run
 * assertions on the output of the agent. It is structured to be used with
 * Braintrust.
 */
type BraintrustTestCase = {
  input: EvalInput;
  toolkitConfig?: StripeAgentToolkitConfig;
  expected: EvalCaseFunction;
};

/* This is used in a Braintrust Eval. Our test framework appends new test cases to this array.*/
const _testCases: Array<BraintrustTestCase | Promise<BraintrustTestCase>> = [];

/*
 * Helper type for adding test cases to the Braintrust Eval.
 */
type TestCaseData = {
  // The user prompt to pass into the agent.
  prompt: string;
  // The function to use to run assertions on the output of the agent.
  fn: EvalCaseFunction;
  // Optional toolkit config to set into the agent to override the default set in eval.ts.
  toolkitConfig?: StripeAgentToolkitConfig;
};

const argsToTestCase = (args: TestCaseData): BraintrustTestCase => ({
  input: {
    toolkitConfigOverride: args.toolkitConfig || {},
    userPrompt: args.prompt,
  },
  expected: args.fn,
});

/*
 * Helper function for adding test cases to the Braintrust Eval.
 */
const test = (args: TestCaseData | (() => Promise<TestCaseData>)) => {
  if (typeof args == "function") {
    const promise = args().then(argsToTestCase);
    _testCases.push(promise);
  } else {
    _testCases.push(argsToTestCase(args));
  }
};

test({
  prompt:
    "Create a product called 'Test Product' with a description 'A test product for evaluation'",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["create_product"]),
    llmCriteriaMet(
      messages,
      "The message should include a successful production creation response"
    ),
  ],
});

test({
  prompt: "List all available products",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["list_products"]),
    llmCriteriaMet(messages, "The message should include a list of products"),
  ],
});

test({
  prompt:
    "Create a customer with a name of a Philadelphia Eagles player and email (you can make it up). Charge them $100.",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["create_customer"]),
  ],
});

test({
  prompt:
    "Create a payment link for a new product called 'test' with a price of $70. Come up with a haiku for the description.",
  fn: ({ toolCalls, messages }) => [
    llmCriteriaMet(messages, "The message should include a payment link"),
    expectToolCall(toolCalls, ["create_payment_link"]),
  ],
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

test(async () => {
  const customer = await stripe.customers.create({
    name: "Joel E",
    email: "joel@example.com",
  });

  const joelsPayment = await stripe.paymentIntents.create({
    amount: 2000,
    currency: "usd",
    customer: customer.id,
  });

  const otherPi = await stripe.paymentIntents.create({
    amount: 3000,
    currency: "usd",
  });

  return {
    prompt: "List payment intents",
    toolkitConfig: {
      context: {
        customer: customer.id,
      },
    },
    fn: ({ assistantMessages }) => [
      assert(
        (function () {
          return (
            assistantMessages.some((m) => m.includes(joelsPayment.id)) &&
            assistantMessages.every((m) => !m.includes(otherPi.id))
          );
        })(),
        `messages only includes customers payment intent ${joelsPayment.id}`
      ),
    ],
  };
});

test({
  prompt: "List all subscriptions",
  fn: ({ toolCalls, messages }) => [
    llmCriteriaMet(
      messages,
      "The message should include a list of subscriptions"
    ),
    expectToolCall(toolCalls, ["list_subscriptions"]),
  ],
});

test({
  prompt: "Create a coupon called SUMMER25 that gives 25% off",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["create_coupon"]),
    llmCriteriaMet(
      messages,
      "The message should include a coupon creation response"
    ),
  ],
});

test({
  prompt: "Create a coupon called WINTERTEN that gives $10 off",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["create_coupon"]),
    expectToolCallArgs(toolCalls, [
      {
        name: "create_coupon",
        arguments: {
          amount_off: 1000,
          currency: "USD",
          name: "WINTERTEN",
        },
      },
    ]),
    llmCriteriaMet(
      messages,
      "The message should include a coupon creation response"
    ),
  ],
});

test({
  prompt: "List all coupons",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["list_coupons"]),
  ],
});

test(async () => {
  const customer = await stripe.customers.create({
    name: "Joel E",
    email: "joel@example.com",
    payment_method: "pm_card_visa",
  });

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      token: "tok_visa",
    },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customer.id,
  });

  // // Set as default payment method
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  const product = await stripe.products.create({
    name: "Subscription Product",
    description: "A test subscription product",
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1000,
    currency: "usd",
    recurring: { interval: "month" },
  });

  await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
  });

  return {
    prompt: `Cancel the users subscription`,
    toolkitConfig: {
      context: {
        customer: customer.id,
      },
    },
    fn: ({ toolCalls, messages }) => [
      expectToolCall(toolCalls, ["list_subscriptions", "cancel_subscription"]),
      llmCriteriaMet(
        messages,
        "The message should include a successful subscription cancellation response"
      ),
    ],
  };
});

// New test for update subscription
test(async () => {
  const customer = await stripe.customers.create({
    name: "User Example",
    email: "user@example.com",
  });

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      token: "tok_visa",
    },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customer.id,
  });

  // // Set as default payment method
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  const product = await stripe.products.create({
    name: "SaaS Product",
    description: "A test subscription product",
  });

  const basicPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1000,
    currency: "usd",
    recurring: { interval: "month" },
  });

  const premiumPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 2000,
    currency: "usd",
    recurring: { interval: "month" },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: basicPrice.id, quantity: 1 }],
  });

  return {
    prompt: `Upgrade the user's subscription to the premium plan`,
    toolkitConfig: {
      context: {
        customer: customer.id,
      },
    },
    fn: ({ toolCalls, messages }) => [
      expectToolCall(toolCalls, ["list_subscriptions", "update_subscription"]),
      llmCriteriaMet(
        messages,
        "The message should include a successful subscription update response. The subscription should have been updated to the premium plan and have only one item."
      ),
    ],
  };
});

export const getEvalTestCases = async () => Promise.all(_testCases);
