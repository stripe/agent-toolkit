/**
 * Tests for model name normalization across all providers
 * Ensures all model names are properly formatted for meter events
 */

import Stripe from 'stripe';
import {sendMeterEventsToStripe} from '../meter-event-logging';
import type {UsageEvent, MeterConfig} from '../types';

// Mock Stripe
jest.mock('stripe');

describe('Model Name Normalization - Comprehensive', () => {
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

  describe('Google/Gemini Models', () => {
    const testCases = [
      {model: 'gemini-2.5-pro', expected: 'google/gemini-2.5-pro'},
      {model: 'gemini-2.5-flash', expected: 'google/gemini-2.5-flash'},
      {model: 'gemini-2.5-flash-lite', expected: 'google/gemini-2.5-flash-lite'},
      {model: 'gemini-2.0-flash', expected: 'google/gemini-2.0-flash'},
      {model: 'gemini-2.0-flash-lite', expected: 'google/gemini-2.0-flash-lite'},
      // Default fallback model
      {model: 'gemini-1.5-pro', expected: 'google/gemini-1.5-pro'},
    ];

    testCases.forEach(({model, expected}) => {
      it(`should normalize ${model} to ${expected}`, async () => {
        const config: MeterConfig = {};
        const event: UsageEvent = {
          model,
          provider: 'google',
          usage: {inputTokens: 100, outputTokens: 50},
          stripeCustomerId: 'cus_123',
        };

        await sendMeterEventsToStripe(mockStripe, config, event);

        const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
        expect(call.payload.model).toBe(expected);
      });
    });
  });

  describe('OpenAI Models', () => {
    const testCases = [
      {model: 'gpt-5', expected: 'openai/gpt-5'},
      {model: 'gpt-5-mini', expected: 'openai/gpt-5-mini'},
      {model: 'gpt-5-nano', expected: 'openai/gpt-5-nano'},
      {model: 'gpt-5-chat-latest', expected: 'openai/gpt-5-chat-latest'},
      {model: 'gpt-4.1', expected: 'openai/gpt-4.1'},
      {model: 'gpt-4.1-mini', expected: 'openai/gpt-4.1-mini'},
      {model: 'gpt-4.1-nano', expected: 'openai/gpt-4.1-nano'},
      {model: 'gpt-4o', expected: 'openai/gpt-4o'},
      {model: 'gpt-4o-mini', expected: 'openai/gpt-4o-mini'},
      {model: 'o4-mini', expected: 'openai/o4-mini'},
      {model: 'o3', expected: 'openai/o3'},
      {model: 'o3-mini', expected: 'openai/o3-mini'},
      {model: 'o3-pro', expected: 'openai/o3-pro'},
      {model: 'o1', expected: 'openai/o1'},
      {model: 'o1-mini', expected: 'openai/o1-mini'},
      {model: 'o1-pro', expected: 'openai/o1-pro'},
      // With date suffixes that should be removed
      {model: 'gpt-4o-2024-11-20', expected: 'openai/gpt-4o'},
      {model: 'gpt-4o-mini-2024-07-18', expected: 'openai/gpt-4o-mini'},
      {model: 'o1-2024-12-17', expected: 'openai/o1'},
      {model: 'o1-mini-2024-09-12', expected: 'openai/o1-mini'},
      // Exception case
      {model: 'gpt-4o-2024-05-13', expected: 'openai/gpt-4o-2024-05-13'},
    ];

    testCases.forEach(({model, expected}) => {
      it(`should normalize ${model} to ${expected}`, async () => {
        const config: MeterConfig = {};
        const event: UsageEvent = {
          model,
          provider: 'openai',
          usage: {inputTokens: 100, outputTokens: 50},
          stripeCustomerId: 'cus_123',
        };

        await sendMeterEventsToStripe(mockStripe, config, event);

        const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
        expect(call.payload.model).toBe(expected);
      });
    });
  });

  describe('Anthropic Models', () => {
    const testCases = [
      {model: 'claude-opus-4-1', expected: 'anthropic/claude-opus-4.1'},
      {model: 'claude-opus-4', expected: 'anthropic/claude-opus-4'},
      {model: 'claude-sonnet-4', expected: 'anthropic/claude-sonnet-4'},
      {model: 'claude-3-7-sonnet', expected: 'anthropic/claude-3.7-sonnet'},
      {model: 'claude-3-7-sonnet-latest', expected: 'anthropic/claude-3.7-sonnet'},
      {model: 'claude-3-5-haiku', expected: 'anthropic/claude-3.5-haiku'},
      {model: 'claude-3-5-haiku-latest', expected: 'anthropic/claude-3.5-haiku'},
      {model: 'claude-3-haiku', expected: 'anthropic/claude-3-haiku'},
      // With date suffixes that should be removed
      {model: 'claude-opus-4-1-20241231', expected: 'anthropic/claude-opus-4.1'},
      {model: 'claude-3-5-sonnet-20241022', expected: 'anthropic/claude-3.5-sonnet'},
      {model: 'claude-3-5-haiku-20241022', expected: 'anthropic/claude-3.5-haiku'},
      {model: 'claude-3-haiku-20240307', expected: 'anthropic/claude-3-haiku'},
      // With latest suffixes that should be removed
      {model: 'claude-opus-4-latest', expected: 'anthropic/claude-opus-4'},
      {model: 'claude-sonnet-4-latest', expected: 'anthropic/claude-sonnet-4'},
    ];

    testCases.forEach(({model, expected}) => {
      it(`should normalize ${model} to ${expected}`, async () => {
        const config: MeterConfig = {};
        const event: UsageEvent = {
          model,
          provider: 'anthropic',
          usage: {inputTokens: 100, outputTokens: 50},
          stripeCustomerId: 'cus_123',
        };

        await sendMeterEventsToStripe(mockStripe, config, event);

        const call = mockStripe.v2.billing.meterEvents.create.mock.calls[0][0];
        expect(call.payload.model).toBe(expected);
      });
    });
  });
});

