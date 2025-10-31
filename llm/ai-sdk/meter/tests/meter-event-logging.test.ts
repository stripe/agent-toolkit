/**
 * Tests for meter event logging utilities
 */

import Stripe from 'stripe';
import {logUsageEvent, sendMeterEventsToStripe} from '../meter-event-logging';
import type {UsageEvent, MeterConfig} from '../meter-event-types';

// Mock Stripe
jest.mock('stripe');

describe('sendMeterEventsToStripe', () => {
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

  it('should send meter events to Stripe', async () => {
    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    await sendMeterEventsToStripe(mockStripe, config, event);

    expect(mockStripe.v2.billing.meterEvents.create).toHaveBeenCalledTimes(2);
  });

  it('should send separate events for input and output tokens', async () => {
    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    await sendMeterEventsToStripe(mockStripe, config, event);

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

  it('should handle zero input tokens', async () => {
    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 0,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    await sendMeterEventsToStripe(mockStripe, config, event);

    expect(mockStripe.v2.billing.meterEvents.create).toHaveBeenCalledTimes(1);
    const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
    expect(call.payload.token_type).toBe('output');
  });

  it('should handle zero output tokens', async () => {
    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    };

    await sendMeterEventsToStripe(mockStripe, config, event);

    expect(mockStripe.v2.billing.meterEvents.create).toHaveBeenCalledTimes(1);
    const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
    expect(call.payload.token_type).toBe('input');
  });

  it('should handle Stripe API errors gracefully', async () => {
    mockStripe.v2.billing.meterEvents.create.mockRejectedValue(
      new Error('API Error')
    );

    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    await sendMeterEventsToStripe(mockStripe, config, event);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error sending meter events to Stripe:',
      expect.any(Error)
    );
  });

  it('should include proper timestamp format', async () => {
    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    await sendMeterEventsToStripe(mockStripe, config, event);

    const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
    expect(call.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  describe('Model Name Normalization - Anthropic', () => {
    it('should remove date suffix (YYYYMMDD)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should remove -latest suffix', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-opus-latest',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should convert version numbers (3-5 to 3.5)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should handle latest suffix before date suffix', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-opus-latest-20240229',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should handle version numbers + date suffix', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should handle version numbers + latest suffix', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should handle haiku model', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-5-haiku-20241022',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3.5-haiku');
    });

    it('should handle model without any suffixes', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-3-opus',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-3-opus');
    });

    it('should handle claude-2 models', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-2-1-20231120',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-2.1');
    });

    it('should handle future version numbers (4-0)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'claude-4-0-sonnet-20251231',
        provider: 'anthropic',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('anthropic/claude-4.0-sonnet');
    });
  });

  describe('Model Name Normalization - OpenAI', () => {
    it('should keep gpt-4o-2024-05-13 as-is (special exception)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-4o-2024-05-13',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4o-2024-05-13');
    });

    it('should remove date suffix from gpt-4-turbo', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-4-turbo-2024-04-09',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4-turbo');
    });

    it('should remove date suffix from gpt-4o-mini', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-4o-mini-2024-07-18',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4o-mini');
    });

    it('should NOT remove short date codes (MMDD format)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-4-0613',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      // Short date codes like -0613 are NOT in YYYY-MM-DD format, so they stay
      expect(call.payload.model).toBe('openai/gpt-4-0613');
    });

    it('should keep gpt-4 without date as-is', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-4',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4');
    });

    it('should keep gpt-3.5-turbo without date as-is', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-3.5-turbo');
    });

    it('should NOT remove short date codes from gpt-3.5-turbo', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-3.5-turbo-0125',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      // Short date codes like -0125 are NOT in YYYY-MM-DD format, so they stay
      expect(call.payload.model).toBe('openai/gpt-3.5-turbo-0125');
    });

    it('should handle o1-preview model', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'o1-preview-2024-09-12',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/o1-preview');
    });

    it('should handle o1-mini model', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'o1-mini-2024-09-12',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/o1-mini');
    });

    it('should NOT remove 4-digit dates (not in YYYY-MM-DD format)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gpt-4-0314',
        provider: 'openai',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('openai/gpt-4-0314');
    });
  });

  describe('Model Name Normalization - Google', () => {
    it('should keep gemini-1.5-pro as-is', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gemini-1.5-pro',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-1.5-pro');
    });

    it('should keep gemini-2.5-flash as-is', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gemini-2.5-flash',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-2.5-flash');
    });

    it('should keep gemini-pro as-is', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gemini-pro',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-pro');
    });

    it('should keep any Google model name as-is (even with dates)', async () => {
      const config: MeterConfig = {};
      const event: UsageEvent = {
        model: 'gemini-1.5-pro-20241201',
        provider: 'google',
        usage: {inputTokens: 100, outputTokens: 50},
        stripeCustomerId: 'cus_123',
      };

      await sendMeterEventsToStripe(mockStripe, config, event);

      const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
      expect(call.payload.model).toBe('google/gemini-1.5-pro-20241201');
    });
  });
});

describe('logUsageEvent', () => {
  let mockStripe: jest.Mocked<any>;

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
  });

  it('should call sendMeterEventsToStripe', () => {
    const config: MeterConfig = {};

    const event: UsageEvent = {
      model: 'gpt-4',
      provider: 'openai',
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
      stripeCustomerId: 'cus_123',
    };

    // logUsageEvent is fire-and-forget, so we just ensure it doesn't throw
    expect(() => logUsageEvent(mockStripe, config, event)).not.toThrow();
  });
});

