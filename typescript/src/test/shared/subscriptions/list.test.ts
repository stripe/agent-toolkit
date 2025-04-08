import Stripe from 'stripe';
import listSubscriptionsTool, {
  description as listDescription,
  parameters as listSubscriptionsParameters,
  execute as listSubscriptions,
} from '@/shared/subscriptions/list';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  subscriptions: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('list subscriptions description', () => {
  it('should return a description string', () => {
    const descriptionString = listDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('list subscriptions in Stripe');
  });

  it('should customize based on context', () => {
    const descriptionWithContext = listDescription({
      customer: 'cus_123456',
    });
    expect(descriptionWithContext).toContain(
      'customer is already set in the context'
    );
  });
});

describe('list subscriptions parameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listSubscriptionsParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('customer');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(2);
  });

  it('should omit customer parameter if customer is in context', () => {
    const parameters = listSubscriptionsParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).not.toContain('customer');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(1);
  });
});

describe('list subscriptions execute function', () => {
  it('should list subscriptions and return them', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_123456',
        status: 'active',
        customer: 'cus_123456',
      },
      {
        id: 'sub_789012',
        status: 'canceled',
        customer: 'cus_123456',
      },
    ];

    const context = {};
    const params = {customer: 'cus_123456'};

    stripe.subscriptions.list.mockResolvedValue({data: mockSubscriptions});
    const result = await listSubscriptions(stripe, context, params);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockSubscriptions);
  });

  it('should use customer from context if provided', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_123456',
        status: 'active',
        customer: 'cus_123456',
      },
    ];

    const context = {
      customer: 'cus_123456',
    };
    const params = {};

    stripe.subscriptions.list.mockResolvedValue({data: mockSubscriptions});
    const result = await listSubscriptions(stripe, context, params);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith(
      {customer: context.customer},
      undefined
    );
    expect(result).toEqual(mockSubscriptions);
  });

  it('should specify the connected account if included in context', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_123456',
        status: 'active',
        customer: 'cus_123456',
      },
    ];

    const context = {
      account: 'acct_123456',
    };
    const params = {customer: 'cus_123456'};

    stripe.subscriptions.list.mockResolvedValue({data: mockSubscriptions});
    const result = await listSubscriptions(stripe, context, params);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockSubscriptions);
  });
});

describe('list subscriptions tool', () => {
  it('should generate proper tool object', () => {
    const listToolObj = listSubscriptionsTool({});
    expect(listToolObj.method).toBe('list_subscriptions');
    expect(listToolObj.name).toBe('List Subscriptions');
    expect(typeof listToolObj.description).toBe('string');
    expect(listToolObj.actions.subscriptions.read).toBe(true);
  });
});
