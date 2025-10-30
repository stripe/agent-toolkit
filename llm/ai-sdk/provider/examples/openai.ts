/**
 * Example: Using Stripe AI SDK Provider with OpenAI models
 *
 * This example demonstrates how to use the Stripe provider to interact with
 * OpenAI models through Stripe's llm.stripe.com proxy for automatic usage tracking.
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
    console.warn('Warning: STRIPE_CUSTOMER_ID is not set. Some examples may fail.');
  }


  // Initialize the Stripe provider
  const stripeLLM = createStripe({
    apiKey: process.env.STRIPE_API_KEY!,
    customerId: process.env.STRIPE_CUSTOMER_ID, // Optional default customer ID
  });

  console.log('=== Example 1: Simple text generation with OpenAI GPT-5 ===\n');

  // Basic text generation
  const result1 = await generateText({
    model: stripeLLM('openai/gpt-5', {
      customerId: process.env.STRIPE_CUSTOMER_ID!, // Model-level customer ID
    }),
    prompt: 'What are the three primary colors?',
  });

  console.log('Response:', result1.text);
  console.log('Usage:', result1.usage);
  console.log('\n');

  console.log('=== Example 2: Streaming with GPT-4.1 ===\n');

  const streamPrompt = 'Explain how photosynthesis works in simple terms.';
  console.log(`Sending request with prompt: "${streamPrompt}"`);
  console.log(`Model: openai/gpt-4.1`);
  console.log(`Customer ID: ${process.env.STRIPE_CUSTOMER_ID}\n`);

  // Streaming response
  const result2 = await streamText({
    model: stripeLLM('openai/gpt-4.1'),
    prompt: streamPrompt,
    providerOptions: {
      stripe: {
        // Override customer ID for this specific call
        customerId: process.env.STRIPE_CUSTOMER_ID!,
      },
    },
  });

  console.log('Stream started, consuming chunks...');
  let chunkCount = 0;
  
  try {
    // Print streaming response using textStream (simple string chunks)
    for await (const chunk of result2.textStream) {
      chunkCount++;
      process.stdout.write(chunk);
    }
  } catch (streamError) {
    console.error('\n❌ Error during streaming:', streamError);
    throw streamError;
  }
  
  console.log(`\n\n(Received ${chunkCount} chunks)`);
  
  // Get usage and final text after stream completes
  const [finalText, usage] = await Promise.all([result2.text, result2.usage]);
  console.log('Final text length:', finalText.length);
  console.log('Usage:', usage);

  console.log('=== Example 3: Chat conversation with GPT-4.1-mini ===\n');

  // Multi-turn conversation
  const result3 = await generateText({
    model: stripeLLM('openai/gpt-4.1-mini', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    messages: [
      {role: 'user', content: 'What is the capital of France?'},
      {role: 'assistant', content: 'The capital of France is Paris.'},
      {role: 'user', content: 'What is its population?'},
    ],
  });

  console.log('Response:', result3.text);
  console.log('Usage:', result3.usage);
  console.log('\n');

  console.log('=== Example 4: Using OpenAI o3 reasoning model ===\n');

  // Using reasoning model
  const result4 = await generateText({
    model: stripeLLM('openai/o3', {
      customerId: process.env.STRIPE_CUSTOMER_ID!,
    }),
    prompt:
      'A farmer has 17 sheep. All but 9 die. How many sheep are left? Think through this step by step.',
  });

  console.log('Response:', result4.text);
  console.log('Usage:', result4.usage);
  console.log('\n');

  console.log('=== All examples completed! ===');
}

main().catch((error) => {
  console.error('\n❌ Error occurred:');
  console.error(error);
  process.exit(1);
});

