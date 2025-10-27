/**
 * Example: Using Stripe AI SDK Provider with Google Gemini models
 *
 * This example demonstrates how to use the Stripe provider to interact with
 * Google Gemini models through Stripe's llm.stripe.com proxy for automatic usage tracking.
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
  
  console.log('Environment check passed ✓');
  console.log(`API Key: ${process.env.STRIPE_API_KEY.substring(0, 7)}...`);
  console.log(`Customer ID: ${process.env.STRIPE_CUSTOMER_ID}\n`);

  // Initialize the Stripe provider
  const stripe = createStripe({
    apiKey: process.env.STRIPE_API_KEY!,
    customerId: process.env.STRIPE_CUSTOMER_ID!, // Default customer ID
  });

  console.log('=== Example 1: Simple text generation with Gemini 2.5 Pro ===\n');

  // Basic text generation
  const result1 = await generateText({
    model: stripe('google/gemini-2.5-pro'),
    prompt: 'What are the main differences between Python and JavaScript?',
  });

  console.log('Response:', result1.text);
  console.log('Usage:', result1.usage);
  console.log('\n');

  console.log('=== Example 2: Streaming with Gemini 2.5 Flash ===\n');

  // Streaming response with the faster Gemini model
  const result2 = await streamText({
    model: stripe('google/gemini-2.5-flash', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt: 'Write a short story about a robot learning to paint.',
  });

  // Print streaming response
  for await (const chunk of result2.textStream) {
    process.stdout.write(chunk);
  }
  console.log('\n\n');

  console.log('=== Example 3: Chat conversation with Gemini 2.0 Flash ===\n');

  // Multi-turn conversation
  const result3 = await generateText({
    model: stripe('google/gemini-2.0-flash'),
    messages: [
      {role: 'user', content: 'What is machine learning?'},
      {
        role: 'assistant',
        content:
          'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.',
      },
      {role: 'user', content: 'Can you give me an example?'},
    ],
    providerOptions: {
      stripe: {
        customerId: process.env.STRIPE_CUSTOMER_ID!,
      },
    },
  });

  console.log('Response:', result3.text);
  console.log('Usage:', result3.usage);
  console.log('\n');

  console.log('=== Example 4: Using Gemini 2.5 Flash Lite for quick responses ===\n');

  // Using the lite model for faster, cheaper responses
  const result4 = await generateText({
    model: stripe('google/gemini-2.5-flash-lite', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt: 'List 5 programming languages.',
    temperature: 0.3,
  });

  console.log('Response:', result4.text);
  console.log('Usage:', result4.usage);
  console.log('\n');

  console.log('=== Example 5: Long-form content with Gemini 2.5 Pro ===\n');

  // Long-form content generation
  const result5 = await generateText({
    model: stripe('google/gemini-2.5-pro', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt:
      'Write a detailed explanation of how neural networks work, suitable for beginners.',
    temperature: 0.7,
  });

  console.log('Response:', result5.text);
  console.log('Usage:', result5.usage);
  console.log('\n');

  console.log('=== Example 6: Streaming with custom headers ===\n');

  // Custom headers example (if needed for specific use cases)
  const stripeWithHeaders = createStripe({
    apiKey: process.env.STRIPE_API_KEY!,
    customerId: process.env.STRIPE_CUSTOMER_ID!,
    headers: {
      'X-Custom-Header': 'custom-value',
    },
  });

  const result6 = await streamText({
    model: stripeWithHeaders('google/gemini-2.5-flash'),
    prompt: 'Count from 1 to 10.',
  });

  for await (const chunk of result6.textStream) {
    process.stdout.write(chunk);
  }
  console.log('\n\n');

  console.log('=== All examples completed! ===');
}

main().catch((error) => {
  console.error('\n❌ Error occurred:');
  console.error(error);
  process.exit(1);
});

