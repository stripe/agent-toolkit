import Stripe from 'stripe';
import createPaymentLinkTool, {
  description as createDescription,
  parameters as createPaymentLinkParameters,
  execute as createPaymentLink,
} from '@/shared/paymentLinks/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  paymentLinks: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('payment link description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('create a payment link in Stripe');
  });
});

describe('payment link parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = createPaymentLinkParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('price');
    expect(fields).toContain('quantity');
    expect(fields.length).toBe(2);
  });
});

describe('payment link execute function', () => {
  it('should create a payment link and return the id and url', async () => {
    const params = {
      price: 'price_123456',
      quantity: 1,
    };

    const context = {};

    const mockPaymentLink = {
      id: 'pl_123456',
      url: 'https://example.com',
    };

    stripe.paymentLinks.create.mockResolvedValue(mockPaymentLink);

    const result = await createPaymentLink(stripe, context, params);

    expect(stripe.paymentLinks.create).toHaveBeenCalledWith(
      {
        line_items: [
          {
            price: params.price,
            quantity: params.quantity,
          },
        ],
      },
      undefined
    );
    expect(result).toEqual({
      id: mockPaymentLink.id,
      url: mockPaymentLink.url,
    });
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      price: 'price_123456',
      quantity: 1,
    };

    const context = {
      account: 'acct_123456',
    };

    const mockPaymentLink = {
      id: 'pl_123456',
      url: 'https://example.com',
    };

    stripe.paymentLinks.create.mockResolvedValue(mockPaymentLink);

    const result = await createPaymentLink(stripe, context, params);

    expect(stripe.paymentLinks.create).toHaveBeenCalledWith(
      {
        line_items: [
          {
            price: params.price,
            quantity: params.quantity,
          },
        ],
      },
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual({
      id: mockPaymentLink.id,
      url: mockPaymentLink.url,
    });
  });
});

describe('payment link tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createPaymentLinkTool({});
    expect(createToolObj.method).toBe('create_payment_link');
    expect(createToolObj.name).toBe('Create Payment Link');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.paymentLinks.create).toBe(true);
  });
});
