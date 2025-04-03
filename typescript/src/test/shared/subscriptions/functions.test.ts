import {
  cancelSubscription,
  listSubscriptions,
} from '@/shared/subscriptions/functions';

const Stripe = jest.fn().mockImplementation(() => ({
  subscriptions: {
    list: jest.fn(),
    cancel: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('listSubscriptions', () => {
  it('should list subscriptions and return data', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_123456',
        customer: 'cus_123456',
        status: 'active',
        current_period_start: 1609459200, // 2021-01-01
        current_period_end: 1612137600, // 2021-02-01
        items: {
          data: [
            {
              id: 'si_123',
              price: 'price_123',
              quantity: 1,
            },
          ],
        },
      },
      {
        id: 'sub_789012',
        customer: 'cus_123456',
        status: 'canceled',
        current_period_start: 1609459200, // 2021-01-01
        current_period_end: 1612137600, // 2021-02-01
        items: {
          data: [
            {
              id: 'si_456',
              price: 'price_456',
              quantity: 2,
            },
          ],
        },
      },
    ];

    const context = {};
    const params = {};

    stripe.subscriptions.list.mockResolvedValue({data: mockSubscriptions});
    const result = await listSubscriptions(stripe, context, params);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockSubscriptions);
  });

  it('should add customer from context if provided', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_123456',
        customer: 'cus_123456',
        status: 'active',
        current_period_start: 1609459200,
        current_period_end: 1612137600,
        items: {
          data: [
            {
              id: 'si_123',
              price: 'price_123',
              quantity: 1,
            },
          ],
        },
      },
    ];

    const context = {
      customer: 'cus_123456',
    };
    const params = {};

    stripe.subscriptions.list.mockResolvedValue({data: mockSubscriptions});
    const result = await listSubscriptions(stripe, context, params);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith(
      {customer: 'cus_123456'},
      undefined
    );
    expect(result).toEqual(mockSubscriptions);
  });

  it('should specify the connected account if included in context', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_123456',
        customer: 'cus_123456',
        status: 'active',
        current_period_start: 1609459200,
        current_period_end: 1612137600,
        items: {
          data: [
            {
              id: 'si_123',
              price: 'price_123',
              quantity: 1,
            },
          ],
        },
      },
    ];

    const context = {
      account: 'acct_123456',
    };
    const params = {};

    stripe.subscriptions.list.mockResolvedValue({data: mockSubscriptions});
    const result = await listSubscriptions(stripe, context, params);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockSubscriptions);
  });

  it('should handle errors gracefully', async () => {
    const context = {};
    const params = {};

    stripe.subscriptions.list.mockRejectedValue(new Error('API Error'));
    const result = await listSubscriptions(stripe, context, params);

    expect(result).toBe('Failed to list subscriptions');
  });
});

describe('cancelSubscription', () => {
  it('should cancel a subscription and return the result', async () => {
    const mockSubscription = {
      id: 'sub_123456',
      customer: 'cus_123456',
      status: 'active',
      current_period_start: 1609459200,
      current_period_end: 1612137600,
      items: {
        data: [
          {
            id: 'si_123',
            price: 'price_123',
            quantity: 1,
          },
        ],
      },
    };

    const context = {};
    const params = {
      subscriptionId: 'sub_123456',
    };

    stripe.subscriptions.cancel.mockResolvedValue(mockSubscription);
    const result = await cancelSubscription(stripe, context, params);

    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith(
      'sub_123456',
      {},
      undefined
    );
    expect(result).toEqual(mockSubscription);
  });

  it('should handle errors gracefully', async () => {
    const context = {};
    const params = {
      subscriptionId: 'sub_123456',
    };

    stripe.subscriptions.cancel.mockRejectedValue(new Error('API Error'));
    const result = await cancelSubscription(stripe, context, params);

    expect(result).toBe('Failed to cancel subscription');
  });
});
