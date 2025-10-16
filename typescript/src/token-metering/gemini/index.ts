import {GoogleGenerativeAI} from '@google/generative-ai';
import type {
  GenerativeModel,
  GenerateContentRequest,
  GenerateContentResult,
  GenerateContentStreamResult,
  ChatSession,
  StartChatParams,
  ModelParams,
} from '@google/generative-ai';
import type {StripeConfig, StripeParams} from '../types';
import {extractStripeParams, logUsageEvent} from '../meter-event-logging';

interface StripeTrackedGoogleGenerativeAIConfig {
  apiKey: string;
  stripe: StripeConfig;
}

/**
 * Normalize Gemini usage to our standard format
 * Note: Gemini includes reasoning tokens separately in thoughtsTokenCount
 * We add these to outputTokens for billing purposes
 */
function normalizeGeminiUsage(usageMetadata: any) {
  const baseOutputTokens = usageMetadata?.candidatesTokenCount ?? 0;
  const reasoningTokens = usageMetadata?.thoughtsTokenCount ?? 0;

  return {
    inputTokens: usageMetadata?.promptTokenCount ?? 0,
    outputTokens: baseOutputTokens + reasoningTokens,
  };
}

/**
 * GoogleGenerativeAI client wrapper that tracks token usage and reports to Stripe
 */
class StripeTrackedGoogleGenerativeAI {
  private readonly client: GoogleGenerativeAI;
  private readonly stripeConfig: StripeConfig;

  constructor(config: StripeTrackedGoogleGenerativeAIConfig) {
    const {stripe, apiKey} = config;
    this.client = new GoogleGenerativeAI(apiKey);
    this.stripeConfig = stripe;
  }

  /**
   * Get a generative model (wrapped to track usage)
   */
  public getGenerativeModel(params: ModelParams): StripeTrackedGenerativeModel {
    const model = this.client.getGenerativeModel(params);
    return new StripeTrackedGenerativeModel(
      model,
      this.stripeConfig,
      params.model
    );
  }
}

/**
 * Wrapped GenerativeModel that tracks token usage
 */
class StripeTrackedGenerativeModel {
  private readonly model: GenerativeModel;
  private readonly stripeConfig: StripeConfig;
  private readonly modelName: string;

  constructor(
    model: GenerativeModel,
    stripeConfig: StripeConfig,
    modelName: string
  ) {
    this.model = model;
    this.stripeConfig = stripeConfig;
    this.modelName = modelName;
  }

  /**
   * Generate content (non-streaming)
   */
  public async generateContent(
    request: string | (GenerateContentRequest & StripeParams)
  ): Promise<GenerateContentResult> {
    let stripeCustomerId: string | undefined;
    let actualRequest: string | GenerateContentRequest;

    if (typeof request === 'string') {
      actualRequest = request;
    } else {
      const {providerParams, stripeCustomerId: customerId} =
        extractStripeParams(request);
      stripeCustomerId = customerId;
      actualRequest = providerParams as GenerateContentRequest;
    }

    try {
      const result = await this.model.generateContent(actualRequest);

      logUsageEvent(this.stripeConfig, {
        model: this.modelName,
        provider: 'google',
        usage: normalizeGeminiUsage(result.response.usageMetadata),
        stripeCustomerId,
      });

      return result;
    } catch (error: unknown) {
      logUsageEvent(this.stripeConfig, {
        model: this.modelName,
        provider: 'google',
        usage: normalizeGeminiUsage(null),
        stripeCustomerId,
      });
      throw error;
    }
  }

  /**
   * Generate content stream
   */
  public async generateContentStream(
    request: string | (GenerateContentRequest & StripeParams)
  ): Promise<GenerateContentStreamResult> {
    let stripeCustomerId: string | undefined;
    let actualRequest: string | GenerateContentRequest;

    if (typeof request === 'string') {
      actualRequest = request;
    } else {
      const {providerParams, stripeCustomerId: customerId} =
        extractStripeParams(request);
      stripeCustomerId = customerId;
      actualRequest = providerParams as GenerateContentRequest;
    }

    try {
      const result = await this.model.generateContentStream(actualRequest);

      // Wrap the stream to capture usage
      const originalStream = result.stream;
      const wrappedStream = async function* (
        this: StripeTrackedGenerativeModel
      ) {
        let lastUsageMetadata: any = null;

        for await (const chunk of originalStream) {
          if (chunk.usageMetadata) {
            lastUsageMetadata = chunk.usageMetadata;
          }
          yield chunk;
        }

        // Log usage after stream completes
        logUsageEvent(this.stripeConfig, {
          model: this.modelName,
          provider: 'google',
          usage: normalizeGeminiUsage(lastUsageMetadata),
          stripeCustomerId,
        });
      }.bind(this)();

      // Also wrap the response promise
      const originalResponse = result.response;
      const wrappedResponse = originalResponse.then((response: any) => {
        // The usage will already be logged from the stream
        return response;
      });

      return {
        stream: wrappedStream,
        response: wrappedResponse,
      };
    } catch (error: unknown) {
      logUsageEvent(this.stripeConfig, {
        model: this.modelName,
        provider: 'google',
        usage: normalizeGeminiUsage(null),
        stripeCustomerId,
      });
      throw error;
    }
  }

