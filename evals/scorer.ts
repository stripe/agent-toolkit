require("dotenv").config();

import { ClosedQA } from "autoevals";
import every from "lodash/every";
import braintrustOpenai from "./braintrust_openai";
import { EvalOutput } from "./eval";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions.mjs";
import { Configuration as StripeAgentToolkitConfig } from "../typescript/src/shared/configuration";
import isEqual from "lodash/isEqual";

/*
 * EvalInput is what is passed into the agent.
 * It contains a userPrompt and configuration that can be
 * used to override the toolkit configuration.
 */
export type EvalInput = {
  toolkitConfigOverride: StripeAgentToolkitConfig;
  userPrompt: string;
};

/*
 * EvalCaseFunction is the helper function that is used to
 * run assertions on the output of the agent. It does some
 * parsing of the raw completetion messages and tool calls
 * to make it easier to write assertions.
 */
export type EvalCaseFunction = ({
  toolCalls,
  messages,
  assistantMessages,
}: {
  toolCalls: ChatCompletionMessageToolCall[];
  messages: ChatCompletionMessageParam[];
  assistantMessages: string[];
}) => Array<AssertionResult | Promise<AssertionResult>>;

export const AssertionScorer = async ({
  output: responseMessages,
  expected: evalCaseFunction,
}: {
  output: EvalOutput;
  expected: EvalCaseFunction;
}) => {
  const toolCalls = responseMessages.flatMap((m) => {
    if ("tool_calls" in m && m.tool_calls) {
      return m.tool_calls;
    } else {
      return [];
    }
  });

  const assistantMessages = responseMessages
    .filter((m) => m.role === "assistant")
    .map((m) => (typeof m.content === "string" ? m.content : ""));

  const rawResults = evalCaseFunction({
    toolCalls,
    messages: responseMessages,
    assistantMessages,
  });

  const assertionResults = await Promise.all(rawResults);

  const allPassed = every(assertionResults, (r) => r.status === "passed");

  return {
    name: "Assertions Score",
    score: allPassed ? 1 : 0,
    metadata: {
      assertionResults,
    },
  };
};

/*
Below are assertion functions that can be used to evaluate the output of the agent.
Similar to test framework helpers like Jest.
*/

export type AssertionResult = {
  status: "passed" | "failed";
  assertion_type: string;
  expected?: string;
  actualValue?: string;
  message?: string;
};

/**
 * Uses an LLM call to classify if a substring is semantically contained in a text.
 * @param text1 The full text you want to check against
 * @param text2 The string you want to check if it is contained in the text
 */
export async function semanticContains({
  text1,
  text2,
}: {
  text1: string;
  text2: string;
}): Promise<AssertionResult> {
  const system = `
    You are a highly intelligent AI that can determine if a piece of text semantically contains another piece of text.
    You will be given two pieces of text and you need to determine if the first piece of text semantically contains the second piece of text.
    Answer with just "yes" or "no".
    `;

  const completion = await braintrustOpenai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Text 1: ${text1}\n\nText 2: ${text2}\n\nDoes Text 1 semantically contain Text 2? Answer with just "yes" or "no".`,
      },
    ],
  });

  const response = completion.choices[0].message.content?.toLowerCase();
  return {
    status: response === "yes" ? "passed" : "failed",
    assertion_type: "semantic_contains",
    expected: text2,
    actualValue: text1,
  };
}

export const expectToolCall = (
  actualToolCalls: ChatCompletionMessageToolCall[],
  expectedToolCalls: string[]
): AssertionResult => {
  const actualToolCallNames = actualToolCalls.map((tc) => tc.function.name);

  const pass = actualToolCallNames.some((tc) => expectedToolCalls.includes(tc));

  return {
    status: pass ? "passed" : "failed",
    assertion_type: "expectToolCall",
    expected: expectedToolCalls.join(", "),
    actualValue: actualToolCallNames.join(", "),
  };
};

export const expectToolCallArgs = (
  actualToolCalls: ChatCompletionMessageToolCall[],
  expectedArgs: Array<{ name: string; arguments: any; shallow?: boolean }>
): AssertionResult => {
  const actualToolCallNamesAndArgs = actualToolCalls.map((tc) => ({
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments),
  }));
  const pass = actualToolCallNamesAndArgs.some((tc) => {
    return expectedArgs.some((ea) => {
      if (ea.name !== tc.name) {
        return false;
      }

      if (ea.shallow === true) {
        return Object.keys(ea.arguments).every((key) => {
          return isEqual(ea.arguments[key], tc.arguments[key]);
        });
      } else {
        return isEqual(ea.arguments, tc.arguments);
      }
    });
  });
  return {
    status: pass ? "passed" : "failed",
    assertion_type: "expectToolCallArgs",
    expected: expectedArgs
      .map((ea) => `${ea.name}: ${JSON.stringify(ea.arguments)}`)
      .join(", "),
    actualValue: actualToolCallNamesAndArgs
      .map((tc) => `${tc.name}: ${JSON.stringify(tc.arguments)}`)
      .join(", "),
  };
};

export const llmCriteriaMet = async (
  messages: ChatCompletionMessageParam[],
  criteria: string
): Promise<AssertionResult> => {
  const assistantMessages = messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .join("\n");

  const closedQA = await ClosedQA({
    client: braintrustOpenai,
    input: "According to the provided criterion is the submission correct?",
    criteria,
    output: assistantMessages,
  });

  const pass = !!closedQA.score && closedQA.score > 0.5;

  return {
    status: pass ? "passed" : "failed",
    assertion_type: "llm_criteria_met",
    expected: criteria,
    actualValue: assistantMessages,
  };
};

export const assert = (
  condition: boolean,
  message: string
): AssertionResult => {
  return {
    status: condition ? "passed" : "failed",
    assertion_type: "plain_assert",
    message,
  };
};
