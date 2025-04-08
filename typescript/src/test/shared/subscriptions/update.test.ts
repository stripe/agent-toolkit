import Stripe from 'stripe';
import updateSubscriptionTool, {
  description as updateDescription,
  parameters as updateSubscriptionParameters,
  execute as updateSubscription,
} from '@/shared/subscriptions/update';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  subscriptions: {
    update: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('update subscription description', () => {
  it('should return a description string', () => {
    const descriptionString = updateDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('update a subscription in Stripe');
  });
});

describe('update subscription parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = updateSubscriptionParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('subscription');
    expect(fields).toContain('metadata');
    expect(fields).toContain('items');
    expect(fields).toContain('cancel_at_period_end');
    expect(fields.length).toBe(4);
  });
});

describe('update subscription execute function', () => {
  it('should update a subscription and return it', async () => {
    const params = {
      subscription: 'sub_123456',
      metadata: {
        order_id: 'order_123456',
      },
      cancel_at_period_end: true,
    };

    const mockSubscription = {
      id: 'sub_123456',
      status: 'active',
      metadata: {
        order_id: 'order_123456',
      },
      cancel_at_period_end: true,
      customer: 'cus_123456',
    };

    const context = {};

    stripe.subscriptions.update.mockResolvedValue(mockSubscription);

    const result = await updateSubscription(stripe, context, params);

    expect(stripe.subscriptions.update).toHaveBeenCalledWith(
      params.subscription,
      {
        metadata: params.metadata,
        cancel_at_period_end: params.cancel_at_period_end,
      },
      undefined
    );
    expect(result).toEqual(mockSubscription);
  });

  it('should update a subscription with items', async () => {
    const params = {
      subscription: 'sub_123456',
      items: [
        {
          id: 'si_123456',
          quantity: 2,
        },
        {
          price: 'price_123456',
          quantity: 1,
        },
      ],
    };

    const mockSubscription = {
      id: 'sub_123456',
      status: 'active',
      items: {
        data: [
          {
            id: 'si_123456',
            quantity: 2,
          },
          {
            id: 'si_789012',
            price: {id: 'price_123456'},
            quantity: 1,
          },
        ],
      },
      customer: 'cus_123456',
    };

    const context = {};

    stripe.subscriptions.update.mockResolvedValue(mockSubscription);

    const result = await updateSubscription(stripe, context, params);

    expect(stripe.subscriptions.update).toHaveBeenCalledWith(
      params.subscription,
      {
        items: params.items,
      },
      undefined
    );
    expect(result).toEqual(mockSubscription);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      subscription: 'sub_123456',
      cancel_at_period_end: true,
    };

    const mockSubscription = {
      id: 'sub_123456',
      status: 'active',
      cancel_at_period_end: true,
      customer: 'cus_123456',
    };

    const context = {
      account: 'acct_123456',
    };

    stripe.subscriptions.update.mockResolvedValue(mockSubscription);

    const result = await updateSubscription(stripe, context, params);

    expect(stripe.subscriptions.update).toHaveBeenCalledWith(
      params.subscription,
      {
        cancel_at_period_end: params.cancel_at_period_end,
      },
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockSubscription);
  });
});

describe('update subscription tool', () => {
  it('should generate proper tool object', () => {
    const updateToolObj = updateSubscriptionTool({});
    expect(updateToolObj.method).toBe('update_subscription');
    expect(updateToolObj.name).toBe('Update Subscription');
    expect(typeof updateToolObj.description).toBe('string');
    expect(updateToolObj.actions.subscriptions.update).toBe(true);
  });
});
