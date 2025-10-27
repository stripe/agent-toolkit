/**
 * Generic token metering implementation
 */

import Stripe from 'stripe';
import type OpenAI from 'openai';
import type {Stream} from 'openai/streaming';
import type Anthropic from '@anthropic-ai/sdk';
import type {Stream as AnthropicStream} from '@anthropic-ai/sdk/streaming';
import type {
  GenerateContentResult,
  GenerateContentStreamResult,
} from '@google/generative-ai';
import type {MeterConfig} from './types';
import {logUsageEvent} from './meter-event-logging';
import {
  detectResponse,
  isGeminiStream,
  extractUsageFromChatStream,
  extractUsageFromResponseStream,
  extractUsageFromAnthropicStream,
  type DetectedResponse,
} from './utils/type-detection';

/**
 * Supported response types from all AI providers
 */
export type SupportedResponse =
  | OpenAI.ChatCompletion
  | OpenAI.Responses.Response
  | OpenAI.CreateEmbeddingResponse
  | Anthropic.Messages.Message
  | GenerateContentResult;

/**
 * Supported stream types from all AI providers
 */
export type SupportedStream =
  | Stream<OpenAI.ChatCompletionChunk>
  | Stream<OpenAI.Responses.ResponseStreamEvent>
  | AnthropicStream<Anthropic.Messages.RawMessageStreamEvent>
  | GenerateContentStreamResult;

/**
 * Generic token meter interface
 */
export interface TokenMeter {
  /**
   * Track usage from any supported response type (fire-and-forget)
   * Automatically detects provider and response type
   */
  trackUsage(response: SupportedResponse, stripeCustomerId: string): void;

  /**
   * Track usage from OpenAI streaming response
   * Model name is automatically extracted from the stream
   * Returns the wrapped stream for consumption
   */
  trackUsageStreamOpenAI<
    T extends
      | Stream<OpenAI.ChatCompletionChunk>
      | Stream<OpenAI.Responses.ResponseStreamEvent>
  >(
    stream: T,
    stripeCustomerId: string
  ): T;

  /**
   * Track usage from Anthropic streaming response
   * Model name is automatically extracted from the stream
   * Returns the wrapped stream for consumption
   */
  trackUsageStreamAnthropic(
    stream: AnthropicStream<Anthropic.Messages.RawMessageStreamEvent>,
    stripeCustomerId: string
  ): AnthropicStream<Anthropic.Messages.RawMessageStreamEvent>;

  /**
   * Track usage from Gemini/Google streaming response
   * Model name must be provided as Gemini streams don't include it
   * Returns the wrapped stream for consumption
   */
  trackUsageStreamGemini(
    stream: GenerateContentStreamResult,
    stripeCustomerId: string,
    modelName: string
  ): GenerateContentStreamResult;
}

/**
 * Create a generic token meter that works with any supported AI provider
 *
 * @param stripeApiKey - Your Stripe API key
 * @param config - Optional configuration for the meter
 * @returns TokenMeter instance for tracking usage
 */
export function createTokenMeter(
  stripeApiKey: string,
  config: MeterConfig = {}
): TokenMeter {
  // Construct Stripe client with the API key
  const stripeClient = new Stripe(stripeApiKey, {
    appInfo: {
      name: 'token-billing',
      version: '0.1.0',
    },
  });
  return {
    trackUsage(response: SupportedResponse, stripeCustomerId: string): void {
      const detected = detectResponse(response);

      if (!detected) {
        console.warn(
          'Unable to detect response type. Supported types: OpenAI ChatCompletion, Responses API, Embeddings'
        );
        return;
      }

      // Fire-and-forget logging
      logUsageEvent(stripeClient, config, {
        model: detected.model,
        provider: detected.provider,
        usage: {
          inputTokens: detected.inputTokens,
          outputTokens: detected.outputTokens,
        },
        stripeCustomerId,
      });
    },

    trackUsageStreamGemini(
      stream: GenerateContentStreamResult,
      stripeCustomerId: string,
      modelName: string
    ): GenerateContentStreamResult {
      const originalStream = stream.stream;
        
        const wrappedStream = (async function* () {
          let lastUsageMetadata: any = null;

          for await (const chunk of originalStream) {
            if (chunk.usageMetadata) {
              lastUsageMetadata = chunk.usageMetadata;
            }
            yield chunk;
          }

          // Log usage after stream completes
          if (lastUsageMetadata) {
            const baseOutputTokens = lastUsageMetadata?.candidatesTokenCount ?? 0;
            // thoughtsTokenCount is for extended thinking models, may not always be present
            const reasoningTokens = (lastUsageMetadata as any)?.thoughtsTokenCount ?? 0;

            logUsageEvent(stripeClient, config, {
              model: modelName,
              provider: 'google',
              usage: {
                inputTokens: lastUsageMetadata?.promptTokenCount ?? 0,
                outputTokens: baseOutputTokens + reasoningTokens,
              },
              stripeCustomerId,
            });
          }
        })();

        // Return the wrapped structure
        return {
          stream: wrappedStream,
          response: stream.response,
        };
    },

    trackUsageStreamOpenAI<
      T extends
        | Stream<OpenAI.ChatCompletionChunk>
        | Stream<OpenAI.Responses.ResponseStreamEvent>
    >(stream: T, stripeCustomerId: string): T {
      const [peekStream, stream2] = stream.tee();

      (async () => {
        // Peek at the first chunk to determine stream type
        const [stream1, meterStream] = peekStream.tee();
        const reader = stream1[Symbol.asyncIterator]();
        const firstChunk = await reader.next();
        
        let detected: DetectedResponse | null = null;
        
        if (!firstChunk.done && firstChunk.value) {
          const chunk = firstChunk.value as any;
          
          // Check if it's an OpenAI Chat stream (has choices array)
          if ('choices' in chunk && Array.isArray(chunk.choices)) {
            detected = await extractUsageFromChatStream(meterStream as any);
          }
          // Check if it's an OpenAI Response API stream (has type starting with 'response.')
          else if (chunk.type && typeof chunk.type === 'string' && chunk.type.startsWith('response.')) {
            detected = await extractUsageFromResponseStream(meterStream as any);
          }
          else {
            console.warn('Unable to detect OpenAI stream type from first chunk:', chunk);
          }
        }

        if (detected) {
          logUsageEvent(stripeClient, config, {
            model: detected.model,
            provider: detected.provider,
            usage: {
              inputTokens: detected.inputTokens,
              outputTokens: detected.outputTokens,
            },
            stripeCustomerId,
          });
        } else {
          console.warn('Unable to extract usage from OpenAI stream');
        }
      })();

      return stream2 as T;
    },

    trackUsageStreamAnthropic(
      stream: AnthropicStream<Anthropic.Messages.RawMessageStreamEvent>,
      stripeCustomerId: string
    ): AnthropicStream<Anthropic.Messages.RawMessageStreamEvent> {
      const [peekStream, stream2] = stream.tee();

      (async () => {
        const detected = await extractUsageFromAnthropicStream(peekStream);

        if (detected) {
          logUsageEvent(stripeClient, config, {
            model: detected.model,
            provider: detected.provider,
            usage: {
              inputTokens: detected.inputTokens,
              outputTokens: detected.outputTokens,
            },
            stripeCustomerId,
          });
        } else {
          console.warn('Unable to extract usage from Anthropic stream');
        }
      })();

      return stream2;
    },
  };
}

