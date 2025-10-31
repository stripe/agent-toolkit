/**
 * Tests for TokenMeter - Gemini Provider
 */

import Stripe from 'stripe';
import {createTokenMeter} from '../token-meter';
import type {MeterConfig} from '../types';

// Mock Stripe
jest.mock('stripe');

describe('TokenMeter - Gemini Provider', () => {
  let mockMeterEventsCreate: jest.Mock;
  let config: MeterConfig;
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
  });

  describe('GenerateContent - Non-streaming', () => {
    it('should track usage from basic text generation', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Hello, World!',
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 8,
            totalTokenCount: 20,
          },
          modelVersion: 'gemini-2.0-flash-exp',
        },
      };

      meter.trackUsage(response, 'cus_123');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: 'cus_123',
            value: '12',
            model: 'google/gemini-2.0-flash-exp',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track usage with reasoning tokens for extended thinking models', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Detailed response after thinking',
          usageMetadata: {
            promptTokenCount: 20,
            candidatesTokenCount: 15,
            thoughtsTokenCount: 50, // Reasoning/thinking tokens
            totalTokenCount: 85,
          },
          modelVersion: 'gemini-2.0-flash-thinking-exp',
        },
      };

      meter.trackUsage(response, 'cus_456');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: 'cus_456',
            value: '20',
            model: 'google/gemini-2.0-flash-thinking-exp',
            token_type: 'input',
          }),
        })
      );
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '65', // 15 candidates + 50 thoughts
            token_type: 'output',
          }),
        })
      );
    });

    it('should track usage from generation with function calling', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => '',
          functionCalls: () => [
            {
              name: 'get_weather',
              args: {location: 'San Francisco'},
            },
          ],
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 30,
            totalTokenCount: 130,
          },
          modelVersion: 'gemini-1.5-pro',
        },
      };

      meter.trackUsage(response, 'cus_789');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '100',
            model: 'google/gemini-1.5-pro',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track usage with system instructions', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'I am following the system instructions.',
          usageMetadata: {
            promptTokenCount: 50, // Includes system instruction tokens
            candidatesTokenCount: 12,
            totalTokenCount: 62,
          },
          modelVersion: 'gemini-2.5-flash',
        },
      };

      meter.trackUsage(response, 'cus_123');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '50',
            model: 'google/gemini-2.5-flash',
            token_type: 'input',
          }),
        })
      );
    });

    it('should use default model name when modelVersion is missing', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Hello',
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 3,
            totalTokenCount: 8,
          },
        },
      };

      meter.trackUsage(response, 'cus_999');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '5',
            model: 'google/gemini',
            token_type: 'input',
          }),
        })
      );
    });
  });

  describe('GenerateContent - Streaming', () => {
    it('should require model name parameter', () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const mockGeminiStream = {
        stream: {
          async *[Symbol.asyncIterator]() {
            yield {
              text: () => 'Hello',
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            };
          },
        },
        response: Promise.resolve({
          text: () => 'Hello',
          modelVersion: 'gemini-1.5-pro',
        }),
      };

      // TypeScript will enforce model name parameter at compile time
      // @ts-expect-error - Testing that TypeScript requires model name
      meter.trackUsageStreamGemini(mockGeminiStream, 'cus_123');
    });

    it('should track usage from basic streaming generation', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const chunks = [
        {
          text: () => 'Hello',
          usageMetadata: null,
        },
        {
          text: () => ', World!',
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 8,
            totalTokenCount: 20,
          },
        },
      ];

      const mockGeminiStream = {
        stream: {
          async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) {
              yield chunk;
            }
          },
        },
        response: Promise.resolve({
          text: () => 'Hello, World!',
          modelVersion: 'gemini-2.0-flash-exp',
        }),
      };

      const wrappedStream = meter.trackUsageStreamGemini(
        mockGeminiStream,
        'cus_123',
        'gemini-2.0-flash-exp'
      );

      for await (const _chunk of wrappedStream.stream) {
        // Consume stream
      }

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: 'cus_123',
            value: '12',
            model: 'google/gemini-2.0-flash-exp',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track usage from streaming with reasoning tokens', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const chunks = [
        {
          text: () => 'Thinking...',
          usageMetadata: null,
        },
        {
          text: () => 'After consideration, here is my answer.',
          usageMetadata: {
            promptTokenCount: 20,
            candidatesTokenCount: 15,
            thoughtsTokenCount: 50,
            totalTokenCount: 85,
          },
        },
      ];

      const mockGeminiStream = {
        stream: {
          async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) {
              yield chunk;
            }
          },
        },
        response: Promise.resolve({
          text: () => 'Complete response',
          modelVersion: 'gemini-2.0-flash-thinking-exp',
        }),
      };

      const wrappedStream = meter.trackUsageStreamGemini(
        mockGeminiStream,
        'cus_456',
        'gemini-2.0-flash-thinking-exp'
      );

      for await (const _chunk of wrappedStream.stream) {
        // Consume stream
      }

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            stripe_customer_id: 'cus_456',
            value: '20',
            model: 'google/gemini-2.0-flash-thinking-exp',
            token_type: 'input',
          }),
        })
      );
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '65', // 15 candidates + 50 thoughts
            token_type: 'output',
          }),
        })
      );
    });

    it('should preserve the response promise in wrapped stream', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const mockGeminiStream = {
        stream: {
          async *[Symbol.asyncIterator]() {
            yield {
              text: () => 'Hello',
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            };
          },
        },
        response: Promise.resolve({
          text: () => 'Hello',
          modelVersion: 'gemini-1.5-pro',
        }),
      };

      const wrappedStream = meter.trackUsageStreamGemini(
        mockGeminiStream,
        'cus_123',
        'gemini-1.5-pro'
      );

      expect(wrappedStream).toHaveProperty('stream');
      expect(wrappedStream).toHaveProperty('response');

      const response = await wrappedStream.response;
      expect(response.text()).toBe('Hello');
    });

    it('should properly wrap the stream generator', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const chunks = [
        {text: () => 'First', usageMetadata: null},
        {text: () => ' Second', usageMetadata: null},
        {
          text: () => ' Third',
          usageMetadata: {
            promptTokenCount: 20,
            candidatesTokenCount: 15,
            totalTokenCount: 35,
          },
        },
      ];

      const mockGeminiStream = {
        stream: {
          async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) {
              yield chunk;
            }
          },
        },
        response: Promise.resolve({
          text: () => 'First Second Third',
          modelVersion: 'gemini-2.0-flash-exp',
        }),
      };

      const wrappedStream = meter.trackUsageStreamGemini(
        mockGeminiStream,
        'cus_123',
        'gemini-2.0-flash-exp'
      );

      const receivedChunks: any[] = [];
      for await (const chunk of wrappedStream.stream) {
        receivedChunks.push(chunk);
      }

      expect(receivedChunks).toHaveLength(3);
      expect(receivedChunks[0].text()).toBe('First');
      expect(receivedChunks[1].text()).toBe(' Second');
      expect(receivedChunks[2].text()).toBe(' Third');
    });
  });

  describe('Multi-turn Chat (ChatSession)', () => {
    it('should track usage from chat session message', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      // ChatSession.sendMessage() returns the same structure as generateContent
      const response = {
        response: {
          text: () => 'This is my second response.',
          usageMetadata: {
            promptTokenCount: 80, // Includes conversation history
            candidatesTokenCount: 12,
            totalTokenCount: 92,
          },
          modelVersion: 'gemini-2.5-flash',
        },
      };

      meter.trackUsage(response, 'cus_123');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '80',
            model: 'google/gemini-2.5-flash',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track usage from streaming chat session', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const chunks = [
        {
          text: () => 'Continuing',
          usageMetadata: null,
        },
        {
          text: () => ' our conversation.',
          usageMetadata: {
            promptTokenCount: 100, // Includes full conversation context
            candidatesTokenCount: 10,
            totalTokenCount: 110,
          },
        },
      ];

      const mockGeminiStream = {
        stream: {
          async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) {
              yield chunk;
            }
          },
        },
        response: Promise.resolve({
          text: () => 'Continuing our conversation.',
          modelVersion: 'gemini-1.5-pro',
        }),
      };

      const wrappedStream = meter.trackUsageStreamGemini(
        mockGeminiStream,
        'cus_456',
        'gemini-1.5-pro'
      );

      for await (const _chunk of wrappedStream.stream) {
        // Consume stream
      }

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '100',
            model: 'google/gemini-1.5-pro',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track usage from long conversation with history', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Based on our previous discussion...',
          usageMetadata: {
            promptTokenCount: 500, // Large context from history
            candidatesTokenCount: 25,
            totalTokenCount: 525,
          },
          modelVersion: 'gemini-1.5-pro',
        },
      };

      meter.trackUsage(response, 'cus_789');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '500',
            model: 'google/gemini-1.5-pro',
            token_type: 'input',
          }),
        })
      );
    });
  });

  describe('Model Variants', () => {
    it('should track gemini-1.5-pro', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Pro model response',
          usageMetadata: {
            promptTokenCount: 15,
            candidatesTokenCount: 10,
            totalTokenCount: 25,
          },
          modelVersion: 'gemini-1.5-pro',
        },
      };

      meter.trackUsage(response, 'cus_123');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '15',
            model: 'google/gemini-1.5-pro',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track gemini-2.5-flash', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Flash model response',
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 8,
            totalTokenCount: 20,
          },
          modelVersion: 'gemini-2.5-flash',
        },
      };

      meter.trackUsage(response, 'cus_456');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '12',
            model: 'google/gemini-2.5-flash',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track gemini-2.0-flash-exp', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Gemini 2.0 response',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
          modelVersion: 'gemini-2.0-flash-exp',
        },
      };

      meter.trackUsage(response, 'cus_789');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '10',
            model: 'google/gemini-2.0-flash-exp',
            token_type: 'input',
          }),
        })
      );
    });

    it('should track gemini-2.0-flash-thinking-exp with reasoning tokens', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Thought-through response',
          usageMetadata: {
            promptTokenCount: 25,
            candidatesTokenCount: 20,
            thoughtsTokenCount: 100, // Extended thinking
            totalTokenCount: 145,
          },
          modelVersion: 'gemini-2.0-flash-thinking-exp',
        },
      };

      meter.trackUsage(response, 'cus_999');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '25',
            model: 'google/gemini-2.0-flash-thinking-exp',
            token_type: 'input',
          }),
        })
      );
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '120', // 20 + 100
            token_type: 'output',
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero reasoning tokens gracefully', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'No reasoning tokens',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            thoughtsTokenCount: 0,
            totalTokenCount: 15,
          },
          modelVersion: 'gemini-2.0-flash-thinking-exp',
        },
      };

      meter.trackUsage(response, 'cus_123');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '10',
            model: 'google/gemini-2.0-flash-thinking-exp',
            token_type: 'input',
          }),
        })
      );
    });

    it('should handle missing thoughtsTokenCount field', async () => {
      const meter = createTokenMeter(TEST_API_KEY, config);

      const response = {
        response: {
          text: () => 'Standard model without thoughts',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
            // No thoughtsTokenCount field
          },
          modelVersion: 'gemini-1.5-pro',
        },
      };

      meter.trackUsage(response, 'cus_123');

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: '10',
            model: 'google/gemini-1.5-pro',
            token_type: 'input',
          }),
        })
      );
    });
  });
});

