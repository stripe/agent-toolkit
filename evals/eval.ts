require("dotenv").config();

import { StripeAgentToolkit } from "../typescript/src/openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { Eval } from "braintrust";
import { AssertionScorer, EvalCaseFunction, EvalInput } from "./scorer";
import { getEvalTestCases } from "./cases";
import { openai } from "./openai";
import OpenAI from "openai";

// This is the core "workhorse" function that accepts an input and returns a response
// which calls stripe agent tookit
async function task(evalInput: EvalInput): Promise<EvalOutput> {
  const stripeAgentToolkit = new StripeAgentToolkit({
    secretKey: process.env.STRIPE_SECRET_KEY!,
    configuration: {
      actions: {
        paymentLinks: {
          create: true,
          read: true,
        },
        products: {
          create: true,
          read: true,
        },
        prices: {
          create: true,
          read: true,
        },
        customers: {
          create: true,
          read: true,
        },
        paymentIntents: {
          create: true,
          read: true,
        },
        invoices: {
          create: true,
          read: true,
        },
        invoiceItems: {
          create: true,
          read: true,
        },
        refunds: {
          create: true,
          read: true,
        },
        subscriptions: {
          read: true,
        },
        balance: {
          read: true,
        },
      },
      ...evalInput.toolkitConfigOverride,
    },
  });

  let messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: evalInput.userPrompt,
    },
  ];

  let completion: OpenAI.Chat.Completions.ChatCompletion;

  const tools = stripeAgentToolkit.getTools();

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
    });

    const message = completion.choices[0].message;

    messages.push(message);

    if (message.tool_calls?.length! > 0) {
      // eslint-disable-next-line no-await-in-loop
      const toolMessages = await Promise.all(
        message.tool_calls!.map((tc) => stripeAgentToolkit.handleToolCall(tc))
      );

      messages = [...messages, ...toolMessages];
    } else {
      break;
    }
  }

  return messages;
}

const BRAINTRUST_PROJECT = "agent-toolkit";

export type EvalOutput = ChatCompletionMessageParam[];

async function main() {
  await Eval<EvalInput, EvalOutput, EvalCaseFunction>(BRAINTRUST_PROJECT, {
    data: await getEvalTestCases(),
    task: async (input) => {
      const result = await task(input);
      return result;
    },
    scores: [AssertionScorer],
  });
}

main();
