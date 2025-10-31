/**
 * Sample Usage: Gemini with Usage Tracking
 * This demonstrates how to use the generic token meter to automatically report
 * token usage to Stripe for billing purposes with Google Gemini.
 */

import {config} from 'dotenv';
import {resolve} from 'path';
import {GoogleGenerativeAI, SchemaType} from '@google/generative-ai';
import {createTokenMeter} from '..';

// Load .env from the examples folder
config({path: resolve(__dirname, '.env')});

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!;
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

// Initialize the standard GoogleGenerativeAI client (no wrapper needed!)
const genAI = new GoogleGenerativeAI(GOOGLE_GENERATIVE_AI_API_KEY);

// Create the token meter
const meter = createTokenMeter(STRIPE_API_KEY);

// Sample 1: Basic Text Generation (non-streaming)
async function sampleBasicGeneration() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const result = await model.generateContent(
    'Say "Hello, World!" and nothing else.'
  );

  // Meter the response - auto-detects it's Gemini!
  meter.trackUsage(result, STRIPE_CUSTOMER_ID);

  const response = result.response;
  console.log('Response:', response.text());
  console.log('Usage:', response.usageMetadata);
}

// Sample 2: Streaming Text Generation
async function sampleStreamingGeneration() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const streamResult = await model.generateContentStream(
    'Count from 1 to 5, one number per line.'
  );

  // Wrap the stream for metering - Gemini requires model name
  const meteredStream = meter.trackUsageStreamGemini(
    streamResult,
    STRIPE_CUSTOMER_ID,
    'gemini-2.0-flash-exp'
  );

  let fullText = '';
  for await (const chunk of meteredStream.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    process.stdout.write(chunkText);
  }

  console.log('\n\nFull text:', fullText);
  console.log('Usage:', (await meteredStream.response).usageMetadata);
}

// Sample 3: Function Calling
async function sampleFunctionCalling() {
  const tools = [
    {
      functionDeclarations: [
        {
          name: 'get_weather',
          description: 'Get the current weather in a location',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              location: {
                type: SchemaType.STRING,
                description: 'The city and state, e.g. San Francisco, CA',
              } as any,
              unit: {
                type: SchemaType.STRING,
                enum: ['celsius', 'fahrenheit'],
                description: 'The unit of temperature',
              } as any,
            },
            required: ['location'],
          },
        },
      ],
    },
  ];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools,
  });

  const result = await model.generateContent('What is the weather in New York?');

  // Meter the response - auto-detects it's Gemini!
  meter.trackUsage(result, STRIPE_CUSTOMER_ID);

  const response = result.response;
  console.log(
    'Response:',
    JSON.stringify(response.candidates?.[0]?.content, null, 2)
  );
  console.log('Usage:', response.usageMetadata);
}

// Sample 4: System Instructions
async function sampleSystemInstructions() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: 'You are a helpful assistant that speaks like a pirate.',
  });

  const result = await model.generateContent(
    'Tell me about Paris in 2 sentences.'
  );

  // Meter the response - auto-detects it's Gemini!
  meter.trackUsage(result, STRIPE_CUSTOMER_ID);

  const response = result.response;
  console.log('Response:', response.text());
  console.log('Usage:', response.usageMetadata);
}

// Sample 5: Multi-turn Chat
async function sampleMultiTurnChat() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const chat = model.startChat({
    history: [
      {role: 'user', parts: [{text: 'What is the capital of France?'}]},
      {role: 'model', parts: [{text: 'The capital of France is Paris.'}]},
    ],
  });

  const result = await chat.sendMessage('What is its population?');

  // Meter the response - auto-detects it's Gemini!
  meter.trackUsage(result, STRIPE_CUSTOMER_ID);

  console.log('Response:', result.response.text());
  console.log('Usage:', result.response.usageMetadata);
}

// Run all samples
async function runAllSamples() {
  console.log('Starting Gemini Usage Tracking Examples');
  console.log(
    'These examples show how to use the generic meter with Gemini and Stripe billing\n'
  );

  try {
    console.log('\n' + '='.repeat(80));
    console.log('Sample 1: Basic Text Generation');
    console.log('='.repeat(80));
    await sampleBasicGeneration();

    console.log('\n' + '='.repeat(80));
    console.log('Sample 2: Streaming Text Generation');
    console.log('='.repeat(80));
    await sampleStreamingGeneration();

    console.log('\n' + '='.repeat(80));
    console.log('Sample 3: Function Calling');
    console.log('='.repeat(80));
    await sampleFunctionCalling();

    console.log('\n' + '='.repeat(80));
    console.log('Sample 4: System Instructions');
    console.log('='.repeat(80));
    await sampleSystemInstructions();

    console.log('\n' + '='.repeat(80));
    console.log('Sample 5: Multi-turn Chat');
    console.log('='.repeat(80));
    await sampleMultiTurnChat();

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

