/**
 * Tests for AI SDK billing wrapper with OpenAI
 * These tests mock Stripe meter events and use jest spies to verify meter events are sent
 */

import Stripe from 'stripe';
import {openai} from '@ai-sdk/openai';
import {meteredModel} from '../index';

// Mock Stripe
jest.mock('stripe');

describe('AI SDK Billing Wrapper - OpenAI', () => {
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

  it('should create wrapper that preserves model properties', () => {
    const originalModel = openai('gpt-4o-mini');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    expect(wrappedModel.modelId).toBe(originalModel.modelId);
    expect(wrappedModel.provider).toBe(originalModel.provider);
    expect(wrappedModel.specificationVersion).toBe(originalModel.specificationVersion);
  });

  it('should wrap doGenerate method', async () => {
    const originalModel = openai('gpt-4o-mini');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    // Spy on the original doGenerate
    const mockDoGenerate = jest.spyOn(originalModel, 'doGenerate').mockResolvedValue({
      text: 'Test response',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      finishReason: 'stop',
      rawResponse: {},
      warnings: [],
    } as any);

    // Call the wrapped doGenerate
    const result = await wrappedModel.doGenerate({
      inputFormat: 'prompt',
      mode: {type: 'regular'},
      prompt: [{role: 'user', content: [{type: 'text', text: 'Test'}]}],
    } as any);

    expect(mockDoGenerate).toHaveBeenCalled();
    expect((result as any).text).toBe('Test response');
    
    // Wait for fire-and-forget logging to complete
    await new Promise(resolve => setImmediate(resolve));
    
    // Verify meter events were created
    expect(mockMeterEventsCreate).toHaveBeenCalledTimes(2);
    expect(mockMeterEventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'token-billing-tokens',
        payload: expect.objectContaining({
          stripe_customer_id: 'cus_test123',
          value: '10',
          model: 'openai/gpt-4o-mini',
          token_type: 'input',
        }),
      })
    );
  });

  it('should normalize OpenAI model names', async () => {
    const originalModel = openai('gpt-4-turbo-2024-04-09');
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

    // Verify model name was normalized (date suffix removed)
    expect(mockMeterEventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          model: 'openai/gpt-4-turbo',
        }),
      })
    );
  });

  it('should handle missing usage gracefully', async () => {
    const originalModel = openai('gpt-4o-mini');
    const wrappedModel = meteredModel(originalModel, TEST_API_KEY, 'cus_test123');

    jest.spyOn(originalModel, 'doGenerate').mockResolvedValue({
      text: 'Test',
      usage: undefined,
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

    // Should not create events with 0 tokens (code only sends when > 0)
    expect(mockMeterEventsCreate).toHaveBeenCalledTimes(0);
  });
});
