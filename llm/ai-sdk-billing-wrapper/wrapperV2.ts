/**
 * AI SDK Model Wrapper (v2 specification)
 */

import Stripe from 'stripe';
import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
} from '@ai-sdk/provider';
import type {AIMeterConfig, AIUsageInfo} from './types';
import {determineProvider, extractUsageFromStream} from './utils';
import {logUsageEvent} from './meter-event-logging';

/**
 * Wrapper class for AI SDK v2 models that adds Stripe meter event tracking
 */
export class AISDKWrapperV2 implements LanguageModelV2 {
  private stripeClient: Stripe;

  constructor(
    private model: LanguageModelV2,
    private config: AIMeterConfig
  ) {
    // Construct Stripe client with the API key
    this.stripeClient = new Stripe(config.stripeApiKey, {
      appInfo: {
        name: 'ai-sdk-billing-wrapper',
        version: '0.1.0',
      },
    });
  }

  /**
   * Wraps doGenerate to track usage with Stripe meter events
   */
  async doGenerate(options: LanguageModelV2CallOptions) {
    try {
      // Call the original doGenerate function
      const response = await this.model.doGenerate(options);

      // Extract usage information
      const usageInfo: AIUsageInfo = {
        provider: determineProvider(this.model.provider),
        model: this.model.modelId,
        inputTokens: response.usage?.inputTokens ?? 0,
        outputTokens: response.usage?.outputTokens ?? 0,
      };

      // Log to Stripe (fire-and-forget)
      this.logUsage(usageInfo);

      return response;
    } catch (error) {
      // Re-throw the error after logging
      console.error('[Stripe AI SDK] doGenerate failed:', error);
      throw error;
    }
  }

  /**
   * Wraps doStream to track usage with Stripe meter events
   */
  async doStream(options: LanguageModelV2CallOptions) {
    try {
      // Call the original doStream method
      const response = await this.model.doStream(options);

      // Collect chunks to extract usage at the end
      const chunks: LanguageModelV2StreamPart[] = [];
      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        start: async (controller) => {
          try {
            const reader = response.stream.getReader();

            while (true) {
              const {done, value} = await reader.read();

              if (done) {
                // Stream is done, now extract usage and log
                const usage = extractUsageFromStream(chunks);
                const usageInfo: AIUsageInfo = {
                  provider: determineProvider(this.model.provider),
                  model: this.model.modelId,
                  inputTokens: usage.inputTokens,
                  outputTokens: usage.outputTokens,
                };

                // Log to Stripe (fire-and-forget)
                this.logUsage(usageInfo);

                controller.close();
                break;
              }

              // Collect chunk and pass it through
              chunks.push(value);
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
            console.error('[Stripe AI SDK] Stream processing failed:', error);
          }
        },
      });

      // Return response with the wrapped stream
      return {
        ...response,
        stream: stream,
      };
    } catch (error) {
      console.error('[Stripe AI SDK] doStream failed:', error);
      throw error;
    }
  }

  /**
   * Helper method to log usage to Stripe
   */
  private logUsage(usageInfo: AIUsageInfo): void {
    logUsageEvent(this.stripeClient, {}, {
      model: usageInfo.model,
      provider: usageInfo.provider,
      usage: {
        inputTokens: usageInfo.inputTokens,
        outputTokens: usageInfo.outputTokens,
      },
      stripeCustomerId: this.config.stripeCustomerId,
    });
  }

  // Proxy all other properties from the original model
  get modelId() {
    return this.model.modelId;
  }

  get provider() {
    return this.model.provider;
  }

  get specificationVersion() {
    return this.model.specificationVersion;
  }

  get supportedUrls() {
    return this.model.supportedUrls;
  }
}

