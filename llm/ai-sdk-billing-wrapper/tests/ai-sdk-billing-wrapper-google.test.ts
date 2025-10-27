/**
 * Tests for AI SDK billing wrapper with Google Gemini
 * These tests mock Stripe meter events and verify meter events are sent correctly
 */

import Stripe from 'stripe';
import {google} from '@ai-sdk/google';
import {meteredModel} from '../index';

// Mock Stripe
jest.mock('stripe');

describe('AI SDK Billing Wrapper - Google Gemini', () => {
  let mockMeterEventsCreate: jest.Mock;
  const TEST_API_KEY = 'sk_test_mock_key';

  beforeEach(() => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send meter events for doGenerate with Gemini', async () => {
    const originalModel = google('gemini-2.5-flash');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    jest.spyOn(originalModel, 'doGenerate').mockResolvedValue({
      text: 'Hello from Gemini!',
      usage: {
        inputTokens: 15,
        outputTokens: 7,
      },
      finishReason: 'stop',
      rawResponse: {},
      warnings: [],
    } as any);

    await wrappedModel.doGenerate({
      inputFormat: 'prompt',
      mode: {type: 'regular'},
      prompt: [{role: 'user', content: [{type: 'text', text: 'Test'}]}],
    } as any);

    // Wait for fire-and-forget logging to complete
    await new Promise(resolve => setImmediate(resolve));

    expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
    
    expect(mockMeterEventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'token-billing-tokens',
        payload: expect.objectContaining({
          stripe_customer_id: 'cus_test123',
          value: '15',
          model: 'google/gemini-2.5-flash',
          token_type: 'input',
        }),
      })
    );

    expect(mockMeterEventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          value: '7',
          model: 'google/gemini-2.5-flash',
          token_type: 'output',
        }),
      })
    );
  });

  it('should handle different Gemini model variants', async () => {
    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
    ];

    for (const modelName of models) {
      mockMeterEventsCreate.mockClear();
      
      const originalModel = google(modelName as any);
      const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

      jest.spyOn(originalModel, 'doGenerate').mockResolvedValue({
        text: 'Test',
        usage: {inputTokens: 5, outputTokens: 2},
        finishReason: 'stop',
        rawResponse: {},
        warnings: [],
      } as any);

      await wrappedModel.doGenerate({
        inputFormat: 'prompt',
        mode: {type: 'regular'},
        prompt: [{role: 'user', content: [{type: 'text', text: 'Test'}]}],
      } as any);

      // Wait for fire-and-forget logging to complete
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMeterEventsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            model: `google/${modelName}`,
          }),
        })
      );
    }
  });

  it('should preserve model properties', () => {
    const originalModel = google('gemini-2.5-flash');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    expect(wrappedModel.modelId).toBe(originalModel.modelId);
    expect(wrappedModel.provider).toBe(originalModel.provider);
    expect(wrappedModel.specificationVersion).toBe(originalModel.specificationVersion);
  });

  it('should handle zero token usage', async () => {
    const originalModel = google('gemini-2.5-flash');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    jest.spyOn(originalModel, 'doGenerate').mockResolvedValue({
      text: '',
      usage: {inputTokens: 0, outputTokens: 0},
      finishReason: 'stop',
      rawResponse: {},
      warnings: [],
    } as any);

    await wrappedModel.doGenerate({
      inputFormat: 'prompt',
      mode: {type: 'regular'},
      prompt: [{role: 'user', content: [{type: 'text', text: ''}]}],
    } as any);

    // Wait for fire-and-forget logging to complete
    await new Promise(resolve => setImmediate(resolve));

    // Should not create events with zero tokens (code only sends when > 0)
    expect(mockMeterEventsCreate).toHaveBeenCalledTimes(0);
  });
});
