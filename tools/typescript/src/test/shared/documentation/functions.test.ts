import {searchDocumentation} from '@/shared/documentation/searchDocumentation';
import {z} from 'zod';
import {searchDocumentationParameters} from '@/shared/documentation/searchDocumentation';

const Stripe = jest.fn().mockImplementation(() => ({}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

const EXPECTED_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'fetch',
  'User-Agent': 'stripe-agent-toolkit-typescript',
};

describe('searchDocumentation', () => {
  it('should search for Stripe documentation and return sources', async () => {
    const question = 'How to create Stripe checkout session?';
    const requestBody: z.infer<
      ReturnType<typeof searchDocumentationParameters>
    > = {
      question: question,
      language: 'ruby',
    };

    const sources = [
      {
        type: 'docs',
        url: 'https://docs.stripe.com/payments/checkout/how-checkout-works',
        title: 'How checkout works',
        content: '...',
      },
    ];
    const mockResponse = {
      question: question,
      status: 'success',
      sources: sources,
    };

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    } as unknown as Response);

    const result = await searchDocumentation(stripe, {}, requestBody);

    expect(fetchMock).toHaveBeenCalledWith('https://ai.stripe.com/search', {
      method: 'POST',
      headers: EXPECTED_HEADERS,
      body: JSON.stringify(requestBody),
    });

    expect(result).toEqual(sources);
  });

  it('should return failure string if search failed', async () => {
    const question = 'What is the meaning of life?';
    const requestBody = {
      question: question,
    };

    const mockError = {
      error: 'Invalid query',
      message:
        'Unable to process your question. Please rephrase it to be more specific.',
    };

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce(mockError),
    } as unknown as Response);

    const result = await searchDocumentation(stripe, {}, requestBody);

    expect(fetchMock).toHaveBeenCalledWith('https://ai.stripe.com/search', {
      method: 'POST',
      headers: EXPECTED_HEADERS,
      body: JSON.stringify(requestBody),
    });

    expect(result).toEqual('Failed to search documentation');
  });
});
