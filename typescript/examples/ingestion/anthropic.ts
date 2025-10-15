/**
 * Sample Usage: Anthropic with Usage Tracking
 * This demonstrates how to use the Anthropic wrapper to automatically report
 * token usage to Stripe for billing purposes.
 */

import 'dotenv/config'
import { Anthropic } from '@stripe/agent-toolkit/ingestion'

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

// Initialize the Anthropic client with Stripe configuration
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  stripe: {
    stripeApiKey: STRIPE_API_KEY,
    verbose: true,  // Enable verbose logging to see Stripe meter event payloads
  },
})

// Sample 1: Basic Message Completion (non-streaming)
async function sampleBasicMessage() {
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 20,
    messages: [
      { role: 'user', content: 'Say "Hello, World!" and nothing else.' }
    ],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  console.log('Response:', response.content[0])
  console.log('Usage:', response.usage)
}

// Sample 2: Streaming Message Completion
async function sampleStreamingMessage() {
  
  const stream = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 50,
    messages: [
      { role: 'user', content: 'Count from 1 to 5, one number per line.' }
    ],
    stream: true,
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  let fullContent = ''
  
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const content = event.delta.text
      fullContent += content
      process.stdout.write(content)
    }
  }
  
  console.log('\n\nFull content:', fullContent)
}

// Sample 3: Message with Tools
async function sampleMessageWithTools() {
  
  const tools: any[] = [
    {
      name: 'get_weather',
      description: 'Get the current weather in a location',
      input_schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit of temperature',
          },
        },
        required: ['location'],
      },
    },
  ]
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [
      { role: 'user', content: 'What is the weather in New York?' }
    ],
    tools,
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  console.log('Response:', JSON.stringify(response.content, null, 2))
  console.log('Usage:', response.usage)
}

// Sample 4: Message with System Prompt
async function sampleMessageWithSystem() {
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 50,
    system: 'You are a helpful assistant that speaks like a pirate.',
    messages: [
      { role: 'user', content: 'Tell me about Paris.' }
    ],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  console.log('Response:', response.content[0])
  console.log('Usage:', response.usage)
}

// Sample 5: Multi-turn Conversation
async function sampleConversation() {
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 50,
    messages: [
      { role: 'user', content: 'What is the capital of France?' },
      { role: 'assistant', content: 'The capital of France is Paris.' },
      { role: 'user', content: 'What is its population?' },
    ],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  console.log('Response:', response.content[0])
  console.log('Usage:', response.usage)
}

// Run all samples
async function runAllSamples() {
  console.log('Starting Anthropic Usage Tracking Examples')
  console.log('These examples show how to use TrackedAnthropic with Stripe billing\n')
  
  try {
    await sampleBasicMessage()
    await sampleStreamingMessage()
    await sampleMessageWithTools()
    await sampleMessageWithSystem()
    await sampleConversation()
    
    console.log('\n' + '='.repeat(80))
    console.log('All examples completed successfully!')
    console.log('='.repeat(80))
  } catch (error) {
    console.error('\n❌ Sample failed:', error)
    throw error
  }
}

// Run the samples
runAllSamples().catch(console.error)

