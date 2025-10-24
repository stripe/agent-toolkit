import {retrieveBalance} from '@/shared/balance/retrieveBalance';

const Stripe = jest.fn().mockImplementation(() => ({
  balance: {
    retrieve: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('retrieveBalance', () => {
  it('should retrieve the balance and return it', async () => {
    const mockBalance = {available: [{amount: 1000, currency: 'usd'}]};

    const context = {};

    stripe.balance.retrieve.mockResolvedValue(mockBalance);

    const result = await retrieveBalance(stripe, context, {});

    expect(stripe.balance.retrieve).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockBalance);
  });

  it('should specify the connected account if included in context', async () => {
    const mockBalance = {available: [{amount: 1000, currency: 'usd'}]};

    const context = {
      account: 'acct_123456',
    };

    stripe.balance.retrieve.mockResolvedValue(mockBalance);

    const result = await retrieveBalance(stripe, context, {});

    expect(stripe.balance.retrieve).toHaveBeenCalledWith(
      {},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockBalance);
  });
});
