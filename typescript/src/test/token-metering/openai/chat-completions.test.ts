import {OpenAI as OpenAIOriginal} from 'openai';
import StripeTrackedOpenAI from '@/token-metering/openai';
import type {StripeConfig} from '@/token-metering/types';
import * as meterEventLogging from '@/token-metering/meter-event-logging';

// Mock dependencies
jest.mock('stripe');
jest.mock('@/token-metering/meter-event-logging', () => ({
  ...jest.requireActual('@/token-metering/meter-event-logging'),
  logUsageEvent: jest.fn(),
}));

const mockLogUsageEvent =
  meterEventLogging.logUsageEvent as jest.MockedFunction<
    typeof meterEventLogging.logUsageEvent
  >;

describe('OpenAI Chat Completions - Non-streaming', () => {
  let client: StripeTrackedOpenAI;
  let stripeConfig: StripeConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    client = new StripeTrackedOpenAI({
      apiKey: 'test-api-key',
      stripe: stripeConfig,
    });

    // Mock the parent class's create method
    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage for successful completion', async () => {
    await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should pass stripeCustomerId to usage event', async () => {
    await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_456',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: 'cus_456',
      })
    );
  });

  it('should call parent create method with correct parameters', async () => {
    const createSpy = jest.spyOn(
      OpenAIOriginal.Chat.Completions.prototype,
      'create'
    );

    await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      temperature: 0.7,
      stripeCustomerId: 'cus_123',
    });

    expect(createSpy).toHaveBeenCalledWith(
      {
        model: 'gpt-4',
        messages: [{role: 'user', content: 'Hello'}],
        temperature: 0.7,
      },
      undefined
    );
  });

  it('should track usage even on API errors', async () => {
    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockRejectedValue(new Error('API Error'));

    await expect(
      client.chat.completions.create({
        model: 'gpt-4',
        messages: [{role: 'user', content: 'Hello'}],
        stripeCustomerId: 'cus_123',
      })
    ).rejects.toThrow('API Error');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should handle missing usage data in response', async () => {
    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
            },
            finish_reason: 'stop',
          },
        ],
      } as any);

    await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should not send events when no stripeCustomerId provided', async () => {
    await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: undefined,
      })
    );
  });
});

describe('OpenAI Chat Completions - Streaming', () => {
  let client: StripeTrackedOpenAI;
  let stripeConfig: StripeConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    client = new StripeTrackedOpenAI({
      apiKey: 'test-api-key',
      stripe: stripeConfig,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage from streaming response', async () => {
    const mockStream = createMockStream([
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {content: 'Hello'},
            finish_reason: null,
          },
        ],
      },
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      },
    ]);

    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    // Consume the stream
    for await (const chunk of stream) {
      // Process chunks
    }

    // Wait for background processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should add stream_options to request', async () => {
    const mockStream = createMockStream([]);
    const createSpy = jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    expect(createSpy).toHaveBeenCalledWith(
      {
        model: 'gpt-4',
        messages: [{role: 'user', content: 'Hello'}],
        stream: true,
        stream_options: {include_usage: true},
      },
      undefined
    );
  });

  it('should tee the stream properly', async () => {
    const chunks = [
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{index: 0, delta: {content: 'Hello'}, finish_reason: null}],
      },
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{index: 0, delta: {}, finish_reason: 'stop'}],
        usage: {prompt_tokens: 10, completion_tokens: 5, total_tokens: 15},
      },
    ];

    const mockStream = createMockStream(chunks);

    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    const receivedChunks: any[] = [];
    for await (const chunk of stream) {
      receivedChunks.push(chunk);
    }

    expect(receivedChunks).toHaveLength(2);
    expect(receivedChunks[0].choices[0].delta.content).toBe('Hello');
  });

  it('should handle streams without usage data', async () => {
    const mockStream = createMockStream([
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{index: 0, delta: {content: 'Hello'}, finish_reason: null}],
      },
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{index: 0, delta: {}, finish_reason: 'stop'}],
      },
    ]);

    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    for await (const chunk of stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should track usage even if stream errors', async () => {
    const mockStream = createMockStreamWithError(new Error('Stream error'));

    jest
      .spyOn(OpenAIOriginal.Chat.Completions.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    await expect(async () => {
      for await (const chunk of stream) {
        // This should throw
      }
    }).rejects.toThrow('Stream error');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });
});

// Helper functions to create mock streams
function createMockStream(chunks: any[]) {
  let index = 0;
  const iterator = {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };

  return {
    ...iterator,
    tee() {
      const stream1 = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        },
      };
      const stream2 = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        },
      };
      return [stream1, stream2];
    },
  };
}

function createMockStreamWithError(error: Error) {
  const iterator = {
    async *[Symbol.asyncIterator]() {
      throw error;
    },
  };

  return {
    ...iterator,
    tee() {
      const stream1 = {
        async *[Symbol.asyncIterator]() {
          throw error;
        },
      };
      const stream2 = {
        async *[Symbol.asyncIterator]() {
          throw error;
        },
      };
      return [stream1, stream2];
    },
  };
}
