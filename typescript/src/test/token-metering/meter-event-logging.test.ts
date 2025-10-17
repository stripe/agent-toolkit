import Stripe from 'stripe';
import {
  extractStripeParams,
  normalizeUsage,
  normalizeResponsesUsage,
  logUsageEvent,
} from '@/token-metering/meter-event-logging';
import type {StripeConfig, UsageEvent} from '@/token-metering/types';

// Mock Stripe
jest.mock('stripe');

describe('extractStripeParams', () => {
  it('should extract stripeCustomerId from body', () => {
    const body = {
      model: 'gpt-4',
      messages: [],
      stripeCustomerId: 'cus_123',
    };

    const result = extractStripeParams(body);

    expect(result.stripeCustomerId).toBe('cus_123');
    expect(result.providerParams).toEqual({
      model: 'gpt-4',
      messages: [],
    });
  });

  it('should return providerParams without stripeCustomerId', () => {
    const body = {
      model: 'gpt-4',
      messages: [],
      stripeCustomerId: 'cus_123',
    };

    const result = extractStripeParams(body);

    expect(result.providerParams).not.toHaveProperty('stripeCustomerId');
    expect(Object.keys(result.providerParams)).toEqual(['model', 'messages']);
  });

  it('should handle body without stripeCustomerId', () => {
    const body = {
      model: 'gpt-4',
      messages: [],
    };

    const result = extractStripeParams(body);

    expect(result.stripeCustomerId).toBeUndefined();
    expect(result.providerParams).toEqual({
      model: 'gpt-4',
      messages: [],
    });
  });
});

