/**
 * Tests for AI SDK billing wrapper with Anthropic
 * These tests mock Stripe meter events and verify meter events are sent correctly
 */

import Stripe from 'stripe';
import {anthropic} from '@ai-sdk/anthropic';
import {meteredModel} from '../index';

// Mock Stripe
jest.mock('stripe');

describe('AI SDK Billing Wrapper - Anthropic', () => {
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

  it('should send meter events for doGenerate with Claude', async () => {
    const originalModel = anthropic('claude-3-5-haiku-20241022');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    jest.spyOn(originalModel, 'doGenerate').mockResolvedValue({
      text: 'Hello from Claude!',
      usage: {
        inputTokens: 12,
        outputTokens: 6,
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
          value: '12',
          model: 'anthropic/claude-3.5-haiku',
          token_type: 'input',
        }),
      })
    );

    expect(mockMeterEventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          value: '6',
          model: 'anthropic/claude-3.5-haiku',
          token_type: 'output',
        }),
      })
    );
  });

  it('should normalize Anthropic model names correctly', async () => {
    const testCases = [
      {input: 'claude-3-5-haiku-20241022', expected: 'anthropic/claude-3.5-haiku'},
      {input: 'claude-3-5-sonnet-20241022', expected: 'anthropic/claude-3.5-sonnet'},
      {input: 'claude-3-opus-20240229', expected: 'anthropic/claude-3-opus'},
      {input: 'claude-sonnet-4-latest', expected: 'anthropic/claude-sonnet-4'},
    ];

    for (const {input, expected} of testCases) {
      mockMeterEventsCreate.mockClear();
      
      const originalModel = anthropic(input as any);
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
            model: expected,
          }),
        })
      );
    }
  });

  it('should preserve model properties', () => {
    const originalModel = anthropic('claude-3-5-haiku-20241022');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    expect(wrappedModel.modelId).toBe(originalModel.modelId);
    expect(wrappedModel.provider).toBe(originalModel.provider);
    expect(wrappedModel.specificationVersion).toBe(originalModel.specificationVersion);
  });
});
