/**
 * Example: Using Stripe AI SDK Provider with Anthropic Claude models
 *
 * This example demonstrates how to use the Stripe provider to interact with
 * Anthropic Claude models through Stripe's llm.stripe.com proxy for automatic usage tracking.
 */

import {config} from 'dotenv';
import {resolve} from 'path';
import {generateText, streamText} from 'ai';
import {createStripe} from '..';

// Load .env from the examples folder
config({path: resolve(__dirname, '.env')});

async function main() {
  // Check environment variables
  if (!process.env.STRIPE_API_KEY) {
    throw new Error('STRIPE_API_KEY environment variable is not set. Please set it in examples/.env');
  }
  if (!process.env.STRIPE_CUSTOMER_ID) {
    throw new Error('STRIPE_CUSTOMER_ID environment variable is not set. Please set it in examples/.env');
  }


  // Initialize the Stripe provider
  const stripe = createStripe({
    apiKey: process.env.STRIPE_API_KEY!,
    customerId: process.env.STRIPE_CUSTOMER_ID!, // Default customer ID
  });

  console.log('=== Example 1: Simple text generation with Claude Sonnet 4 ===\n');

  // Basic text generation
  const result1 = await generateText({
    model: stripe('anthropic/claude-sonnet-4'),
    prompt: 'Explain quantum computing in simple terms.',
  });

  console.log('Response:', result1.text);
  console.log('Usage:', result1.usage);
  console.log('\n');

  console.log('=== Example 2: Streaming with Claude Opus 4 ===\n');

  // Streaming response with the most capable Claude model
  const result2 = await streamText({
    model: stripe('anthropic/claude-opus-4', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt: 'Write a poem about the ocean and its mysteries.',
  });

  // Print streaming response
  for await (const chunk of result2.textStream) {
    process.stdout.write(chunk);
  }
  console.log('\n\n');

  console.log('=== Example 3: Chat conversation with Claude 3.7 Sonnet ===\n');

  // Multi-turn conversation
  const result3 = await generateText({
    model: stripe('anthropic/claude-3-7-sonnet', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    messages: [
      {role: 'user', content: 'What is the Turing test?'},
      {
        role: 'assistant',
        content:
          'The Turing test is a test of a machine\'s ability to exhibit intelligent behavior equivalent to, or indistinguishable from, that of a human.',
      },
      {role: 'user', content: 'Who created it?'},
    ],
  });

  console.log('Response:', result3.text);
  console.log('Usage:', result3.usage);
  console.log('\n');

  console.log('=== Example 4: Using Claude 3.5 Haiku for quick responses ===\n');

  // Using the fastest Claude model
  const result4 = await generateText({
    model: stripe('anthropic/claude-3-5-haiku', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt: 'What are the benefits of functional programming?',
    temperature: 0.5,
  });

  console.log('Response:', result4.text);
  console.log('Usage:', result4.usage);
  console.log('\n');

  console.log('=== Example 5: Complex reasoning with Claude Opus 4.1 ===\n');

  // Complex reasoning task
  const result5 = await generateText({
    model: stripe('anthropic/claude-opus-4-1', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt:
      'Design a simple algorithm to solve the traveling salesman problem. Explain your approach and its time complexity.',
    temperature: 0.7,
  });

  console.log('Response:', result5.text);
  console.log('Usage:', result5.usage);
  console.log('\n');

  console.log('=== Example 6: Per-call customer ID override ===\n');

  // Override customer ID for a specific call
  const result7 = await generateText({
    model: stripe('anthropic/claude-3-haiku'),
    prompt: 'What is the speed of light?',
    providerOptions: {
      stripe: {
        customerId: 'cus_specific_customer', // Override the default customer ID
      },
    },
  });

  console.log('Response:', result7.text);
  console.log('Usage:', result7.usage);
  console.log('\n');

  console.log('=== All examples completed! ===');
}

main().catch((error) => {
  console.error('\n❌ Error occurred:');
  console.error(error);
  process.exit(1);
});

