/**
 * Stripe AI SDK Billing Wrapper Integration
 * 
 * This module provides a wrapper for Vercel AI SDK models that automatically
 * reports token usage to Stripe meter events for billing purposes.
 */

import type {LanguageModelV2} from '@ai-sdk/provider';
import {AISDKWrapperV2} from './wrapperV2';
import type {AIMeterConfig} from './types';

export * from './types';

/**
 * Wraps a Vercel AI SDK language model to automatically report usage to Stripe meter events.
 *
 * This function wraps AI SDK v2 models and returns a wrapped version that sends token usage
 * to Stripe for billing.
 *
 * **IMPORTANT:** Only LanguageModelV2 models are supported. If you try to pass a v1 model
 * (like Groq), you will get a TypeScript compilation error. This is intentional to ensure
 * metering works correctly.
 *
 * Works with ANY AI SDK provider that implements LanguageModelV2, including:
 * - OpenAI (`@ai-sdk/openai`)
 * - Anthropic (`@ai-sdk/anthropic`)
 * - Google (`@ai-sdk/google`)
 * - Azure OpenAI (via `@ai-sdk/openai`)
 * - Amazon Bedrock (`@ai-sdk/amazon-bedrock`)
 * - Together AI (via `createOpenAI` from `@ai-sdk/openai`)
 * - Any other provider with v2 specification
 *
 * Note: Providers using v1 specification (like Groq) are not supported
 *
 * @template T - The type of the language model (must extend LanguageModelV2).
 * @param model - The Vercel AI SDK language model instance to wrap (must be v2).
 * @param stripeApiKey - The Stripe API key.
 * @param stripeCustomerId - The Stripe customer ID for meter events.
 * @returns The wrapped model with Stripe meter event tracking.
 *
 * @example
 * ```typescript
 * import { meteredModel } from '@stripe/ai-sdk/meter';
 * import { openai } from '@ai-sdk/openai';
 * import { generateText } from 'ai';
 *
 * const model = meteredModel(openai('gpt-4'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);
 *
 * const { text } = await generateText({
 *   model: model,
 *   prompt: 'Say "Hello, World!" and nothing else.',
 * });
 * ```
 */
export function meteredModel<T extends LanguageModelV2>(
  model: T,
  stripeApiKey: string,
  stripeCustomerId: string
): T {
  const config: AIMeterConfig = {
    stripeApiKey,
    stripeCustomerId,
  };

  // Verify at runtime that the model is actually v2
  if (
    !model ||
    typeof model !== 'object' ||
    !('specificationVersion' in model) ||
    model.specificationVersion !== 'v2'
  ) {
    throw new Error(
      '[Stripe AI SDK] Invalid model: Only LanguageModelV2 models are supported. ' +
        'The provided model does not have specificationVersion "v2". ' +
        'Please use a supported provider (OpenAI, Anthropic, Google, etc.).'
    );
  }

  return new AISDKWrapperV2(model, config) as unknown as T;
}

