import {createPaymentLink} from '@/shared/paymentLinks/createPaymentLink';

const Stripe = jest.fn().mockImplementation(() => ({
  paymentLinks: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('createPaymentLink', () => {
  it('should create a payment link and return it', async () => {
    const params = {
      line_items: [
        {
          price: 'price_123456',
          quantity: 1,
        },
      ],
    };

    const mockPaymentLink = {
      id: 'pl_123456',
      url: 'https://example.com',
    };

    const context = {};

    stripe.paymentLinks.create.mockResolvedValue(mockPaymentLink);

    const result = await createPaymentLink(stripe, context, {
      price: 'price_123456',
      quantity: 1,
    });

    expect(stripe.paymentLinks.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockPaymentLink);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      line_items: [
        {
          price: 'price_123456',
          quantity: 1,
        },
      ],
    };

    const mockPaymentLink = {
      id: 'pl_123456',
      url: 'https://example.com',
    };

    const context = {
      account: 'acct_123456',
    };

    stripe.paymentLinks.create.mockResolvedValue(mockPaymentLink);

    const result = await createPaymentLink(stripe, context, {
      price: 'price_123456',
      quantity: 1,
    });

    expect(stripe.paymentLinks.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockPaymentLink);
  });

  it('should specify the redirect URL if included in params', async () => {
    const params = {
      line_items: [
        {
          price: 'price_123456',
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://example.com',
        },
      },
    };

    const mockPaymentLink = {
      id: 'pl_123456',
      url: 'https://example.com',
    };

    const context = {};

    stripe.paymentLinks.create.mockResolvedValue(mockPaymentLink);

    const result = await createPaymentLink(stripe, context, {
      price: 'price_123456',
      quantity: 1,
      redirect_url: 'https://example.com',
    });

    expect(stripe.paymentLinks.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockPaymentLink);
  });
});