describe('normalizeUsage', () => {
  it('should normalize OpenAI usage format', () => {
    const usage = {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    };

    const result = normalizeUsage(usage);

    expect(result).toEqual({
      inputTokens: 100,
      outputTokens: 50,
    });
  });

  it('should handle missing usage data', () => {
    const usage = {};

    const result = normalizeUsage(usage);

    expect(result).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it('should handle null usage', () => {
    const result = normalizeUsage(null);

    expect(result).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it('should handle undefined usage', () => {
    const result = normalizeUsage(undefined);

    expect(result).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });
});

describe('normalizeResponsesUsage', () => {
  it('should normalize Responses API format', () => {
    const usage = {
      input_tokens: 100,
      output_tokens: 50,
    };

    const result = normalizeResponsesUsage(usage);

    expect(result).toEqual({
      inputTokens: 100,
      outputTokens: 50,
    });
  });

  it('should handle missing usage data', () => {
    const usage = {};

    const result = normalizeResponsesUsage(usage);

    expect(result).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it('should handle null usage', () => {
    const result = normalizeResponsesUsage(null);

    expect(result).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it('should handle undefined usage', () => {
    const result = normalizeResponsesUsage(undefined);

    expect(result).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
  });
});

describe('logUsageEvent', () => {
  let mockStripe: jest.Mocked<any>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStripe = {
      v2: {
        billing: {
          meterEvents: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
      },
    };

    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripe);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should send meter events to Stripe when stripeCustomerId is provided', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(Stripe).toHaveBeenCalledWith('sk_test_123');
    expect(mockStripe.v2.billing.meterEvents.create).toHaveBeenCalledTimes(2);
  });

  it('should send separate events for input and output tokens', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const calls = mockStripe.v2.billing.meterEvents.create.mock.calls;
    expect(calls[0][0]).toMatchObject({
      event_name: 'token-billing-tokens',
      payload: {
        stripe_customer_id: 'cus_123',
        value: '100',
        model: 'openai/gpt-4',
        token_type: 'input',
      },
    });
    expect(calls[1][0]).toMatchObject({
      event_name: 'token-billing-tokens',
      payload: {
        stripe_customer_id: 'cus_123',
        value: '50',
        model: 'openai/gpt-4',
        token_type: 'output',
      },
    });
  });

  it('should not send events when stripeCustomerId is missing', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockStripe.v2.billing.meterEvents.create).not.toHaveBeenCalled();
  });

  it('should handle zero input tokens', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockStripe.v2.billing.meterEvents.create).toHaveBeenCalledTimes(1);
    const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
    expect(call.payload.token_type).toBe('output');
  });

  it('should handle zero output tokens', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockStripe.v2.billing.meterEvents.create).toHaveBeenCalledTimes(1);
    const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
    expect(call.payload.token_type).toBe('input');
  });

  it('should log payload when verbose mode is enabled', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
      verbose: true,
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleLogSpy).toHaveBeenCalled();
    const logs = consoleLogSpy.mock.calls.map((call) => call[0]).join('');
    expect(logs).toContain('STRIPE METER EVENT');
  });

  it('should not log payload when verbose mode is disabled', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
      verbose: false,
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const logs = consoleLogSpy.mock.calls.map((call) => call[0]).join('');
    expect(logs).not.toContain('STRIPE METER EVENT');
  });

  it('should handle Stripe API errors gracefully', async () => {
    mockStripe.v2.billing.meterEvents.create.mockRejectedValue(
      new Error('API Error')
    );

    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error sending meter events to Stripe:',
      expect.any(Error)
    );
  });

  describe('Model Name Normalization - Anthropic', () => {
    it('should remove date suffix (YYYYMMDD)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should remove -latest suffix', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-opus-latest',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should convert version numbers (3-5 to 3.5)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should handle latest suffix before date suffix', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-opus-latest-20240229',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should handle version numbers + date suffix', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should handle version numbers + latest suffix', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should handle haiku model', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-5-haiku-20241022',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-haiku');
    });

    it('should handle opus model', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should handle model without any suffixes', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-3-opus',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should handle claude-2 models', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-2-1-20231120',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-2.1');
    });

    it('should handle future version numbers (4-0)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'claude-4-0-sonnet-20251231',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-4.0-sonnet');
    });
  });

  describe('Model Name Normalization - OpenAI', () => {
    it('should keep gpt-4o-2024-05-13 as-is (special exception)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-4o-2024-05-13',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4o-2024-05-13');
    });

    it('should remove date suffix from gpt-4-turbo', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-4-turbo-2024-04-09',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4-turbo');
    });

    it('should remove date suffix from gpt-4o-mini', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-4o-mini-2024-07-18',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4o-mini');
    });

    it('should NOT remove short date codes (MMDD format)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-4-0613',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      // Short date codes like -0613 are NOT in YYYY-MM-DD format, so they stay
      expect(call.payload.model).toBe('openai/gpt-4-0613');
    });

    it('should keep gpt-4 without date as-is', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-4',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4');
    });

    it('should keep gpt-3.5-turbo without date as-is', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-3.5-turbo');
    });

    it('should NOT remove short date codes from gpt-3.5-turbo', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-3.5-turbo-0125',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      // Short date codes like -0125 are NOT in YYYY-MM-DD format, so they stay
      expect(call.payload.model).toBe('openai/gpt-3.5-turbo-0125');
    });

    it('should handle o1-preview model', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'o1-preview-2024-09-12',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/o1-preview');
    });

    it('should handle o1-mini model', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'o1-mini-2024-09-12',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/o1-mini');
    });

    it('should NOT remove 4-digit dates (not in YYYY-MM-DD format)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gpt-4-0314',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4-0314');
    });
  });

  describe('Model Name Normalization - Google', () => {
    it('should keep gemini-1.5-pro as-is', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gemini-1.5-pro',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-1.5-pro');
    });

    it('should keep gemini-1.5-flash as-is', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gemini-1.5-flash',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-1.5-flash');
    });

    it('should keep gemini-pro as-is', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gemini-pro',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-pro');
    });

    it('should keep any Google model name as-is (even with dates)', async () => {
      const config: StripeConfig = {stripeApiKey: 'sk_test_123'};
      const event: UsageEvent = {
        model: 'gemini-1.5-pro-20241201',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      logUsageEvent(config, event);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-1.5-pro-20241201');
    });
  });

  it('should include proper timestamp format', async () => {
    const config: StripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    logUsageEvent(config, event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
    expect(call.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});
