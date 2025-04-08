import Stripe from 'stripe';
import createProductTool, {
  description as createDescription,
  parameters as createProductParameters,
  execute as createProduct,
} from '@/shared/products/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  products: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('create product description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('create a product in Stripe');
  });
});

describe('create product parameters', () => {
  it('should return the correct parameters', () => {
    const parameters = createProductParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'description']);
    expect(fields.length).toBe(2);
  });
});

describe('create product execute function', () => {
  it('should create a product and return it', async () => {
    const params = {
      name: 'Test Product',
      description: 'This is a test product',
    };

    const mockProduct = {
      id: 'prod_123456',
      name: 'Test Product',
      description: 'This is a test product',
    };

    const context = {};

    stripe.products.create.mockResolvedValue(mockProduct);

    const result = await createProduct(stripe, context, params);

    expect(stripe.products.create).toHaveBeenCalledWith(
      {
        name: params.name,
        description: params.description,
      },
      undefined
    );
    expect(result).toEqual(mockProduct);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      name: 'Test Product',
      description: 'This is a test product',
    };

    const mockProduct = {
      id: 'prod_123456',
      name: 'Test Product',
      description: 'This is a test product',
    };

    const context = {
      account: 'acct_123456',
    };

    stripe.products.create.mockResolvedValue(mockProduct);

    const result = await createProduct(stripe, context, params);

    expect(stripe.products.create).toHaveBeenCalledWith(
      {
        name: params.name,
        description: params.description,
      },
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockProduct);
  });
});

describe('create product tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createProductTool({});
    expect(createToolObj.method).toBe('create_product');
    expect(createToolObj.name).toBe('Create Product');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.products.create).toBe(true);
  });
});
