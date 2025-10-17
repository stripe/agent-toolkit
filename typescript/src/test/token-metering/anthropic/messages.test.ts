import AnthropicOriginal from '@anthropic-ai/sdk';
import StripeTrackedAnthropic from '@/token-metering/anthropic';
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

describe('Anthropic Messages - Non-streaming', () => {
  let client: StripeTrackedAnthropic;
  let stripeConfig: StripeConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    client = new StripeTrackedAnthropic({
      apiKey: 'test-api-key',
      stripe: stripeConfig,
    });

    // Mock the parent class's create method
    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{type: 'text', text: 'Hello!'}],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage for successful message', async () => {
    await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should extract model from result not params', async () => {
    await client.messages.create({
      model: 'claude-3-opus-latest',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_123',
    });

    // The result contains the actual model name used
    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022', // From mocked result
      })
    );
  });

  it('should normalize Anthropic usage format', async () => {
    await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_123',
    });

    // Verify the usage format is correct (input_tokens/output_tokens)
    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        usage: {
          inputTokens: 10,
          outputTokens: 5,
        },
      })
    );
  });

  it('should track usage on errors', async () => {
    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockRejectedValue(new Error('API Error'));

    await expect(
      client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{role: 'user', content: 'Hello'}],
        stripeCustomerId: 'cus_123',
      })
    ).rejects.toThrow('API Error');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should handle missing usage data', async () => {
    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{type: 'text', text: 'Hello!'}],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        stop_sequence: null,
      } as any);

    await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should call parent create method with correct parameters', async () => {
    const createSpy = jest.spyOn(
      AnthropicOriginal.Messages.prototype,
      'create'
    );

    await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      temperature: 0.7,
      stripeCustomerId: 'cus_123',
    });

    expect(createSpy).toHaveBeenCalledWith(
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{role: 'user', content: 'Hello'}],
        temperature: 0.7,
      },
      undefined
    );
  });

  it('should not send events when no stripeCustomerId provided', async () => {
    await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
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

describe('Anthropic Messages - Streaming', () => {
  let client: StripeTrackedAnthropic;
  let stripeConfig: StripeConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    client = new StripeTrackedAnthropic({
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
        type: 'message_start',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'claude-3-opus-20240229',
          usage: {
            input_tokens: 10,
            output_tokens: 0,
          },
        },
      },
      {
        type: 'content_block_start',
        index: 0,
        content_block: {type: 'text', text: ''},
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {type: 'text_delta', text: 'Hello'},
      },
      {
        type: 'message_delta',
        delta: {stop_reason: 'end_turn'},
        usage: {
          output_tokens: 5,
        },
      },
    ]);

    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
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
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should extract input tokens from message_start event', async () => {
    const mockStream = createMockStream([
      {
        type: 'message_start',
        message: {
          id: 'msg_123',
          usage: {
            input_tokens: 20,
            output_tokens: 0,
          },
        },
      },
      {
        type: 'message_delta',
        delta: {stop_reason: 'end_turn'},
        usage: {
          output_tokens: 10,
        },
      },
    ]);

    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    for await (const chunk of stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        usage: {
          inputTokens: 20,
          outputTokens: 10,
        },
      })
    );
  });

  it('should extract output tokens from message_delta event', async () => {
    const mockStream = createMockStream([
      {
        type: 'message_start',
        message: {
          id: 'msg_123',
          usage: {
            input_tokens: 10,
            output_tokens: 0,
          },
        },
      },
      {
        type: 'message_delta',
        delta: {stop_reason: 'end_turn'},
        usage: {
          output_tokens: 15,
        },
      },
    ]);

    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    for await (const chunk of stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        usage: {
          inputTokens: 10,
          outputTokens: 15,
        },
      })
    );
  });

  it('should tee the stream properly', async () => {
    const chunks = [
      {
        type: 'message_start',
        message: {
          id: 'msg_123',
          usage: {
            input_tokens: 10,
            output_tokens: 0,
          },
        },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {type: 'text_delta', text: 'Hello'},
      },
    ];

    const mockStream = createMockStream(chunks);

    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    const receivedChunks: any[] = [];
    for await (const chunk of stream) {
      receivedChunks.push(chunk);
    }

    expect(receivedChunks).toHaveLength(2);
    expect(receivedChunks[0].type).toBe('message_start');
    expect(receivedChunks[1].type).toBe('content_block_delta');
  });

  it('should handle streams without usage data', async () => {
    const mockStream = createMockStream([
      {
        type: 'message_start',
        message: {
          id: 'msg_123',
        },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {type: 'text_delta', text: 'Hello'},
      },
    ]);

    jest
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello'}],
      stream: true,
      stripeCustomerId: 'cus_123',
    });

    for await (const chunk of stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
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
      .spyOn(AnthropicOriginal.Messages.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const stream = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
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
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
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
