import {createPrice} from '@/shared/prices/createPrice';
import {listPrices} from '@/shared/prices/listPrices';

const Stripe = jest.fn().mockImplementation(() => ({
  prices: {
    create: jest.fn(),
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('createPrice', () => {
  it('should create a price and return it', async () => {
    const params = {
      unit_amount: 1000,
      currency: 'usd',
      product: 'prod_123456',
    };

    const context = {};

    const mockPrice = {id: 'price_123456', unit_amount: 1000, currency: 'usd'};
    stripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice(stripe, context, params);

    expect(stripe.prices.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockPrice);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      unit_amount: 1000,
      currency: 'usd',
      product: 'prod_123456',
    };

    const context = {
      account: 'acct_123456',
    };

    const mockPrice = {id: 'price_123456', unit_amount: 1000, currency: 'usd'};
    stripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice(stripe, context, params);

    expect(stripe.prices.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockPrice);
  });
});

describe('listPrices', () => {
  it('should list prices and return them', async () => {
    const mockPrices = [
      {id: 'price_123456', unit_amount: 1000, currency: 'usd'},
      {id: 'price_789012', unit_amount: 2000, currency: 'usd'},
    ];

    const context = {};

    stripe.prices.list.mockResolvedValue({data: mockPrices});
    const result = await listPrices(stripe, context, {});

    expect(stripe.prices.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockPrices);
  });

  it('should specify the connected account if included in context', async () => {
    const mockPrices = [
      {id: 'price_123456', unit_amount: 1000, currency: 'usd'},
      {id: 'price_789012', unit_amount: 2000, currency: 'usd'},
    ];

    const context = {
      account: 'acct_123456',
    };

    stripe.prices.list.mockResolvedValue({data: mockPrices});
    const result = await listPrices(stripe, context, {});

    expect(stripe.prices.list).toHaveBeenCalledWith(
      {},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockPrices);
  });
});
