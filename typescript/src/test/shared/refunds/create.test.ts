import Stripe from 'stripe';
import createRefundTool, {
  description as createDescription,
  parameters as createRefundParameters,
  execute as createRefund,
} from '@/shared/refunds/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  refunds: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('create refund description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('refund a payment intent in Stripe');
  });
});

describe('create refund parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = createRefundParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('payment_intent');
    expect(fields).toContain('amount');
    expect(fields.length).toBe(2);
  });
});

describe('create refund execute function', () => {
  it('should create a refund and return id, status, and amount', async () => {
    const params = {
      payment_intent: 'pi_123456',
      amount: 1000,
    };

    const mockRefund = {
      id: 're_123456',
      status: 'succeeded',
      amount: 1000,
    };

    const context = {};

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual({
      id: mockRefund.id,
      status: mockRefund.status,
      amount: mockRefund.amount,
    });
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      payment_intent: 'pi_123456',
      amount: 1000,
    };

    const mockRefund = {
      id: 're_123456',
      status: 'succeeded',
      amount: 1000,
    };

    const context = {
      account: 'acct_123456',
    };

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual({
      id: mockRefund.id,
      status: mockRefund.status,
      amount: mockRefund.amount,
    });
  });
});

describe('create refund tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createRefundTool({});
    expect(createToolObj.method).toBe('create_refund');
    expect(createToolObj.name).toBe('Create Refund');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.refunds.create).toBe(true);
  });
});
