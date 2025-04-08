import Stripe from 'stripe';
import listPaymentIntentsTool, {
  description as listDescription,
  parameters as listPaymentIntentsParameters,
  execute as listPaymentIntents,
} from '@/shared/paymentIntents/list';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  paymentIntents: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('list payment intents description', () => {
  it('should return a description string', () => {
    const descriptionString = listDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('list payment intents in Stripe');
  });

  it('should customize based on context', () => {
    const descriptionWithContext = listDescription({
      customer: 'cus_123456',
    });
    expect(descriptionWithContext).toContain(
      'customer is already set in the context'
    );
  });
});

describe('list payment intents parameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listPaymentIntentsParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('customer');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(2);
  });

  it('should omit customer parameter if customer is in context', () => {
    const parameters = listPaymentIntentsParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).not.toContain('customer');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(1);
  });
});

describe('list payment intents execute function', () => {
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

describe('list payment intents tool', () => {
  it('should generate proper tool object', () => {
    const listToolObj = listPaymentIntentsTool({});
    expect(listToolObj.method).toBe('list_payment_intents');
    expect(listToolObj.name).toBe('List Payment Intents');
    expect(typeof listToolObj.description).toBe('string');
    expect(listToolObj.actions.paymentIntents.read).toBe(true);
  });
});
