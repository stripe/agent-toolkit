/**
 * Type definitions for AI SDK metering
 */

import type {Provider} from './meter-event-types';

/**
 * Configuration options for AI SDK metering
 */
export interface AIMeterConfig {
  /**
   * Stripe API key
   */
  stripeApiKey: string;

  /**
   * Stripe customer ID for meter events
   */
  stripeCustomerId: string;
}

/**
 * Usage information extracted from AI SDK responses
 */
export interface AIUsageInfo {
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

