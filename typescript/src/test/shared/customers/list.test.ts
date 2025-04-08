import Stripe from 'stripe';
import listCustomersTool, {
  description as listDescription,
  parameters as listCustomersParameters,
  execute as listCustomers,
} from '@/shared/customers/list';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  customers: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('list customers description', () => {
  it('should return a description string', () => {
    const descriptionString = listDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('fetch a list of Customers');
  });
});

describe('list customers parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = listCustomersParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit', 'email']);
    expect(fields.length).toBe(2);
  });

  it('should return the same parameters schema when customer is specified', () => {
    const parameters = listCustomersParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit', 'email']);
    expect(fields.length).toBe(2);
  });
});

describe('list customers execute function', () => {
  it('should list customers and return their ids', async () => {
    const mockCustomers = [
      {id: 'cus_123456', email: 'test1@example.com'},
      {id: 'cus_789012', email: 'test2@example.com'},
    ];

    const context = {};

    stripe.customers.list.mockResolvedValue({data: mockCustomers});
    const result = await listCustomers(stripe, context, {});

    expect(stripe.customers.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockCustomers.map(({id}) => ({id})));
  });

  it('should specify the connected account if included in context', async () => {
    const mockCustomers = [
      {id: 'cus_123456', email: 'test1@example.com'},
      {id: 'cus_789012', email: 'test2@example.com'},
    ];

    const context = {
      account: 'acct_123456',
    };

    stripe.customers.list.mockResolvedValue({data: mockCustomers});
    const result = await listCustomers(stripe, context, {});

    expect(stripe.customers.list).toHaveBeenCalledWith(
      {},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockCustomers.map(({id}) => ({id})));
  });
});

describe('list customers tool', () => {
  it('should generate proper tool object', () => {
    const listToolObj = listCustomersTool({});
    expect(listToolObj.method).toBe('list_customers');
    expect(listToolObj.name).toBe('List Customers');
    expect(typeof listToolObj.description).toBe('string');
    expect(listToolObj.actions.customers.read).toBe(true);
  });
});
