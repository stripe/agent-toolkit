import Stripe from 'stripe';
import createPriceTool, {
  description as createDescription,
  parameters as createPriceParameters,
  execute as createPrice,
} from '@/shared/prices/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  prices: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('create price description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('create a price in Stripe');
  });
});

describe('create price parameters', () => {
  it('should return the correct parameters', () => {
    const parameters = createPriceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('product');
    expect(fields).toContain('unit_amount');
    expect(fields).toContain('currency');
    expect(fields.length).toBe(3);
  });
});

describe('create price execute function', () => {
  it('should create a price and return it', async () => {
    const params = {
      product: 'prod_123456',
      unit_amount: 1000,
      currency: 'usd',
    };

    const mockPrice = {
      id: 'price_123456',
      product: 'prod_123456',
      unit_amount: 1000,
      currency: 'usd',
    };

    const context = {};

    stripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice(stripe, context, params);

    expect(stripe.prices.create).toHaveBeenCalledWith(
      {
        product: params.product,
        unit_amount: params.unit_amount,
        currency: params.currency,
      },
      undefined
    );
    expect(result).toEqual(mockPrice);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      product: 'prod_123456',
      unit_amount: 1000,
      currency: 'usd',
    };

    const mockPrice = {
      id: 'price_123456',
      product: 'prod_123456',
      unit_amount: 1000,
      currency: 'usd',
    };

    const context = {
      account: 'acct_123456',
    };

    stripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice(stripe, context, params);

    expect(stripe.prices.create).toHaveBeenCalledWith(
      {
        product: params.product,
        unit_amount: params.unit_amount,
        currency: params.currency,
      },
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockPrice);
  });
});

describe('create price tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createPriceTool({});
    expect(createToolObj.method).toBe('create_price');
    expect(createToolObj.name).toBe('Create Price');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.prices.create).toBe(true);
  });
});
