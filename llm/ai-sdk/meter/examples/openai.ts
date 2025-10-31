/**
 * Sample Usage: Vercel AI SDK with OpenAI and Stripe Billing
 * 
 * This demonstrates how to use the meteredModel wrapper to automatically
 * report token usage to Stripe for billing purposes when using the Vercel AI SDK.
 */

import {config} from 'dotenv';
import {resolve} from 'path';
import {openai} from '@ai-sdk/openai';
import {generateText, streamText} from 'ai';
import {meteredModel} from '..';

config({path: resolve(__dirname, '.env')});

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (!STRIPE_API_KEY || !STRIPE_CUSTOMER_ID || !OPENAI_API_KEY) {
  throw new Error(
    'STRIPE_API_KEY, STRIPE_CUSTOMER_ID, and OPENAI_API_KEY environment variables are required'
  );
}

// Sample 1: Basic generateText with OpenAI
async function sampleBasicGenerateText() {
  console.log('\n=== Sample 1: Basic generateText ===');

  // Wrap the AI SDK model with metering
  const model = meteredModel(openai('gpt-4o-mini'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const {text} = await generateText({
    model: model,
    prompt: 'Say "Hello, World!" and nothing else.',
  });

  console.log('Response:', text);
}

// Sample 2: Streaming text with OpenAI
async function sampleStreamText() {
  console.log('\n=== Sample 2: Stream Text ===');

  const model = meteredModel(openai('gpt-4o-mini'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const result = streamText({
    model: model,
    prompt: 'Count from 1 to 5, one number per line.',
  });

  // Consume the stream
  let fullText = '';
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    fullText += chunk;
  }

  console.log('\n\nFull text:', fullText);
}

// Sample 3: Generate text with system message
async function sampleWithSystemMessage() {
  console.log('\n=== Sample 3: With System Message ===');

  const model = meteredModel(openai('gpt-4o-mini'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const {text} = await generateText({
    model: model,
    system: 'You are a helpful assistant that speaks like a pirate.',
    prompt: 'Tell me about the weather.',
  });

  console.log('Response:', text);
}

// Sample 4: Multi-turn conversation
async function sampleConversation() {
  console.log('\n=== Sample 4: Multi-turn Conversation ===');

  const model = meteredModel(openai('gpt-4o-mini'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const {text} = await generateText({
    model: model,
    messages: [
      {role: 'user', content: 'What is 2 + 2?'},
      {role: 'assistant', content: '2 + 2 equals 4.'},
      {role: 'user', content: 'What about 4 + 4?'},
    ],
  });

  console.log('Response:', text);
}

// Sample 5: Generate text with max tokens
async function sampleWithMaxTokens() {
  console.log('\n=== Sample 5: With Max Tokens ===');

  const model = meteredModel(openai('gpt-4o-mini'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const {text} = await generateText({
    model: model,
    prompt: 'Write a short story about a robot.',
    maxOutputTokens: 100,
  });

  console.log('Response:', text);
}

// Sample 6: Using GPT-4
async function sampleGPT4() {
  console.log('\n=== Sample 6: Using GPT-4 ===');

  const model = meteredModel(openai('gpt-4'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const {text} = await generateText({
    model: model,
    prompt: 'Explain quantum computing in one sentence.',
  });

  console.log('Response:', text);
}

// Sample 7: Stream with system message
async function sampleStreamWithSystem() {
  console.log('\n=== Sample 7: Stream with System Message ===');

  const model = meteredModel(openai('gpt-4o-mini'), STRIPE_API_KEY, STRIPE_CUSTOMER_ID);

  const result = streamText({
    model: model,
    system: 'You are a helpful math tutor.',
    prompt: 'Explain how to solve 2x + 5 = 13',
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n');
}

// Run all samples
async function runAllSamples() {
  console.log('Starting Vercel AI SDK + Stripe Metering Examples');
  console.log(
    'These examples show how to use meteredModel with the Vercel AI SDK\n'
  );

  try {
    await sampleBasicGenerateText();
    await sampleStreamText();
    await sampleWithSystemMessage();
    await sampleConversation();
    await sampleWithMaxTokens();
    await sampleGPT4();
    await sampleStreamWithSystem();

    console.log('\n' + '='.repeat(80));
    console.log('All examples completed successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Sample failed:', error);
    throw error;
  }
}

// Run the samples
runAllSamples().catch(console.error);


