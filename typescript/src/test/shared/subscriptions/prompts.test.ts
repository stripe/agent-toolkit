import {
  listSubscriptionsPrompt,
  cancelSubscriptionPrompt,
} from '@/shared/subscriptions/prompts';

describe('listSubscriptionsPrompt', () => {
  it('should return the correct prompt with no context', () => {
    const prompt = listSubscriptionsPrompt({});

    expect(prompt).toContain('This tool will list all subscriptions in Stripe');
    expect(prompt).toContain('four arguments');
    expect(prompt).toContain('- customer (str, optional)');
    expect(prompt).toContain('- price (str, optional)');
    expect(prompt).toContain('- status (str, optional)');
    expect(prompt).toContain('- limit (int, optional)');
  });

  it('should return the correct prompt with customer in context', () => {
    const prompt = listSubscriptionsPrompt({customer: 'cus_123'});

    expect(prompt).toContain('This tool will list all subscriptions in Stripe');
    expect(prompt).toContain('three arguments');
    expect(prompt).not.toContain('- customer (str, optional)');
    expect(prompt).toContain('- price (str, optional)');
    expect(prompt).toContain('- status (str, optional)');
    expect(prompt).toContain('- limit (int, optional)');
  });
});

describe('cancelSubscriptionPrompt', () => {
  it('should return the correct prompt', () => {
    const prompt = cancelSubscriptionPrompt({});

    expect(prompt).toContain('This tool will cancel a subscription in Stripe');
    expect(prompt).toContain('- subscriptionId (str, required)');
  });
});
