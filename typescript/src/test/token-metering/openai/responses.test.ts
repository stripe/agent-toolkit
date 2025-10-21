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

describe('OpenAI Responses - Non-streaming', () => {
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
    jest.spyOn(OpenAIOriginal.Responses.prototype, 'create').mockResolvedValue({
      id: 'resp_123',
      object: 'response',
      created: Date.now(),
      model: 'gpt-4',
      output: 'Hello!',
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage for successful response', async () => {
    await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stripeCustomerId: 'cus_123',
    } as any);

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

  it('should use normalizeResponsesUsage for usage data', async () => {
    await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stripeCustomerId: 'cus_123',
    } as any);

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
      .spyOn(OpenAIOriginal.Responses.prototype, 'create')
      .mockRejectedValue(new Error('API Error'));

    await expect(
      client.responses.create({
        model: 'gpt-4',
        instructions: 'You are a helpful assistant',
        input: 'Hello',
        stripeCustomerId: 'cus_123',
      } as any)
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

  it('should handle missing usage data', async () => {
    jest.spyOn(OpenAIOriginal.Responses.prototype, 'create').mockResolvedValue({
      id: 'resp_123',
      object: 'response',
      created: Date.now(),
      model: 'gpt-4',
      output: 'Hello!',
    } as any);

    await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stripeCustomerId: 'cus_123',
    } as any);

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

describe('OpenAI Responses - Streaming', () => {
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
        type: 'response.output_text.delta',
        delta: 'Hello',
      },
      {
        type: 'response.done',
        response: {
          id: 'resp_123',
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        },
      },
    ]);

    jest
      .spyOn(OpenAIOriginal.Responses.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const result = await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stream: true,
      stripeCustomerId: 'cus_123',
    } as any);

    // Consume the stream
    for await (const chunk of result as any) {
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

  it('should extract usage from response chunks', async () => {
    const mockStream = createMockStream([
      {
        type: 'response.output_text.delta',
        delta: 'Hello',
      },
      {
        type: 'response.done',
        response: {
          id: 'resp_123',
          usage: {
            input_tokens: 20,
            output_tokens: 10,
          },
        },
      },
    ]);

    jest
      .spyOn(OpenAIOriginal.Responses.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const result = await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stream: true,
      stripeCustomerId: 'cus_123',
    } as any);

    for await (const chunk of result as any) {
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

  it('should handle streams without usage data', async () => {
    const mockStream = createMockStream([
      {
        type: 'response.output_text.delta',
        delta: 'Hello',
      },
      {
        type: 'response.done',
        response: {
          id: 'resp_123',
        },
      },
    ]);

    jest
      .spyOn(OpenAIOriginal.Responses.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const result = await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stream: true,
      stripeCustomerId: 'cus_123',
    } as any);

    for await (const chunk of result as any) {
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

  it('should tee the stream properly', async () => {
    const chunks = [
      {
        type: 'response.output_text.delta',
        delta: 'Hello',
      },
      {
        type: 'response.done',
        response: {
          id: 'resp_123',
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        },
      },
    ];

    const mockStream = createMockStream(chunks);

    jest
      .spyOn(OpenAIOriginal.Responses.prototype, 'create')
      .mockResolvedValue(mockStream as any);

    const result = await client.responses.create({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      stream: true,
      stripeCustomerId: 'cus_123',
    } as any);

    const receivedChunks: any[] = [];
    for await (const chunk of result as any) {
      receivedChunks.push(chunk);
    }

    expect(receivedChunks).toHaveLength(2);
    expect(receivedChunks[0].type).toBe('response.output_text.delta');
  });
});

describe('OpenAI Responses - Parse', () => {
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

    // Mock the parent class's parse method
    jest.spyOn(OpenAIOriginal.Responses.prototype, 'parse').mockResolvedValue({
      id: 'resp_123',
      object: 'response',
      created: Date.now(),
      model: 'gpt-4',
      output: {parsed: {result: 'Success'}},
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage for parsed responses', async () => {
    await client.responses.parse({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'test',
          schema: {type: 'object', properties: {result: {type: 'string'}}},
        },
      },
      stripeCustomerId: 'cus_123',
    } as any);

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

  it('should extract stripeCustomerId correctly', async () => {
    await client.responses.parse({
      model: 'gpt-4',
      instructions: 'You are a helpful assistant',
      input: 'Hello',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'test',
          schema: {type: 'object', properties: {result: {type: 'string'}}},
        },
      },
      stripeCustomerId: 'cus_456',
    } as any);

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: 'cus_456',
      })
    );
  });

  it('should handle parse errors', async () => {
    jest
      .spyOn(OpenAIOriginal.Responses.prototype, 'parse')
      .mockRejectedValue(new Error('Parse Error'));

    await expect(
      client.responses.parse({
        model: 'gpt-4',
        instructions: 'You are a helpful assistant',
        input: 'Hello',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'test',
            schema: {type: 'object', properties: {result: {type: 'string'}}},
          },
        },
        stripeCustomerId: 'cus_123',
      } as any)
    ).rejects.toThrow('Parse Error');

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
