import {createRefund} from '@/shared/refunds/createRefund';

const Stripe = jest.fn().mockImplementation(() => ({
  refunds: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('createRefund', () => {
  it('should create a refund and return it', async () => {
    const params = {
      payment_intent: 'pi_123456',
    };

    const mockRefund = {id: 're_123456'};

    const context = {};

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockRefund);
  });

  it('should create a partial refund and return it', async () => {
    const params = {
      payment_intent: 'pi_123456',
      amount: 500,
    };

    const mockRefund = {id: 're_123456'};

    const context = {};

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockRefund);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      payment_intent: 'pi_123456',
    };

    const mockRefund = {id: 're_123456'};

    const context = {
      account: 'acct_123456',
    };

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockRefund);
  });
});
