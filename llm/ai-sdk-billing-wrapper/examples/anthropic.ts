/**
 * Sample Usage: Vercel AI SDK with Anthropic and Stripe Billing
 * 
 * This demonstrates how to use the meteredModel wrapper to automatically
 * report token usage to Stripe for billing purposes when using Anthropic via the Vercel AI SDK.
 */

import {config} from 'dotenv';
import {resolve} from 'path';
import {anthropic} from '@ai-sdk/anthropic';
import {generateText, streamText} from 'ai';
import {meteredModel} from '..';

config({path: resolve(__dirname, '.env')});

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

if (!STRIPE_API_KEY || !STRIPE_CUSTOMER_ID || !ANTHROPIC_API_KEY) {
  throw new Error(
    'STRIPE_API_KEY, STRIPE_CUSTOMER_ID, and ANTHROPIC_API_KEY environment variables are required'
  );
}

// Sample 1: Basic generateText with Claude
async function sampleBasicGenerateText() {
  console.log('\n=== Sample 1: Basic generateText with Claude ===');

  const model = meteredModel(
    anthropic('claude-3-5-sonnet-20241022'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    prompt: 'Say "Hello, World!" and nothing else.',
  });

  console.log('Response:', text);
}

// Sample 2: Streaming text with Claude
async function sampleStreamText() {
  console.log('\n=== Sample 2: Stream Text with Claude ===');

  const model = meteredModel(
    anthropic('claude-3-5-sonnet-20241022'),
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
    anthropic('claude-3-5-sonnet-20241022'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    system: 'You are a helpful assistant that is concise and to the point.',
    prompt: 'What is the capital of France?',
  });

  console.log('Response:', text);
}

// Sample 4: Multi-turn conversation
async function sampleConversation() {
  console.log('\n=== Sample 4: Multi-turn Conversation ===');

  const model = meteredModel(
    anthropic('claude-3-5-sonnet-20241022'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    messages: [
      {role: 'user', content: 'Who is Sachin Tendulkar?'},
      {
        role: 'assistant',
        content: 'Sachin Tendulkar is a legendary Indian cricketer.',
      },
      {role: 'user', content: 'What are his major achievements?'},
    ],
  });

  console.log('Response:', text);
}

// Sample 5: Using Claude Haiku (faster, cheaper model)
async function sampleClaudeHaiku() {
  console.log('\n=== Sample 5: Using Claude Haiku ===');

  const model = meteredModel(
    anthropic('claude-3-5-haiku-20241022'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const {text} = await generateText({
    model: model,
    prompt: 'Explain quantum computing in one sentence.',
  });

  console.log('Response:', text);
}

// Sample 6: Stream with max tokens
async function sampleStreamWithMaxTokens() {
  console.log('\n=== Sample 6: Stream with Max Tokens ===');

  const model = meteredModel(
    anthropic('claude-3-5-sonnet-20241022'),
    STRIPE_API_KEY,
    STRIPE_CUSTOMER_ID
  );

  const result = streamText({
    model: model,
    prompt: 'Write a short story about a robot.',
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n');
}

// Run all samples
async function runAllSamples() {
  console.log('Starting Vercel AI SDK + Anthropic + Stripe Metering Examples');
  console.log(
    'These examples show how to use meteredModel with Anthropic models\n'
  );

  try {
    await sampleBasicGenerateText();
    await sampleStreamText();
    await sampleWithSystemMessage();
    await sampleConversation();
    await sampleClaudeHaiku();
    await sampleStreamWithMaxTokens();

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

