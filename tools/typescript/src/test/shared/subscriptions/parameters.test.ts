import {listSubscriptionsParameters} from '@/shared/subscriptions/listSubscriptions';
import {cancelSubscriptionParameters} from '@/shared/subscriptions/cancelSubscription';
import {updateSubscriptionParameters} from '@/shared/subscriptions/updateSubscription';

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
    expect(fields).toEqual(['subscription']);
  });
});

describe('updateSubscriptionParameters', () => {
  it('should return the correct parameters', () => {
    const parameters = updateSubscriptionParameters({});
    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['subscription', 'proration_behavior', 'items']);
  });

  it('should have the required subscription parameter', () => {
    const parameters = updateSubscriptionParameters({});
    expect(parameters.shape.subscription).toBeDefined();
  });

  it('should have the optional parameters defined', () => {
    const parameters = updateSubscriptionParameters({});
    expect(parameters.shape.proration_behavior).toBeDefined();
    expect(parameters.shape.items).toBeDefined();
  });
});
