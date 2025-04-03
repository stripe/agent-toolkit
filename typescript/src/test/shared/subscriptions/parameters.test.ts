import {
  cancelSubscriptionParameters,
  listSubscriptionsParameters,
} from '@/shared/subscriptions/parameters';

describe('listSubscriptionsParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listSubscriptionsParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['customer', 'price', 'status', 'limit']);
    expect(fields.length).toBe(4);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = listSubscriptionsParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['price', 'status', 'limit']);
    expect(fields.length).toBe(3);
  });
});

describe('cancelSubscriptionParameters', () => {
  it('should return the correct parameters', () => {
    const parameters = cancelSubscriptionParameters({});
    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['subscriptionId']);
  });
});
