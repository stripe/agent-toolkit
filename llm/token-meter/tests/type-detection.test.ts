/**
 * Tests for type detection utilities
 */

import {
  detectResponse,
  isGeminiStream,
  extractUsageFromChatStream,
  extractUsageFromResponseStream,
  extractUsageFromAnthropicStream,
} from '../utils/type-detection';

describe('detectResponse - OpenAI Chat Completions', () => {
  it('should detect OpenAI chat completion response', () => {
    const response = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello!',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('openai');
    expect(detected?.type).toBe('chat_completion');
    expect(detected?.model).toBe('gpt-4');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should handle missing usage data in chat completion', () => {
    const response = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello!',
          },
          finish_reason: 'stop',
        },
      ],
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.inputTokens).toBe(0);
    expect(detected?.outputTokens).toBe(0);
  });

  it('should handle partial usage data', () => {
    const response = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello!',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(0);
  });
});

describe('detectResponse - OpenAI Responses API', () => {
  it('should detect OpenAI responses API response', () => {
    const response = {
      id: 'resp_123',
      object: 'response',
      created: Date.now(),
      model: 'gpt-4',
      output: 'Hello!',
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('openai');
    expect(detected?.type).toBe('response_api');
    expect(detected?.model).toBe('gpt-4');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should return null for responses API with empty usage', () => {
    const response = {
      id: 'resp_123',
      object: 'response',
      created: Date.now(),
      model: 'gpt-4',
      output: 'Hello!',
      usage: {},
    };

    const detected = detectResponse(response);

    // Empty usage object doesn't match the type guard, so returns null
    expect(detected).toBeNull();
  });
});

describe('detectResponse - OpenAI Embeddings', () => {
  it('should detect OpenAI embedding response', () => {
    const response = {
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: [0.1, 0.2, 0.3],
          index: 0,
        },
      ],
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: 8,
        total_tokens: 8,
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('openai');
    expect(detected?.type).toBe('embedding');
    expect(detected?.model).toBe('text-embedding-ada-002');
    expect(detected?.inputTokens).toBe(8);
    expect(detected?.outputTokens).toBe(0); // Embeddings don't have output tokens
  });

  it('should handle missing usage data in embeddings', () => {
    const response = {
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: [0.1, 0.2, 0.3],
          index: 0,
        },
      ],
      model: 'text-embedding-ada-002',
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.inputTokens).toBe(0);
    expect(detected?.outputTokens).toBe(0);
  });
});

describe('detectResponse - Anthropic Messages', () => {
  it('should detect Anthropic message response', () => {
    const response = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{type: 'text', text: 'Hello!'}],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('anthropic');
    expect(detected?.type).toBe('chat_completion');
    expect(detected?.model).toBe('claude-3-5-sonnet-20241022');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should return null for Anthropic messages with empty usage', () => {
    const response = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{type: 'text', text: 'Hello!'}],
      model: 'claude-3-opus-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {},
    };

    const detected = detectResponse(response);

    // Empty usage object doesn't match the type guard, so returns null
    expect(detected).toBeNull();
  });
});

