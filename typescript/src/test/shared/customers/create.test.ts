import Stripe from 'stripe';
import createCustomerTool, {
  description as createDescription,
  parameters as createCustomerParameters,
  execute as createCustomer,
} from '@/shared/customers/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  customers: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('create customer description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('create a customer in Stripe');
  });
});

describe('create customer parameters', () => {
  it('should return the correct parameters schema', () => {
    // Create the parameters schema with an empty context
    const parameters = createCustomerParameters({});

    // Validate that the schema has the expected keys
    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'email']);
    expect(fields.length).toBe(2);
  });

  it('should return the same parameters schema when customer is specified', () => {
    const parameters = createCustomerParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'email']);
    expect(fields.length).toBe(2);
  });
});

describe('create customer execute function', () => {
  it('should create a customer and return the id', async () => {
    const params = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const context = {};

    const mockCustomer = {id: 'cus_123456', email: 'test@example.com'};
    stripe.customers.create.mockResolvedValue(mockCustomer);

    const result = await createCustomer(stripe, context, params);

    expect(stripe.customers.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual({id: mockCustomer.id});
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const context = {
      account: 'acct_123456',
    };

    const mockCustomer = {id: 'cus_123456', email: 'test@example.com'};
    stripe.customers.create.mockResolvedValue(mockCustomer);

    const result = await createCustomer(stripe, context, params);

    expect(stripe.customers.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual({id: mockCustomer.id});
  });
});

describe('create customer tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createCustomerTool({});
    expect(createToolObj.method).toBe('create_customer');
    expect(createToolObj.name).toBe('Create Customer');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.customers.create).toBe(true);
  });
});
