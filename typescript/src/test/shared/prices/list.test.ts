import Stripe from 'stripe';
import listPricesTool, {
  description as listDescription,
  parameters as listPricesParameters,
  execute as listPrices,
} from '@/shared/prices/list';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  prices: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('list prices description', () => {
  it('should return a description string', () => {
    const descriptionString = listDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('fetch a list of Prices');
  });
});

describe('list prices parameters', () => {
  it('should return the correct parameters', () => {
    const parameters = listPricesParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('product');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(2);
  });
});

describe('list prices execute function', () => {
  it('should list prices and return them', async () => {
    const mockPrices = [
      {
        id: 'price_123456',
        product: 'prod_123456',
        unit_amount: 1000,
        currency: 'usd',
      },
      {
        id: 'price_789012',
        product: 'prod_123456',
        unit_amount: 2000,
        currency: 'usd',
      },
    ];

    const context = {};

    stripe.prices.list.mockResolvedValue({data: mockPrices});

    const result = await listPrices(stripe, context, {});

    expect(stripe.prices.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockPrices);
  });

  it('should filter by product when provided', async () => {
    const mockPrices = [
      {
        id: 'price_123456',
        product: 'prod_123456',
        unit_amount: 1000,
        currency: 'usd',
      },
    ];

    const context = {};
    const params = {product: 'prod_123456'};

    stripe.prices.list.mockResolvedValue({data: mockPrices});

    const result = await listPrices(stripe, context, params);

    expect(stripe.prices.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockPrices);
  });

  it('should pass limit parameter when provided', async () => {
    const mockPrices = [
      {
        id: 'price_123456',
        product: 'prod_123456',
        unit_amount: 1000,
        currency: 'usd',
      },
    ];

    const context = {};
    const params = {limit: 1};

    stripe.prices.list.mockResolvedValue({data: mockPrices});

    const result = await listPrices(stripe, context, params);

    expect(stripe.prices.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockPrices);
  });

  it('should specify the connected account if included in context', async () => {
    const mockPrices = [
      {
        id: 'price_123456',
        product: 'prod_123456',
        unit_amount: 1000,
        currency: 'usd',
      },
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

describe('list prices tool', () => {
  it('should generate proper tool object', () => {
    const listToolObj = listPricesTool({});
    expect(listToolObj.method).toBe('list_prices');
    expect(listToolObj.name).toBe('List Prices');
    expect(typeof listToolObj.description).toBe('string');
    expect(listToolObj.actions.prices.read).toBe(true);
  });
});
