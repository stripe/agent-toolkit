require("dotenv").config();

import {
  assert,
  EvalCaseFunction,
  EvalInput,
  expectToolCall,
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
    "Create a customer with a name of a Philadelphia Eagles player and email. Charge them $100.",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["create_customer"]),
  ],
});

test({
  prompt:
    "Create a payment link for a new product called 'test' with a price of $70. Come up with a haiku for the description.",
  fn: ({ toolCalls, messages }) => [
    llmCriteriaMet(
      messages,
      "The message should indicate a payment link was created"
    ),
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

test(async () => {
  const joels = await stripe.customers.list({
    email: "joel@example.com",
  });
  const id = joels.data[0].id;
  return {
    prompt: "how many payments has 'joel@example.com' made?",
    fn: ({ toolCalls, messages }) => [
      expectToolCall(toolCalls, ["search_stripe_resources"]),
      expectToolCall(toolCalls, ["list_payment_intents"]),
      assert(
        (function () {
          return (
            toolCalls.find(
              (t) =>
                t.function.name === "list_payment_intents" &&
                t.function.arguments.includes(id)
            ) !== undefined
          );
        })(),
        `list_payment_intent was called with customer payment intent ${id}`
      ),
    ],
  };
});

export const getEvalTestCases = async () => Promise.all(_testCases);
