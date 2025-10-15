/**
 * Sample Usage: Gemini with Usage Tracking
 * This demonstrates how to use the GoogleGenerativeAI wrapper to automatically report
 * token usage to Stripe for billing purposes.
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@stripe/agent-toolkit/ingestion'
import { SchemaType } from '@google/generative-ai'

// Load environment variables from .env file
const STRIPE_API_KEY = process.env.STRIPE_API_KEY!
const STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// Initialize the GoogleGenerativeAI client with Stripe configuration
const genAI = new GoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  stripe: {
    stripeApiKey: STRIPE_API_KEY,
    verbose: true,  // Enable verbose logging to see Stripe meter event payloads
  },
})

// Sample 1: Basic Text Generation (non-streaming)
async function sampleBasicGeneration() {  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
  })
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'Say "Hello, World!" and nothing else.' }] }],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  const response = result.response
  console.log('Response:', response.text())
  console.log('Usage:', response.usageMetadata)
}

// Sample 2: Streaming Text Generation
async function sampleStreamingGeneration() {  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
  })
  
  const result = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: 'Count from 1 to 5, one number per line.' }] }],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  let fullText = ''
  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    fullText += chunkText
    process.stdout.write(chunkText)
  }
  
  console.log('\n\nFull text:', fullText)
  console.log('Usage:', (await result.response).usageMetadata)
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
              },
              unit: {
                type: SchemaType.STRING,
                enum: ['celsius', 'fahrenheit'],
                description: 'The unit of temperature',
              },
            },
            required: ['location'],
          },
        },
      ],
    },
  ]
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    tools,
  })
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'What is the weather in New York?' }] }],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  const response = result.response
  console.log('Response:', JSON.stringify(response.candidates?.[0]?.content, null, 2))
  console.log('Usage:', response.usageMetadata)
}

// Sample 4: System Instructions
async function sampleSystemInstructions() {  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: 'You are a helpful assistant that speaks like a pirate.',
  })
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'Tell me about Paris in 2 sentences.' }] }],
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  const response = result.response
  console.log('Response:', response.text())
  console.log('Usage:', response.usageMetadata)
}

// Sample 5: Multi-turn Chat
async function sampleMultiTurnChat() {  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
  })
  
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'What is the capital of France?' }] },
      { role: 'model', parts: [{ text: 'The capital of France is Paris.' }] },
    ],
  })
  
  const result = await chat.sendMessage({
    message: 'What is its population?',
    stripeCustomerId: STRIPE_CUSTOMER_ID,
  })
  
  console.log('Response:', result.response.text())
  console.log('Usage:', result.response.usageMetadata)
}

// Run all samples
async function runAllSamples() {
  console.log('Starting Gemini Usage Tracking Examples')
  console.log('These examples show how to use GoogleGenerativeAI with Stripe billing\n')
  
  try {
    await sampleBasicGeneration()
    await sampleStreamingGeneration()
    await sampleFunctionCalling()
    await sampleSystemInstructions()
    await sampleMultiTurnChat()
    
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

