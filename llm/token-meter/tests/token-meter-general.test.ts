/**
 * Tests for TokenMeter - General Functionality
 * Tests for cross-provider features, unknown types, and edge cases
 */

import Stripe from 'stripe';
import {createTokenMeter} from '../token-meter';
import type {MeterConfig} from '../types';

// Mock Stripe
jest.mock('stripe');

describe('TokenMeter - General Functionality', () => {
  let mockMeterEventsCreate: jest.Mock;
  let config: MeterConfig;
  let consoleWarnSpy: jest.SpyInstance;
  const TEST_API_KEY = 'sk_test_mock_key';

  beforeEach(() => {
    jest.clearAllMocks();
    mockMeterEventsCreate = jest.fn().mockResolvedValue({});
    
    // Mock the Stripe constructor
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      v2: {
        billing: {
          meterEvents: {
            create: mockMeterEventsCreate,
          },
        },
      },
    }));
    
    config = {};
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Unknown Response Types', () => {
    it('should warn and not log for unknown response formats', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const unknownResponse = {
        some: 'unknown',
        response: 'format',
        that: 'does not match any provider',
      };

      meter.trackUsage(unknownResponse as any, 'cus_123');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unable to detect response type. Supported types: OpenAI ChatCompletion, Responses API, Embeddings'
      );
      await new Promise(resolve => setImmediate(resolve));
      expect(mockMeterEventsCreate).not.toHaveBeenCalled();
    });

    it('should handle null response', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      meter.trackUsage(null as any, 'cus_123');

      expect(consoleWarnSpy).toHaveBeenCalled();
      await new Promise(resolve => setImmediate(resolve));
      expect(mockMeterEventsCreate).not.toHaveBeenCalled();
    });

    it('should handle undefined response', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      meter.trackUsage(undefined as any, 'cus_123');

      expect(consoleWarnSpy).toHaveBeenCalled();
      await new Promise(resolve => setImmediate(resolve));
      expect(mockMeterEventsCreate).not.toHaveBeenCalled();
    });

    it('should handle empty object response', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      meter.trackUsage({} as any, 'cus_123');

      expect(consoleWarnSpy).toHaveBeenCalled();
      await new Promise(resolve => setImmediate(resolve));
      expect(mockMeterEventsCreate).not.toHaveBeenCalled();
    });
  });

  describe('Customer ID Handling', () => {
    it('should pass customer ID correctly for different providers', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);
      const customerId = 'cus_special_id_123';

      // OpenAI
      const openaiResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{index: 0, message: {role: 'assistant', content: 'Hi'}, finish_reason: 'stop'}],
        usage: {prompt_tokens: 5, completion_tokens: 2, total_tokens: 7},
      };

      meter.trackUsage(openaiResponse as any, customerId);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: customerId,
          }),
        })
      );

      mockMeterEventsCreate.mockClear();

      // Anthropic
      const anthropicResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{type: 'text', text: 'Hi'}],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {input_tokens: 5, output_tokens: 2},
      };

      meter.trackUsage(anthropicResponse as any, customerId);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: customerId,
          }),
        })
      );

      mockMeterEventsCreate.mockClear();

      // Gemini
      const geminiResponse = {
        response: {
          text: () => 'Hi',
          usageMetadata: {promptTokenCount: 5, candidatesTokenCount: 2, totalTokenCount: 7},
          modelVersion: 'gemini-1.5-pro',
        },
      };

      meter.trackUsage(geminiResponse as any, customerId);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: customerId,
          }),
        })
      );
    });
  });

  describe('Multiple Meter Instances', () => {
    it('should allow multiple independent meter instances', async () => {
      const config1: MeterConfig = {};
      const config2: MeterConfig = {};

      const meter1 = createTokenMeter(TEST_API_KEY, config1);
      const meter2 = createTokenMeter(TEST_API_KEY, config2);

      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{index: 0, message: {role: 'assistant', content: 'Hi'}, finish_reason: 'stop'}],
        usage: {prompt_tokens: 5, completion_tokens: 2, total_tokens: 7},
      };

      meter1.trackUsage(response as any, 'cus_123');
      meter2.trackUsage(response as any, 'cus_456');

      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({stripe_customer_id: 'cus_123'}),
        })
      );
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({stripe_customer_id: 'cus_456'}),
        })
      );
    });
  });

  describe('Provider Detection Accuracy', () => {
    it('should correctly identify provider from response shape alone', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      // Test that provider is detected purely from response structure
      const responses = [
        {
          response: {
            id: 'chatcmpl-123',
            object: 'chat.completion',
            model: 'gpt-4',
            choices: [{message: {content: 'test'}}],
            usage: {prompt_tokens: 1, completion_tokens: 1},
          },
          expectedProvider: 'openai',
        },
        {
          response: {
            id: 'msg_123',
            type: 'message',
            role: 'assistant',
            content: [{type: 'text', text: 'test'}],
            model: 'claude-3-opus',
            usage: {input_tokens: 1, output_tokens: 1},
          },
          expectedProvider: 'anthropic',
        },
        {
          response: {
            response: {
              text: () => 'test',
              usageMetadata: {promptTokenCount: 1, candidatesTokenCount: 1},
              modelVersion: 'gemini-2.0-flash-exp',
            },
          },
          expectedProvider: 'google',
        },
      ];

      for (const {response, expectedProvider} of responses) {
        mockMeterEventsCreate.mockClear();
        meter.trackUsage(response as any, 'cus_123');

        await new Promise(resolve => setImmediate(resolve));

        expect(mockMeterEventsCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              model: expect.stringContaining(expectedProvider + '/'),
            }),
          })
        );
      }
    });
  });
});

// Helper function to create mock streams with tee()
function createMockStreamWithTee(chunks: any[]) {
  return {
    tee() {
      const stream1 = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        },
        tee() {
          const s1 = {
            async *[Symbol.asyncIterator]() {
              for (const chunk of chunks) {
                yield chunk;
              }
            },
          };
          const s2 = {
            async *[Symbol.asyncIterator]() {
              for (const chunk of chunks) {
                yield chunk;
              }
            },
          };
          return [s1, s2];
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
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