  /**
   * Start a chat session
   */
  public startChat(params?: StartChatParams): StripeTrackedChatSession {
    const chat = this.model.startChat(params);
    return new StripeTrackedChatSession(
      chat,
      this.stripeConfig,
      this.modelName
    );
  }

  /**
   * Count tokens
   */
  public countTokens(request: string | GenerateContentRequest): Promise<any> {
    return this.model.countTokens(request);
  }
}

/**
 * Wrapped ChatSession that tracks token usage
 */
class StripeTrackedChatSession {
  private readonly chat: ChatSession;
  private readonly stripeConfig: StripeConfig;
  private readonly modelName: string;

  constructor(
    chat: ChatSession,
    stripeConfig: StripeConfig,
    modelName: string
  ) {
    this.chat = chat;
    this.stripeConfig = stripeConfig;
    this.modelName = modelName;
  }

  /**
   * Send a message
   */
  public async sendMessage(
    request: string | ({message: string} & StripeParams)
  ): Promise<GenerateContentResult> {
    let stripeCustomerId: string | undefined;
    let message: string;

    if (typeof request === 'string') {
      message = request;
    } else {
      stripeCustomerId = request.stripeCustomerId;
      message = request.message;
    }

    try {
      const result = await this.chat.sendMessage(message);

      logUsageEvent(this.stripeConfig, {
        model: this.modelName,
        provider: 'google',
        usage: normalizeGeminiUsage(result.response.usageMetadata),
        stripeCustomerId,
      });

      return result;
    } catch (error: unknown) {
      logUsageEvent(this.stripeConfig, {
        model: this.modelName,
        provider: 'google',
        usage: normalizeGeminiUsage(null),
        stripeCustomerId,
      });
      throw error;
    }
  }

  /**
   * Send message stream
   */
  public async sendMessageStream(
    request: string | ({message: string} & StripeParams)
  ): Promise<GenerateContentStreamResult> {
    let stripeCustomerId: string | undefined;
    let message: string;

    if (typeof request === 'string') {
      message = request;
    } else {
      stripeCustomerId = request.stripeCustomerId;
      message = request.message;
    }

    try {
      const result = await this.chat.sendMessageStream(message);

      // Wrap the stream to capture usage
      const originalStream = result.stream;
      const wrappedStream = async function* (this: StripeTrackedChatSession) {
        let lastUsageMetadata: any = null;

        for await (const chunk of originalStream) {
          if (chunk.usageMetadata) {
            lastUsageMetadata = chunk.usageMetadata;
          }
          yield chunk;
        }

        // Log usage after stream completes
        logUsageEvent(this.stripeConfig, {
          model: this.modelName,
          provider: 'google',
          usage: normalizeGeminiUsage(lastUsageMetadata),
          stripeCustomerId,
        });
      }.bind(this)();

      // Also wrap the response promise
      const originalResponse = result.response;
      const wrappedResponse = originalResponse.then((response: any) => {
        return response;
      });

      return {
        stream: wrappedStream,
        response: wrappedResponse,
      };
    } catch (error: unknown) {
      logUsageEvent(this.stripeConfig, {
        model: this.modelName,
        provider: 'google',
        usage: normalizeGeminiUsage(null),
        stripeCustomerId,
      });
      throw error;
    }
  }

  /**
   * Get chat history
   */
  public getHistory(): Promise<any> {
    return this.chat.getHistory();
  }
}

// Export as GoogleGenerativeAI (default) and StripeTrackedGoogleGenerativeAI (alternative)
export default StripeTrackedGoogleGenerativeAI;
export {
  StripeTrackedGoogleGenerativeAI as GoogleGenerativeAI,
  StripeTrackedGoogleGenerativeAI,
};
