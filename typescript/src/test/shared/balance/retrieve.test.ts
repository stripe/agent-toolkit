import Stripe from 'stripe';
import retrieveBalanceTool, {
  description as retrieveDescription,
  parameters as retrieveParameters,
  execute as retrieveBalance,
} from '@/shared/balance/retrieve';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  balance: {
    retrieve: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('balance description', () => {
  it('should return a description string', () => {
    const descriptionString = retrieveDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('retrieve the balance from Stripe');
  });
});

describe('balance parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = retrieveParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });

  it('should return the same parameters schema when customer is specified', () => {
    const parameters = retrieveParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });
});

describe('balance execute function', () => {
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

describe('balance tool', () => {
  it('should generate proper tool object', () => {
    const retrieveToolObj = retrieveBalanceTool({});
    expect(retrieveToolObj.method).toBe('retrieve_balance');
    expect(retrieveToolObj.name).toBe('Retrieve Balance');
    expect(typeof retrieveToolObj.description).toBe('string');
    expect(retrieveToolObj.actions.balance.read).toBe(true);
  });
});
