/**
 * Type definitions for Stripe AI SDK Provider
 */

/**
 * Settings for Stripe language models
 */
export interface StripeLanguageModelSettings {
  /**
   * Stripe customer ID to associate with usage.
   * Can be overridden per-call via providerOptions.
   */
  customerId?: string;

  /**
   * Additional custom headers to include in requests
   */
  headers?: Record<string, string>;
}

/**
 * Configuration for the Stripe provider
 */
export interface StripeProviderConfig {
  /**
   * Base URL for API calls (defaults to https://llm.stripe.com)
   */
  baseURL?: string;

  /**
   * Stripe API key for authentication
   */
  apiKey?: string;

  /**
   * Default Stripe customer ID to associate with usage
   */
  customerId?: string;

  /**
   * Custom headers for requests
   */
  headers?: Record<string, string>;
}

/**
 * Provider-specific options that can be passed at call time
 */
export interface StripeProviderOptions {
  /**
   * Override customer ID for this specific call
   */
  customerId?: string;

  /**
   * Additional headers for this specific call
   */
  headers?: Record<string, string>;
}

