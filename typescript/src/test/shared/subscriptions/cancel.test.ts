import Stripe from 'stripe';
import cancelSubscriptionTool, {
  description as cancelDescription,
  parameters as cancelSubscriptionParameters,
  execute as cancelSubscription,
} from '@/shared/subscriptions/cancel';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  subscriptions: {
    cancel: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('cancel subscription description', () => {
  it('should return a description string', () => {
    const descriptionString = cancelDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('cancel a subscription in Stripe');
  });
});

describe('cancel subscription parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = cancelSubscriptionParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('subscription');
    expect(fields).toContain('invoice_now');
    expect(fields.length).toBe(2);
  });
});

describe('cancel subscription execute function', () => {
  it('should cancel a subscription and return it', async () => {
    const params = {
      subscription: 'sub_123456',
      invoice_now: true,
    };

    const mockSubscription = {
      id: 'sub_123456',
      status: 'canceled',
      customer: 'cus_123456',
    };

    const context = {};

    stripe.subscriptions.cancel.mockResolvedValue(mockSubscription);

    const result = await cancelSubscription(stripe, context, params);

    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith(
      params.subscription,
      {invoice_now: params.invoice_now},
      undefined
    );
    expect(result).toEqual(mockSubscription);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      subscription: 'sub_123456',
      invoice_now: true,
    };

    const mockSubscription = {
      id: 'sub_123456',
      status: 'canceled',
      customer: 'cus_123456',
    };

    const context = {
      account: 'acct_123456',
    };

    stripe.subscriptions.cancel.mockResolvedValue(mockSubscription);

    const result = await cancelSubscription(stripe, context, params);

    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith(
      params.subscription,
      {invoice_now: params.invoice_now},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockSubscription);
  });
});

describe('cancel subscription tool', () => {
  it('should generate proper tool object', () => {
    const cancelToolObj = cancelSubscriptionTool({});
    expect(cancelToolObj.method).toBe('cancel_subscription');
    expect(cancelToolObj.name).toBe('Cancel Subscription');
    expect(typeof cancelToolObj.description).toBe('string');
    expect(cancelToolObj.actions.subscriptions.update).toBe(true);
  });
});
