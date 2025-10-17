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

const mockLogUsageEvent = meterEventLogging.logUsageEvent as jest.MockedFunction<
  typeof meterEventLogging.logUsageEvent
>;

describe('OpenAI Embeddings', () => {
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
      .spyOn(OpenAIOriginal.Embeddings.prototype, 'create')
      .mockResolvedValue({
        object: 'list',
        data: [
          {
            object: 'embedding',
            embedding: [0.1, 0.2, 0.3],
            index: 0,
          },
        ],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 8,
          total_tokens: 8,
        },
      } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage for embeddings', async () => {
    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'text-embedding-ada-002',
      provider: 'openai',
      usage: {
        inputTokens: 8,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should pass stripeCustomerId to usage event', async () => {
    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
      stripeCustomerId: 'cus_456',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: 'cus_456',
      })
    );
  });

  it('should use normalizeUsage for embeddings usage', async () => {
    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
      stripeCustomerId: 'cus_123',
    });

    // Verify the usage format is correct (prompt_tokens/completion_tokens)
    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        usage: {
          inputTokens: 8,
          outputTokens: 0,
        },
      })
    );
  });

  it('should track usage on errors', async () => {
    jest
      .spyOn(OpenAIOriginal.Embeddings.prototype, 'create')
      .mockRejectedValue(new Error('API Error'));

    await expect(
      client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: 'Hello world',
        stripeCustomerId: 'cus_123',
      })
    ).rejects.toThrow('API Error');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'text-embedding-ada-002',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should handle missing usage data', async () => {
    jest
      .spyOn(OpenAIOriginal.Embeddings.prototype, 'create')
      .mockResolvedValue({
        object: 'list',
        data: [
          {
            object: 'embedding',
            embedding: [0.1, 0.2, 0.3],
            index: 0,
          },
        ],
        model: 'text-embedding-ada-002',
      } as any);

    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'text-embedding-ada-002',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should call parent create method with correct parameters', async () => {
    const createSpy = jest.spyOn(OpenAIOriginal.Embeddings.prototype, 'create');

    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
      encoding_format: 'float',
      stripeCustomerId: 'cus_123',
    });

    expect(createSpy).toHaveBeenCalledWith(
      {
        model: 'text-embedding-ada-002',
        input: 'Hello world',
        encoding_format: 'float',
      },
      undefined
    );
  });

  it('should not send events when no stripeCustomerId provided', async () => {
    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: undefined,
      })
    );
  });

  it('should handle array input', async () => {
    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: ['Hello', 'world'],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'text-embedding-ada-002',
      provider: 'openai',
      usage: {
        inputTokens: 8,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });
});

