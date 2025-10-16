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

/**
 * Normalize model names to match Stripe's approved model list
 */
function normalizeModelName(provider: string, model: string): string {
  if (provider === 'anthropic') {
    // Remove date suffix (YYYYMMDD format at the end)
    model = model.replace(/-\d{8}$/, '')
    
    // Remove -latest suffix
    model = model.replace(/-latest$/, '')
    
    // Convert version number dashes to dots anywhere in the name
    // Match patterns like claude-3-7, opus-4-1, sonnet-4-5, etc.
    // This will convert any sequence of word-digit-digit to word-digit.digit
    model = model.replace(/(-[a-z]+)?-(\d+)-(\d+)/g, '$1-$2.$3')
    
    return model
  }
  
  if (provider === 'openai') {
    // Exception: keep gpt-4o-2024-05-13 as is
    if (model === 'gpt-4o-2024-05-13') {
      return model
    }
    
    // Remove date suffix in format -YYYY-MM-DD
    model = model.replace(/-\d{4}-\d{2}-\d{2}$/, '')
    
    return model
  }
  
  // For other providers (google), return as is
  return model
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

  const stripe = new Stripe(config.stripeApiKey)

  const timestamp = new Date().toISOString()
  
  // Normalize the model name before sending to Stripe
  const normalizedModel = normalizeModelName(event.provider, event.model)
  const fullModelName = event.provider + '/' + normalizedModel
  
  try {
    if (event.usage.inputTokens > 0) {
      const inputPayload = {
        event_name: 'token-billing-tokens',
        timestamp,
        payload: {
          stripe_customer_id: event.stripeCustomerId,
          value: event.usage.inputTokens.toString(),
          model: fullModelName,
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
          model: fullModelName,
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


