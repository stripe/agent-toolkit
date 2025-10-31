/**
 * Shared type definitions for metering
 */

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Usage event data that gets logged to Stripe
 */
export interface UsageEvent {
  model: string;
  provider: string;
  usage: TokenUsage;
  stripeCustomerId: string;
}

/**
 * Configuration options for Stripe integration
 */
export interface MeterConfig {}

/**
 * Provider identifier - any string representing the AI provider
 * Common values: 'openai', 'anthropic', 'google', 'azure', 'bedrock', etc.
 * The provider name is normalized to lowercase from the model's provider string.
 */
export type Provider = string;

