import AnthropicOriginal from '@anthropic-ai/sdk';
import type {APIPromise} from '@anthropic-ai/sdk/core';
import type {StripeConfig, StripeParams} from '../types';
import {extractStripeParams, logUsageEvent} from '../meter-event-logging';

type MessageCreateParamsNonStreaming =
  AnthropicOriginal.Messages.MessageCreateParamsNonStreaming;
type MessageCreateParamsStreaming =
  AnthropicOriginal.Messages.MessageCreateParamsStreaming;
type MessageCreateParams = AnthropicOriginal.Messages.MessageCreateParams;
type Message = AnthropicOriginal.Messages.Message;
type RawMessageStreamEvent = AnthropicOriginal.Messages.RawMessageStreamEvent;
type MessageCreateParamsBase = AnthropicOriginal.Messages.MessageCreateParams;
type RequestOptions = AnthropicOriginal.RequestOptions;
import type {Stream} from '@anthropic-ai/sdk/streaming';

interface StripeTrackedAnthropicConfig {
  apiKey: string;
  stripe: StripeConfig;
  baseURL?: string;
}

/**
 * Normalize Anthropic usage to our standard format
 */
function normalizeAnthropicUsage(usage: any) {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
  };
}

/**
 * Anthropic client wrapper that tracks token usage and reports to Stripe
 */
class StripeTrackedAnthropic extends AnthropicOriginal {
  private readonly stripeConfig: StripeConfig;
  public messages: WrappedMessages;

  constructor(config: StripeTrackedAnthropicConfig) {
    const {stripe, ...anthropicConfig} = config;
    super(anthropicConfig);
    this.stripeConfig = stripe;
    this.messages = new WrappedMessages(this, this.stripeConfig);
  }
}

/**
 * Wrapped Messages class - handles messages.create()
 */
class WrappedMessages extends AnthropicOriginal.Messages {
  private readonly stripeConfig: StripeConfig;

  constructor(client: StripeTrackedAnthropic, stripeConfig: StripeConfig) {
    super(client);
    this.stripeConfig = stripeConfig;
  }

  // --- Overload #1: Non-streaming
  public create(
    body: MessageCreateParamsNonStreaming & StripeParams,
    options?: RequestOptions
  ): APIPromise<Message>;

  // --- Overload #2: Streaming
  public create(
    body: MessageCreateParamsStreaming & StripeParams,
    options?: RequestOptions
  ): APIPromise<Stream<RawMessageStreamEvent>>;

  // --- Overload #3: Generic base
  public create(
    body: MessageCreateParamsBase & StripeParams,
    options?: RequestOptions
  ): APIPromise<Stream<RawMessageStreamEvent> | Message>;

  // --- Implementation Signature
  public create(
    body: MessageCreateParams & StripeParams,
    options?: RequestOptions
  ): APIPromise<Message> | APIPromise<Stream<RawMessageStreamEvent>> {
    const {providerParams: anthropicParams, stripeCustomerId} =
      extractStripeParams(body);

    const parentPromise = super.create(anthropicParams as any, options);

    if (anthropicParams.stream) {
      return parentPromise.then((value) => {
        const usage: {
          input_tokens: number;
          output_tokens: number;
        } = {
          input_tokens: 0,
          output_tokens: 0,
        };

        if ('tee' in value) {
          const stream = value as unknown as Stream<RawMessageStreamEvent>;
          const [stream1, stream2] = stream.tee();

          // Process stream1 in the background to extract usage
          (async () => {
            try {
              for await (const chunk of stream1) {
                // Capture usage from message_start event (input tokens)
                if (chunk.type === 'message_start') {
                  usage.input_tokens = chunk.message.usage.input_tokens ?? 0;
                }
                // Capture usage from message_delta event (output tokens)
                if ('usage' in chunk) {
                  usage.output_tokens = chunk.usage.output_tokens ?? 0;
                }
              }

              // Log usage after stream completes
              logUsageEvent(this.stripeConfig, {
                model: anthropicParams.model,
                provider: 'anthropic',
                usage: normalizeAnthropicUsage(usage),
                stripeCustomerId,
              });
            } catch (error: unknown) {
              logUsageEvent(this.stripeConfig, {
                model: anthropicParams.model,
                provider: 'anthropic',
                usage: normalizeAnthropicUsage(null),
                stripeCustomerId,
              });
            }
          })();

          // Return stream2 to the user
          return stream2;
        }

        return value as unknown as Stream<RawMessageStreamEvent>;
      }) as APIPromise<Stream<RawMessageStreamEvent>>;
    } else {
      const wrappedPromise = parentPromise.then(
        async (result) => {
          if ('content' in result) {
            logUsageEvent(this.stripeConfig, {
              model: result.model,
              provider: 'anthropic',
              usage: normalizeAnthropicUsage(result.usage),
              stripeCustomerId,
            });
          }
          return result;
        },
        async (error: unknown) => {
          logUsageEvent(this.stripeConfig, {
            model: anthropicParams.model,
            provider: 'anthropic',
            usage: normalizeAnthropicUsage(null),
            stripeCustomerId,
          });
          throw error;
        }
      ) as APIPromise<Message>;

      return wrappedPromise;
    }
  }
}

// Export as Anthropic (default) and StripeTrackedAnthropic (alternative)
export default StripeTrackedAnthropic;
export {StripeTrackedAnthropic as Anthropic, StripeTrackedAnthropic};
