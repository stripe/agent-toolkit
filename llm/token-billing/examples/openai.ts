/**
 * Sample Usage: OpenAI with Usage Tracking
 * This demonstrates how to use the generic token meter to automatically report
 * token usage to Stripe for billing purposes.
 */

import {config} from 'dotenv';
import {resolve} from 'path';
import OpenAI from 'openai';
import {createTokenMeter} from '..';

// Load .env from the examples folder
config({path: resolve(__dirname, '.env')});

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!;
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Initialize the OpenAI client (standard SDK)
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Create the token meter
const meter = createTokenMeter(STRIPE_API_KEY);

// Sample 1: Basic Chat Completion (non-streaming)
async function sampleBasicChatCompletion() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {role: 'user', content: 'Say "Hello, World!" and nothing else.'},
    ],
    max_tokens: 20,
  });

  // Track usage with the meter
  meter.trackUsage(response, STRIPE_CUSTOMER_ID);

  console.log('Response:', response.choices[0]?.message?.content);
  console.log('Usage:', response.usage);
}

// Sample 2: Streaming Chat Completion
async function sampleStreamingChatCompletion() {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {role: 'user', content: 'Count from 1 to 5, one number per line.'},
    ],
    stream: true,
    stream_options: {include_usage: true}, // Important for metering
    max_tokens: 50,
  });

  // Wrap the stream for metering
  const meteredStream = meter.trackUsageStreamOpenAI(stream, STRIPE_CUSTOMER_ID);

  let fullContent = '';
  for await (const chunk of meteredStream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullContent += content;
    process.stdout.write(content);
  }

  console.log('\n\nFull content:', fullContent);
}

// Sample 3: Chat Completion with Tools
async function sampleChatCompletionWithTools() {
  const tools: any[] = [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather in a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g. San Francisco, CA',
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
            },
          },
          required: ['location'],
        },
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{role: 'user', content: 'What is the weather in New York?'}],
    tools,
    max_tokens: 100,
  });

  // Track usage with the meter
  meter.trackUsage(response, STRIPE_CUSTOMER_ID);

  console.log(
    'Response:',
    JSON.stringify(response.choices[0]?.message, null, 2)
  );
  console.log('Usage:', response.usage);
}

// Sample 4: Streaming Chat Completion with Tools
async function sampleStreamingChatCompletionWithTools() {
  const tools: any[] = [
    {
      type: 'function',
      function: {
        name: 'calculate',
        description: 'Calculate a mathematical expression',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The mathematical expression to calculate',
            },
          },
          required: ['expression'],
        },
      },
    },
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{role: 'user', content: 'What is 25 * 4?'}],
    tools,
    stream: true,
    stream_options: {include_usage: true}, // Important for metering
    max_tokens: 100,
  });

  // Wrap the stream for metering
  const meteredStream = meter.trackUsageStreamOpenAI(stream, STRIPE_CUSTOMER_ID);

  const toolCalls = new Map<
    number,
    {id: string; name: string; arguments: string}
  >();

  for await (const chunk of meteredStream) {
    const choice = chunk.choices[0];

    // Handle tool calls
    if (choice?.delta?.tool_calls) {
      for (const toolCall of choice.delta.tool_calls) {
        const index = toolCall.index;
        if (index === undefined) continue;

        if (!toolCalls.has(index)) {
          toolCalls.set(index, {id: '', name: '', arguments: ''});
        }
        const tc = toolCalls.get(index)!;
        if (toolCall.id) tc.id = toolCall.id;
        if (toolCall.function?.name) tc.name = toolCall.function.name;
        if (toolCall.function?.arguments)
          tc.arguments += toolCall.function.arguments;
      }
    }

    // Print usage if available
    if (chunk.usage) {
      console.log('\nUsage in stream:', chunk.usage);
    }
  }

  console.log('\nTool calls:', Array.from(toolCalls.values()));
}

// Sample 5: Responses API (non-streaming)
async function sampleResponsesAPIBasic() {
  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: 'What is 2+2?',
    instructions: 'You are a helpful math assistant.',
    max_output_tokens: 50,
  });

  // Track usage with the meter
  meter.trackUsage(response, STRIPE_CUSTOMER_ID);

  console.log('Response:', JSON.stringify(response.output, null, 2));
  console.log('Usage:', response.usage);
}

// Sample 6: Responses API (streaming)
async function sampleResponsesAPIStreaming() {
  const stream = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: 'Tell me a fun fact about cats.',
    instructions: 'You are a helpful assistant.',
    stream: true,
    max_output_tokens: 100,
  });

  // Wrap the stream for metering
  const meteredStream = meter.trackUsageStreamOpenAI(stream, STRIPE_CUSTOMER_ID);

  let finalOutput: any = null;
  let finalUsage: any = null;

  for await (const event of meteredStream) {
    if (event.type === 'response.completed' && 'response' in event) {
      finalOutput = event.response.output;
      finalUsage = event.response.usage;
    }
  }

  console.log('Final output:', JSON.stringify(finalOutput, null, 2));
  console.log('Usage:', finalUsage);
}

// Sample 7: Responses API with parse (structured outputs)
async function sampleResponsesAPIParse() {
  // Note: The schema is defined inline in the API call
  // Zod is not needed for this example
  const response = await openai.responses.parse({
    model: 'gpt-4o-mini',
    input: 'What is 15 multiplied by 7?',
    instructions:
      'You are a helpful math assistant. Provide the answer and a brief explanation.',
    text: {
      format: {
        type: 'json_schema',
        name: 'math_response',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            answer: {type: 'number'},
            explanation: {type: 'string'},
          },
          required: ['answer', 'explanation'],
          additionalProperties: false,
        },
      },
    },
    max_output_tokens: 100,
  });

  // Track usage with the meter
  meter.trackUsage(response, STRIPE_CUSTOMER_ID);

  console.log('Parsed response:', response.output[0]);
  console.log('Usage:', response.usage);
}

// Sample 8: Embeddings
async function sampleEmbeddings() {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'The quick brown fox jumps over the lazy dog',
  });

  // Track usage with the meter
  meter.trackUsage(response, STRIPE_CUSTOMER_ID);

  console.log('Embedding dimensions:', response.data[0]?.embedding.length);
  console.log('First 5 values:', response.data[0]?.embedding.slice(0, 5));
  console.log('Usage:', response.usage);
}

// Sample 9: Multiple messages conversation
async function sampleConversation() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {role: 'system', content: 'You are a helpful assistant.'},
      {role: 'user', content: 'What is the capital of France?'},
      {role: 'assistant', content: 'The capital of France is Paris.'},
      {role: 'user', content: 'What is its population?'},
    ],
    max_tokens: 50,
  });

  // Track usage with the meter
  meter.trackUsage(response, STRIPE_CUSTOMER_ID);

  console.log('Response:', response.choices[0]?.message?.content);
  console.log('Usage:', response.usage);
}

// Run all samples
async function runAllSamples() {
  console.log('Starting OpenAI Usage Tracking Examples');
  console.log(
    'These examples show how to use the generic token meter with OpenAI\n'
  );

  try {
    await sampleBasicChatCompletion();
    await sampleStreamingChatCompletion();
    await sampleChatCompletionWithTools();
    await sampleStreamingChatCompletionWithTools();
    await sampleResponsesAPIBasic();
    await sampleResponsesAPIStreaming();
    await sampleResponsesAPIParse();
    await sampleEmbeddings();
    await sampleConversation();

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

