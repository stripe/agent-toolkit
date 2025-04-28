import {searchDocumentationParameters} from '@/shared/documentation/searchDocumentation';

describe('searchDocumentationParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = searchDocumentationParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['question', 'language']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = searchDocumentationParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['question', 'language']);
    expect(fields.length).toBe(2);
  });
});
