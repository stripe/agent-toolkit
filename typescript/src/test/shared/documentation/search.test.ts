import Stripe from 'stripe';
import searchDocumentationTool, {
  description as searchDescription,
  parameters as searchDocumentationParameters,
  execute as searchDocumentation,
} from '@/shared/documentation/search';

// Mock fetch
global.fetch = jest.fn();

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
  jest.clearAllMocks();
});

describe('search documentation description', () => {
  it('should return a description string', () => {
    const descriptionString = searchDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain(
      'search and retrieve relevant Stripe documentation'
    );
  });
});

describe('search documentation parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = searchDocumentationParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('question');
    expect(fields).toContain('language');
    expect(fields.length).toBe(2);
  });

  it('should require the question parameter', () => {
    const parameters = searchDocumentationParameters({});
    expect(parameters.shape.question.isOptional()).toBe(false);
  });

  it('should have optional language parameter', () => {
    const parameters = searchDocumentationParameters({});
    expect(parameters.shape.language.isOptional()).toBe(true);
  });
});

describe('search documentation execute function', () => {
  it('should search documentation and return sources', async () => {
    const params = {
      question: 'How do I create a customer in Stripe?',
      language: 'node' as const,
    };

    const mockSources = [
      {
        title: 'Creating a customer',
        url: 'https://stripe.com/docs/api/customers/create',
        text: 'You can create a customer object to store information about your customer',
      },
    ];

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({sources: mockSources}),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const context = {};

    const result = await searchDocumentation(stripe, context, params);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://ai.stripe.com/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
          'User-Agent': 'stripe-agent-toolkit-typescript',
        }),
        body: JSON.stringify(params),
      })
    );

    expect(result).toEqual(mockSources);
  });

  it('should handle errors gracefully', async () => {
    const params = {
      question: 'How do I create a customer in Stripe?',
    };

    const mockResponse = {
      ok: false,
      status: 500,
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const context = {};

    const result = await searchDocumentation(stripe, context, params);

    expect(result).toBe('Failed to search documentation');
  });

  it('should use the correct User-Agent for modelcontextprotocol mode', async () => {
    const params = {
      question: 'How do I create a customer in Stripe?',
    };

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({sources: []}),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const context = {
      mode: 'modelcontextprotocol' as const,
    };

    await searchDocumentation(stripe, context, params);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://ai.stripe.com/search',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'stripe-mcp',
        }),
      })
    );
  });
});

describe('search documentation tool', () => {
  it('should generate proper tool object', () => {
    const searchToolObj = searchDocumentationTool({});
    expect(searchToolObj.method).toBe('search_documentation');
    expect(searchToolObj.name).toBe('Search Documentation');
    expect(typeof searchToolObj.description).toBe('string');
    expect(searchToolObj.actions.documentation.read).toBe(true);
  });
});
