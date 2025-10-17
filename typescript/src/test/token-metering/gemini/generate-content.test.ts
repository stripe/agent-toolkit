import {GoogleGenerativeAI} from '@google/generative-ai';
import StripeTrackedGoogleGenerativeAI from '@/token-metering/gemini';
import type {StripeConfig} from '@/token-metering/types';
import * as meterEventLogging from '@/token-metering/meter-event-logging';

// Mock dependencies
jest.mock('stripe');
jest.mock('@google/generative-ai');
jest.mock('@/token-metering/meter-event-logging', () => ({
  ...jest.requireActual('@/token-metering/meter-event-logging'),
  logUsageEvent: jest.fn(),
}));

const mockLogUsageEvent = meterEventLogging.logUsageEvent as jest.MockedFunction<
  typeof meterEventLogging.logUsageEvent
>;

describe('Gemini GenerateContent - Non-streaming', () => {
  let client: StripeTrackedGoogleGenerativeAI;
  let stripeConfig: StripeConfig;
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Hello!',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        },
      }),
      generateContentStream: jest.fn(),
      startChat: jest.fn(),
      countTokens: jest.fn(),
    };

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue(mockModel);

    client = new StripeTrackedGoogleGenerativeAI({
      apiKey: 'test-api-key',
      stripe: stripeConfig,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage for successful generation', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await model.generateContent({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should handle string request with no stripeCustomerId', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await model.generateContent('Hello');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: undefined,
      })
    );
  });

  it('should handle object request with stripeCustomerId', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await model.generateContent({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_456',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: 'cus_456',
      })
    );
  });

  it('should normalize Gemini usage and add reasoning tokens', async () => {
    mockModel.generateContent.mockResolvedValue({
      response: {
        text: () => 'Hello!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          thoughtsTokenCount: 3, // Reasoning tokens
          totalTokenCount: 18,
        },
      },
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await model.generateContent({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 10,
        outputTokens: 8, // 5 + 3 reasoning tokens
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should track usage on errors', async () => {
    mockModel.generateContent.mockRejectedValue(new Error('API Error'));

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await expect(
      model.generateContent({
        contents: [{role: 'user', parts: [{text: 'Hello'}]}],
        stripeCustomerId: 'cus_123',
      })
    ).rejects.toThrow('API Error');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should handle missing usageMetadata', async () => {
    mockModel.generateContent.mockResolvedValue({
      response: {
        text: () => 'Hello!',
      },
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await model.generateContent({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should call underlying model generateContent with correct parameters', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await model.generateContent({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      generationConfig: {temperature: 0.7},
      stripeCustomerId: 'cus_123',
    });

    expect(mockModel.generateContent).toHaveBeenCalledWith({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      generationConfig: {temperature: 0.7},
    });
  });
});

describe('Gemini GenerateContent - Streaming', () => {
  let client: StripeTrackedGoogleGenerativeAI;
  let stripeConfig: StripeConfig;
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn(),
      countTokens: jest.fn(),
    };

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue(mockModel);

    client = new StripeTrackedGoogleGenerativeAI({
      apiKey: 'test-api-key',
      stripe: stripeConfig,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track token usage from streaming response', async () => {
    const mockStream = createMockStream([
      {
        text: () => 'Hello',
        usageMetadata: null,
      },
      {
        text: () => ' world',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      },
    ]);

    mockModel.generateContentStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({
        text: () => 'Hello world',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      }),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    // Consume the stream
    for await (const chunk of result.stream) {
      // Process chunks
    }

    // Wait for background processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 10,
        outputTokens: 5,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should wrap the stream generator properly', async () => {
    const chunks = [
      {text: () => 'Hello', usageMetadata: null},
      {
        text: () => ' world',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      },
    ];

    const mockStream = createMockStream(chunks);

    mockModel.generateContentStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'Hello world'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    const receivedChunks: any[] = [];
    for await (const chunk of result.stream) {
      receivedChunks.push(chunk);
    }

    expect(receivedChunks).toHaveLength(2);
    expect(receivedChunks[0].text()).toBe('Hello');
    expect(receivedChunks[1].text()).toBe(' world');
  });

  it('should extract usage from final chunk with usageMetadata', async () => {
    const mockStream = createMockStream([
      {text: () => 'First', usageMetadata: null},
      {text: () => ' Second', usageMetadata: null},
      {
        text: () => ' Third',
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 15,
          totalTokenCount: 35,
        },
      },
    ]);

    mockModel.generateContentStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'First Second Third'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    for await (const chunk of result.stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        usage: {
          inputTokens: 20,
          outputTokens: 15,
        },
      })
    );
  });

  it('should handle streams without usage data', async () => {
    const mockStream = createMockStream([
      {text: () => 'Hello', usageMetadata: null},
      {text: () => ' world', usageMetadata: null},
    ]);

    mockModel.generateContentStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'Hello world'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    for await (const chunk of result.stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should preserve response promise', async () => {
    const mockStream = createMockStream([
      {
        text: () => 'Hello',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      },
    ]);

    const responseData = {
      text: () => 'Hello world',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 5,
        totalTokenCount: 15,
      },
    };

    mockModel.generateContentStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve(responseData),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      stripeCustomerId: 'cus_123',
    });

    const response = await result.response;
    expect(response).toEqual(responseData);
  });

  it('should handle string request', async () => {
    const mockStream = createMockStream([
      {
        text: () => 'Hello',
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 2,
          totalTokenCount: 7,
        },
      },
    ]);

    mockModel.generateContentStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'Hello'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.generateContentStream('Hello');

    for await (const chunk of result.stream) {
      // Consume stream
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: undefined,
      })
    );
  });

  it('should track usage on stream errors', async () => {
    mockModel.generateContentStream.mockRejectedValue(
      new Error('Stream error')
    );

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    await expect(
      model.generateContentStream({
        contents: [{role: 'user', parts: [{text: 'Hello'}]}],
        stripeCustomerId: 'cus_123',
      })
    ).rejects.toThrow('Stream error');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      stripeCustomerId: 'cus_123',
    });
  });
});

describe('Gemini Model - countTokens', () => {
  let client: StripeTrackedGoogleGenerativeAI;
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn(),
      countTokens: jest.fn().mockResolvedValue({totalTokens: 10}),
    };

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue(mockModel);

    client = new StripeTrackedGoogleGenerativeAI({
      apiKey: 'test-api-key',
      stripe: {
        stripeApiKey: 'sk_test_123',
      },
    });
  });

  it('should pass through countTokens calls', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});

    const result = await model.countTokens('Hello world');

    expect(mockModel.countTokens).toHaveBeenCalledWith('Hello world');
    expect(result).toEqual({totalTokens: 10});
  });
});

// Helper functions to create mock streams
function createMockStream(chunks: any[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

function createMockStreamWithError(error: Error) {
  return {
    async *[Symbol.asyncIterator]() {
      throw error;
    },
  };
}

