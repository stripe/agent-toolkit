import {listPaymentIntents} from '@/shared/paymentIntents/listPaymentIntents';

const Stripe = jest.fn().mockImplementation(() => ({
  paymentIntents: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('listPaymentIntents', () => {
  it('should list payment intents and return them', async () => {
    const mockPaymentIntents = [
      {
        id: 'pi_123456',
        customer: 'cus_123456',
        amount: 1000,
        status: 'succeeded',
        description: 'Test Payment Intent',
      },
    ];

    const context = {};

    stripe.paymentIntents.list.mockResolvedValue({data: mockPaymentIntents});

    const result = await listPaymentIntents(stripe, context, {});

    expect(stripe.paymentIntents.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockPaymentIntents);
  });

  it('should list payment intents for a specific customer', async () => {
    const mockPaymentIntents = [
      {
        id: 'pi_123456',
        customer: 'cus_123456',
        amount: 1000,
        status: 'succeeded',
        description: 'Test Payment Intent',
      },
    ];

    const context = {};

    stripe.paymentIntents.list.mockResolvedValue({data: mockPaymentIntents});

    const result = await listPaymentIntents(stripe, context, {
      customer: 'cus_123456',
    });

    expect(stripe.paymentIntents.list).toHaveBeenCalledWith(
      {
        customer: 'cus_123456',
      },
      undefined
    );
    expect(result).toEqual(mockPaymentIntents);
  });

  it('should specify the connected account if included in context', async () => {
    const mockPaymentIntents = [
      {
        id: 'pi_123456',
        customer: 'cus_123456',
        amount: 1000,
        status: 'succeeded',
        description: 'Test Payment Intent',
      },
    ];

    const context = {
      account: 'acct_123456',
    };

    stripe.paymentIntents.list.mockResolvedValue({data: mockPaymentIntents});

    const result = await listPaymentIntents(stripe, context, {});

    expect(stripe.paymentIntents.list).toHaveBeenCalledWith(
      {},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockPaymentIntents);
  });

  it('should list payment intents for a specific customer if included in context', async () => {
    const mockPaymentIntents = [
      {
        id: 'pi_123456',
        customer: 'cus_123456',
        amount: 1000,
        status: 'succeeded',
        description: 'Test Payment Intent',
      },
    ];

    const context = {
      customer: 'cus_123456',
    };

    stripe.paymentIntents.list.mockResolvedValue({data: mockPaymentIntents});

    const result = await listPaymentIntents(stripe, context, {});

    expect(stripe.paymentIntents.list).toHaveBeenCalledWith(
      {customer: context.customer},
      undefined
    );
    expect(result).toEqual(mockPaymentIntents);
  });
});
