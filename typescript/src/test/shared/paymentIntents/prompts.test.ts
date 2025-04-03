import {listPaymentIntentsPrompt} from '@/shared/paymentIntents/prompts';

describe('listPaymentIntentsPrompt', () => {
  it('should return the correct prompt', () => {
    const prompt = listPaymentIntentsPrompt();
    expect(prompt).toContain('customer');
  });

  it('should return the correct prompt when no customer is specified', () => {
    const prompt = listPaymentIntentsPrompt({});
    expect(prompt).toContain('- customer (str, optional)');
  });

  it('should return the correct prompt when a customer is specified', () => {
    const prompt = listPaymentIntentsPrompt({customer: 'cus_123'});
    expect(prompt).toContain('context: cus_123');
    expect(prompt).not.toContain('- customer (str, optional)');
  });
});
