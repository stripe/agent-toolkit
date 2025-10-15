import Stripe from 'stripe'
import type { TokenUsage, UsageEvent, StripeConfig, StripeParams } from './types'

/**
 * Extract Stripe parameters from API call parameters
 */
export function extractStripeParams<T>(body: T & StripeParams): {
  providerParams: T
  stripeCustomerId?: string
} {
  const { stripeCustomerId, ...providerParams } = body as any
  return {
    providerParams: providerParams as T,
    stripeCustomerId,
  }
}

/**
 * Normalize token usage from OpenAI response format to our standard format
 */
export function normalizeUsage(usage: any): TokenUsage {
  return {
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
  }
}

/**
 * Normalize usage for the Responses API format
 */
export function normalizeResponsesUsage(usage: any): TokenUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
  }
}

function logMeterEventPayload(payload: any): void {
  console.log('='.repeat(80))
  console.log('STRIPE METER EVENT')
  console.log('='.repeat(80))
  console.log(JSON.stringify(payload, null, 2))
  console.log('='.repeat(80) + '\n')
}

async function sendMeterEventsToStripe(config: StripeConfig, event: UsageEvent): Promise<void> {
  if (!event.stripeCustomerId) {
    return
  }

  const stripe = new Stripe(config.stripeApiKey, {
    apiVersion: '2025-09-30.preview' as any,
  })

  const timestamp = new Date().toISOString()
  
  try {
    if (event.usage.inputTokens > 0) {
      const inputPayload = {
        event_name: 'token-billing-tokens',
        timestamp,
        payload: {
          stripe_customer_id: event.stripeCustomerId,
          value: event.usage.inputTokens.toString(),
          model: event.provider + '/' + event.model,
          token_type: 'input',
        },
      }
      await stripe.v2.billing.meterEvents.create(inputPayload)
      
      if (config.verbose) {
        logMeterEventPayload(inputPayload)
      }
    }

    if (event.usage.outputTokens > 0) {
      const outputPayload = {
        event_name: 'token-billing-tokens',
        timestamp,
        payload: {
          stripe_customer_id: event.stripeCustomerId,
          value: event.usage.outputTokens.toString(),
          model: event.provider + '/' + event.model,
          token_type: 'output',
        },
      }
      await stripe.v2.billing.meterEvents.create(outputPayload)
      
      if (config.verbose) {
        logMeterEventPayload(outputPayload)
      }
    }
  } catch (error) {
    console.error('Error sending meter events to Stripe:', error)
  }
}

export function logUsageEvent(
  config: StripeConfig,
  event: UsageEvent
): void {
  sendMeterEventsToStripe(config, event).catch(err => {
    console.error('Failed to send meter events to Stripe:', err)
  })
}


