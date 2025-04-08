import Stripe from 'stripe';
import listProductsTool, {
  description as listDescription,
  parameters as listProductsParameters,
  execute as listProducts,
} from '@/shared/products/list';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  products: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('list products description', () => {
  it('should return a description string', () => {
    const descriptionString = listDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('fetch a list of Products');
  });
});

describe('list products parameters', () => {
  it('should return the correct parameters', () => {
    const parameters = listProductsParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit']);
    expect(fields.length).toBe(1);
  });
});

describe('list products execute function', () => {
  it('should list products and return them', async () => {
    const mockProducts = [
      {
        id: 'prod_123456',
        name: 'Test Product 1',
        description: 'This is a test product',
      },
      {
        id: 'prod_789012',
        name: 'Test Product 2',
        description: 'This is another test product',
      },
    ];

    const context = {};

    stripe.products.list.mockResolvedValue({data: mockProducts});

    const result = await listProducts(stripe, context, {});

    expect(stripe.products.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockProducts);
  });

  it('should pass limit parameter when provided', async () => {
    const mockProducts = [
      {
        id: 'prod_123456',
        name: 'Test Product 1',
        description: 'This is a test product',
      },
    ];

    const context = {};
    const params = {limit: 1};

    stripe.products.list.mockResolvedValue({data: mockProducts});

    const result = await listProducts(stripe, context, params);

    expect(stripe.products.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockProducts);
  });

  it('should specify the connected account if included in context', async () => {
    const mockProducts = [
      {
        id: 'prod_123456',
        name: 'Test Product 1',
        description: 'This is a test product',
      },
    ];

    const context = {
      account: 'acct_123456',
    };

    stripe.products.list.mockResolvedValue({data: mockProducts});

    const result = await listProducts(stripe, context, {});

    expect(stripe.products.list).toHaveBeenCalledWith(
      {},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockProducts);
  });
});

describe('list products tool', () => {
  it('should generate proper tool object', () => {
    const listToolObj = listProductsTool({});
    expect(listToolObj.method).toBe('list_products');
    expect(listToolObj.name).toBe('List Products');
    expect(typeof listToolObj.description).toBe('string');
    expect(listToolObj.actions.products.read).toBe(true);
  });
});
