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

const mockLogUsageEvent =
  meterEventLogging.logUsageEvent as jest.MockedFunction<
    typeof meterEventLogging.logUsageEvent
  >;

describe('Gemini ChatSession - Non-streaming', () => {
  let client: StripeTrackedGoogleGenerativeAI;
  let stripeConfig: StripeConfig;
  let mockModel: any;
  let mockChat: any;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    mockChat = {
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Hello!',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        },
      }),
      sendMessageStream: jest.fn(),
      getHistory: jest.fn().mockResolvedValue([]),
    };

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn().mockReturnValue(mockChat),
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

  it('should track token usage for chat message', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await chat.sendMessage({
      message: 'Hello',
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
    const chat = model.startChat();

    await chat.sendMessage('Hello');

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: undefined,
      })
    );
  });

  it('should handle object request with stripeCustomerId', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await chat.sendMessage({
      message: 'Hello',
      stripeCustomerId: 'cus_456',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        stripeCustomerId: 'cus_456',
      })
    );
  });

  it('should normalize Gemini usage including reasoning tokens', async () => {
    mockChat.sendMessage.mockResolvedValue({
      response: {
        text: () => 'Hello!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          thoughtsTokenCount: 2,
          totalTokenCount: 17,
        },
      },
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await chat.sendMessage({
      message: 'Hello',
      stripeCustomerId: 'cus_123',
    });

    expect(mockLogUsageEvent).toHaveBeenCalledWith(stripeConfig, {
      model: 'gemini-1.5-pro',
      provider: 'google',
      usage: {
        inputTokens: 10,
        outputTokens: 7, // 5 + 2 reasoning tokens
      },
      stripeCustomerId: 'cus_123',
    });
  });

  it('should track usage on errors', async () => {
    mockChat.sendMessage.mockRejectedValue(new Error('API Error'));

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await expect(
      chat.sendMessage({
        message: 'Hello',
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
    mockChat.sendMessage.mockResolvedValue({
      response: {
        text: () => 'Hello!',
      },
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await chat.sendMessage({
      message: 'Hello',
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

  it('should call underlying chat sendMessage with string', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await chat.sendMessage({
      message: 'Hello world',
      stripeCustomerId: 'cus_123',
    });

    expect(mockChat.sendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('should pass through startChat parameters', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const history = [{role: 'user', parts: [{text: 'Hi'}]}];

    model.startChat({history});

    expect(mockModel.startChat).toHaveBeenCalledWith({history});
  });
});

describe('Gemini ChatSession - Streaming', () => {
  let client: StripeTrackedGoogleGenerativeAI;
  let stripeConfig: StripeConfig;
  let mockModel: any;
  let mockChat: any;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeConfig = {
      stripeApiKey: 'sk_test_123',
    };

    mockChat = {
      sendMessage: jest.fn(),
      sendMessageStream: jest.fn(),
      getHistory: jest.fn().mockResolvedValue([]),
    };

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn().mockReturnValue(mockChat),
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

  it('should track token usage from streaming chat', async () => {
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

    mockChat.sendMessageStream.mockResolvedValue({
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
    const chat = model.startChat();

    const result = await chat.sendMessageStream({
      message: 'Hello',
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

    mockChat.sendMessageStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'Hello world'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    const result = await chat.sendMessageStream({
      message: 'Hello',
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

  it('should extract usage from stream chunks', async () => {
    const mockStream = createMockStream([
      {text: () => 'First', usageMetadata: null},
      {
        text: () => ' Second',
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 10,
          totalTokenCount: 30,
        },
      },
    ]);

    mockChat.sendMessageStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'First Second'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    const result = await chat.sendMessageStream({
      message: 'Hello',
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
          outputTokens: 10,
        },
      })
    );
  });

  it('should handle streams without usage data', async () => {
    const mockStream = createMockStream([
      {text: () => 'Hello', usageMetadata: null},
      {text: () => ' world', usageMetadata: null},
    ]);

    mockChat.sendMessageStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'Hello world'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    const result = await chat.sendMessageStream({
      message: 'Hello',
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

    mockChat.sendMessageStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve({text: () => 'Hello'}),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    const result = await chat.sendMessageStream('Hello');

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

    mockChat.sendMessageStream.mockResolvedValue({
      stream: mockStream,
      response: Promise.resolve(responseData),
    });

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    const result = await chat.sendMessageStream({
      message: 'Hello',
      stripeCustomerId: 'cus_123',
    });

    const response = await result.response;
    expect(response).toEqual(responseData);
  });

  it('should track usage on stream errors', async () => {
    mockChat.sendMessageStream.mockRejectedValue(new Error('Stream error'));

    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    await expect(
      chat.sendMessageStream({
        message: 'Hello',
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

describe('Gemini ChatSession - getHistory', () => {
  let client: StripeTrackedGoogleGenerativeAI;
  let mockModel: any;
  let mockChat: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const history = [
      {role: 'user', parts: [{text: 'Hello'}]},
      {role: 'model', parts: [{text: 'Hi there!'}]},
    ];

    mockChat = {
      sendMessage: jest.fn(),
      sendMessageStream: jest.fn(),
      getHistory: jest.fn().mockResolvedValue(history),
    };

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn().mockReturnValue(mockChat),
      countTokens: jest.fn(),
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

  it('should pass through getHistory calls', async () => {
    const model = client.getGenerativeModel({model: 'gemini-1.5-pro'});
    const chat = model.startChat();

    const result = await chat.getHistory();

    expect(mockChat.getHistory).toHaveBeenCalled();
    expect(result).toEqual([
      {role: 'user', parts: [{text: 'Hello'}]},
      {role: 'model', parts: [{text: 'Hi there!'}]},
    ]);
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
