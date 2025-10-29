/**
 * Sample Usage: Vercel AI SDK with Google Gemini and Stripe Billing
 * 
 * This demonstrates how to use the meteredModel wrapper to automatically
 * report token usage to Stripe for billing purposes when using Google's Gemini via the Vercel AI SDK.
 */

import {config} from 'dotenv';
import {resolve} from 'path';
import {google} from '@ai-sdk/google';
import {generateText, streamText} from 'ai';
import {meteredModel} from '..';

// Load .env from the examples folder
config({path: resolve(__dirname, '.env')});

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!;
const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

if (
  !STRIPE_API_KEY ||
  !STRIPE_CUSTOMER_ID ||
  !GOOGLE_GENERATIVE_AI_API_KEY
) {
  throw new Error(
    'STRIPE_API_KEY, STRIPE_CUSTOMER_ID, and GOOGLE_GENERATIVE_AI_API_KEY environment variables are required'
  );
}

// Sample 1: Basic generateText with Gemini
async function sampleBasicGenerateText() {
  console.log('\n=== Sample 1: Basic generateText with Gemini ===');

  const model = meteredModel(
    google('gemini-2.5-flash'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    prompt: 'Say "Hello, World!" and nothing else.',
  });

  console.log('Response:', text);
}

// Sample 2: Streaming text with Gemini
async function sampleStreamText() {
  console.log('\n=== Sample 2: Stream Text with Gemini ===');

  const model = meteredModel(
    google('gemini-2.5-flash'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const result = streamText({
    model: model,
    prompt: 'Count from 1 to 5, one number per line.',
  });

  let fullText = '';
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    fullText += chunk;
  }

  console.log('\n\nFull text:', fullText);
}

// Sample 3: With system message
async function sampleWithSystemMessage() {
  console.log('\n=== Sample 3: With System Message ===');

  const model = meteredModel(
    google('gemini-2.5-flash'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    system: 'You are a helpful assistant that explains things simply.',
    prompt: 'What is photosynthesis?',
  });

  console.log('Response:', text);
}

// Sample 4: Multi-turn conversation
async function sampleConversation() {
  console.log('\n=== Sample 4: Multi-turn Conversation ===');

  const model = meteredModel(
    google('gemini-2.5-flash'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    messages: [
      {role: 'user', content: 'What is 10 + 15?'},
      {role: 'assistant', content: '10 + 15 equals 25.'},
      {role: 'user', content: 'And if I multiply that by 2?'},
    ],
  });

  console.log('Response:', text);
}

// Sample 5: Longer response
async function sampleLongerResponse() {
  console.log('\n=== Sample 5: Longer Response ===');

  const model = meteredModel(
    google('gemini-2.5-flash'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    prompt: 'Explain the theory of relativity in simple terms.',
  });

  console.log('Response:', text);
}

// Sample 6: Stream with temperature control
async function sampleStreamWithTemperature() {
  console.log('\n=== Sample 6: Stream with Temperature Control ===');

  const model = meteredModel(
    google('gemini-2.5-flash'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const result = streamText({
    model: model,
    prompt: 'Write a creative short story opener.',
    temperature: 0.9, // Higher temperature for more creativity
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n');
}

// Run all samples
async function runAllSamples() {
  console.log(
    'Starting Vercel AI SDK + Google Gemini + Stripe Metering Examples'
  );
  console.log(
    'These examples show how to use meteredModel with Google Gemini models\n'
  );

  try {
    await sampleBasicGenerateText();
    await sampleStreamText();
    await sampleWithSystemMessage();
    await sampleConversation();
    await sampleLongerResponse();
    await sampleStreamWithTemperature();

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

