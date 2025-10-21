/**
 * Type definitions for usage tracking
 */

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Usage event data that gets logged
 */
export interface UsageEvent {
  model: string;
  provider: string;
  usage: TokenUsage;
  stripeCustomerId?: string;
}

/**
 * Configuration options for Stripe integration
 */
export interface StripeConfig {
  /**
   * Stripe API key for billing
   */
  stripeApiKey: string;
  /**
   * Enable verbose logging of meter event payloads (default: false)
   */
  verbose?: boolean;
}

/**
 * Additional Stripe parameters that can be passed to API calls
 */
export interface StripeParams {
  /**
   * Stripe customer ID for this specific API call
   */
  stripeCustomerId?: string;
}