describe('detectResponse - Gemini', () => {
  it('should detect Gemini response', () => {
    const response = {
      response: {
        text: () => 'Hello!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
        modelVersion: 'gemini-1.5-pro',
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('google');
    expect(detected?.type).toBe('chat_completion');
    expect(detected?.model).toBe('gemini-1.5-pro');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should include reasoning tokens in output for extended thinking models', () => {
    const response = {
      response: {
        text: () => 'Hello!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          thoughtsTokenCount: 3, // Reasoning tokens
          totalTokenCount: 18,
        },
        modelVersion: 'gemini-1.5-pro',
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.outputTokens).toBe(8); // 5 + 3 reasoning tokens
  });

  it('should return null when usageMetadata is missing', () => {
    const response = {
      response: {
        text: () => 'Hello!',
      },
    };

    const detected = detectResponse(response);

    // Missing usageMetadata doesn't match the type guard, so returns null
    expect(detected).toBeNull();
  });

  it('should use default model name when modelVersion is missing', () => {
    const response = {
      response: {
        text: () => 'Hello!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      },
    };

    const detected = detectResponse(response);

    expect(detected).not.toBeNull();
    expect(detected?.model).toBe('gemini');
  });
});

describe('detectResponse - Unknown types', () => {
  it('should return null for unknown response types', () => {
    const response = {
      some: 'data',
      that: 'does not match any provider',
    };

    const detected = detectResponse(response);

    expect(detected).toBeNull();
  });

  it('should return null for null input', () => {
    const detected = detectResponse(null);

    expect(detected).toBeNull();
  });

  it('should return null for undefined input', () => {
    const detected = detectResponse(undefined);

    expect(detected).toBeNull();
  });
});

describe('isGeminiStream', () => {
  it('should detect Gemini stream structure', () => {
    const geminiStream = {
      stream: {
        [Symbol.asyncIterator]: function* () {
          yield {text: () => 'test'};
        },
      },
      response: Promise.resolve({}),
    };

    expect(isGeminiStream(geminiStream)).toBe(true);
  });

  it('should return false for OpenAI-style streams', () => {
    const openaiStream = {
      tee: () => [{}, {}],
      toReadableStream: () => {},
    };

    expect(isGeminiStream(openaiStream)).toBe(false);
  });

  it('should return false for non-stream objects', () => {
    expect(isGeminiStream({})).toBe(false);
    // null and undefined return falsy values which coerce to false in boolean context
    expect(isGeminiStream(null)).toBeFalsy();
    expect(isGeminiStream(undefined)).toBeFalsy();
  });
});

describe('extractUsageFromChatStream', () => {
  it('should extract usage from OpenAI chat stream', async () => {
    const chunks = [
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {content: 'Hello'},
            finish_reason: null,
          },
        ],
      },
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    };

    const detected = await extractUsageFromChatStream(mockStream as any);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('openai');
    expect(detected?.model).toBe('gpt-4');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should handle streams without usage data', async () => {
    const chunks = [
      {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {content: 'Hello'},
            finish_reason: 'stop',
          },
        ],
      },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    };

    const detected = await extractUsageFromChatStream(mockStream as any);

    expect(detected).not.toBeNull();
    expect(detected?.inputTokens).toBe(0);
    expect(detected?.outputTokens).toBe(0);
  });

  it('should handle stream errors gracefully', async () => {
    const mockStream = {
      async *[Symbol.asyncIterator]() {
        throw new Error('Stream error');
      },
    };

    const detected = await extractUsageFromChatStream(mockStream as any);

    expect(detected).toBeNull();
  });
});

describe('extractUsageFromResponseStream', () => {
  it('should extract usage from OpenAI Responses API stream', async () => {
    const chunks = [
      {
        type: 'response.output_text.delta',
        delta: 'Hello',
      },
      {
        type: 'response.done',
        response: {
          id: 'resp_123',
          model: 'gpt-4',
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        },
      },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    };

    const detected = await extractUsageFromResponseStream(mockStream as any);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('openai');
    expect(detected?.type).toBe('response_api');
    expect(detected?.model).toBe('gpt-4');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should handle streams without usage data', async () => {
    const chunks = [
      {
        type: 'response.output_text.delta',
        delta: 'Hello',
      },
      {
        type: 'response.done',
        response: {
          id: 'resp_123',
          model: 'gpt-4',
        },
      },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    };

    const detected = await extractUsageFromResponseStream(mockStream as any);

    expect(detected).not.toBeNull();
    expect(detected?.inputTokens).toBe(0);
    expect(detected?.outputTokens).toBe(0);
  });
});

describe('extractUsageFromAnthropicStream', () => {
  it('should extract usage from Anthropic stream', async () => {
    const chunks = [
      {
        type: 'message_start',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'claude-3-opus-20240229',
          usage: {
            input_tokens: 10,
            output_tokens: 0,
          },
        },
      },
      {
        type: 'content_block_start',
        index: 0,
        content_block: {type: 'text', text: ''},
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {type: 'text_delta', text: 'Hello'},
      },
      {
        type: 'message_delta',
        delta: {stop_reason: 'end_turn'},
        usage: {
          output_tokens: 5,
        },
      },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    };

    const detected = await extractUsageFromAnthropicStream(mockStream as any);

    expect(detected).not.toBeNull();
    expect(detected?.provider).toBe('anthropic');
    expect(detected?.model).toBe('claude-3-opus-20240229');
    expect(detected?.inputTokens).toBe(10);
    expect(detected?.outputTokens).toBe(5);
  });

  it('should handle streams without usage data', async () => {
    const chunks = [
      {
        type: 'message_start',
        message: {
          id: 'msg_123',
          model: 'claude-3-opus-20240229',
          usage: {},
        },
      },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    };

    const detected = await extractUsageFromAnthropicStream(mockStream as any);

    expect(detected).not.toBeNull();
    expect(detected?.inputTokens).toBe(0);
    expect(detected?.outputTokens).toBe(0);
  });
});

