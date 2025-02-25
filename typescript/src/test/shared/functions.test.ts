import {
  createCustomer,
  listCustomers,
  createProduct,
  listProducts,
  createPrice,
  listPrices,
  createPaymentLink,
  createInvoice,
  createInvoiceItem,
  finalizeInvoice,
  retrieveBalance,
  createRefund,
  listPaymentIntents,
  createCheckoutSession,
  expireCheckoutSession,
  searchDocumentation,
} from '../../shared/functions';
import {z} from 'zod';
import {searchDocumentationParameters} from '../../shared/parameters';

import type {UI} from '../../shared/configuration';

const Stripe = jest.fn().mockImplementation(() => ({
  customers: {
    create: jest.fn(),
    list: jest.fn(),
  },
  products: {
    create: jest.fn(),
    list: jest.fn(),
  },
  prices: {
    create: jest.fn(),
    list: jest.fn(),
  },
  paymentLinks: {
    create: jest.fn(),
  },
  invoices: {
    create: jest.fn(),
    finalizeInvoice: jest.fn(),
    retrieve: jest.fn(),
  },
  invoiceItems: {
    create: jest.fn(),
  },
  paymentIntents: {
    list: jest.fn(),
  },
  balance: {
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      expire: jest.fn(),
    },
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('createCustomer', () => {
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

describe('listCustomers', () => {
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

describe('createProduct', () => {
  it('should create a product and return it', async () => {
    const params = {
      name: 'Test Product',
    };

    const context = {};

    const mockProduct = {id: 'prod_123456', name: 'Test Product'};
    stripe.products.create.mockResolvedValue(mockProduct);

    const result = await createProduct(stripe, context, params);

    expect(stripe.products.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockProduct);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      name: 'Test Product',
    };

    const context = {
      account: 'acct_123456',
    };

    const mockProduct = {id: 'prod_123456', name: 'Test Product'};
    stripe.products.create.mockResolvedValue(mockProduct);

    const result = await createProduct(stripe, context, params);

    expect(stripe.products.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockProduct);
  });
});

describe('listProducts', () => {
  it('should list products and return them', async () => {
    const mockProducts = [
      {id: 'prod_123456', name: 'Test Product 1'},
      {id: 'prod_789012', name: 'Test Product 2'},
    ];

    const context = {};

    stripe.products.list.mockResolvedValue({data: mockProducts});
    const result = await listProducts(stripe, context, {});

    expect(stripe.products.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockProducts);
  });

  it('should specify the connected account if included in context', async () => {
    const mockProducts = [
      {id: 'prod_123456', name: 'Test Product 1'},
      {id: 'prod_789012', name: 'Test Product 2'},
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

describe('createPrice', () => {
  it('should create a price and return it', async () => {
    const params = {
      unit_amount: 1000,
      currency: 'usd',
      product: 'prod_123456',
    };

    const context = {};

    const mockPrice = {id: 'price_123456', unit_amount: 1000, currency: 'usd'};
    stripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice(stripe, context, params);

    expect(stripe.prices.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockPrice);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      unit_amount: 1000,
      currency: 'usd',
      product: 'prod_123456',
    };

    const context = {
      account: 'acct_123456',
    };

    const mockPrice = {id: 'price_123456', unit_amount: 1000, currency: 'usd'};
    stripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice(stripe, context, params);

    expect(stripe.prices.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockPrice);
  });
});

describe('listPrices', () => {
  it('should list prices and return them', async () => {
    const mockPrices = [
      {id: 'price_123456', unit_amount: 1000, currency: 'usd'},
      {id: 'price_789012', unit_amount: 2000, currency: 'usd'},
    ];

    const context = {};

    stripe.prices.list.mockResolvedValue({data: mockPrices});
    const result = await listPrices(stripe, context, {});

    expect(stripe.prices.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockPrices);
  });

  it('should specify the connected account if included in context', async () => {
    const mockPrices = [
      {id: 'price_123456', unit_amount: 1000, currency: 'usd'},
      {id: 'price_789012', unit_amount: 2000, currency: 'usd'},
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
});

describe('createInvoice', () => {
  it('should create an invoice and return it', async () => {
    const params = {
      customer: 'cus_123456',
      items: [{price: 'price_123456', quantity: 1}],
    };

    const mockInvoice = {id: 'in_123456', customer: 'cus_123456'};

    const context = {};

    stripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice(stripe, context, params);

    expect(stripe.invoices.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockInvoice);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      customer: 'cus_123456',
      items: [{price: 'price_123456', quantity: 1}],
    };

    const mockInvoice = {id: 'in_123456', customer: 'cus_123456'};

    const context = {
      account: 'acct_123456',
    };

    stripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice(stripe, context, params);

    expect(stripe.invoices.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockInvoice);
  });
});

describe('finalizeInvoice', () => {
  it('should finalize an invoice and return it', async () => {
    const invoiceId = 'in_123456';

    const mockInvoice = {id: invoiceId, customer: 'cus_123456'};

    const context = {};

    stripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

    const result = await finalizeInvoice(stripe, context, {invoice: invoiceId});

    expect(stripe.invoices.finalizeInvoice).toHaveBeenCalledWith(
      invoiceId,
      undefined
    );
    expect(result).toEqual(mockInvoice);
  });

  it('should specify the connected account if included in context', async () => {
    const invoiceId = 'in_123456';

    const mockInvoice = {id: invoiceId, customer: 'cus_123456'};

    const context = {
      account: 'acct_123456',
    };

    stripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

    const result = await finalizeInvoice(stripe, context, {invoice: invoiceId});

    expect(stripe.invoices.finalizeInvoice).toHaveBeenCalledWith(invoiceId, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockInvoice);
  });
});

describe('createInvoiceItem', () => {
  it('should create an invoice item and return it', async () => {
    const params = {
      customer: 'cus_123456',
      price: 'price_123456',
      invoice: 'in_123456',
    };

    const mockInvoiceItem = {id: 'ii_123456', invoice: 'in_123456'};

    const context = {};

    stripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);

    const result = await createInvoiceItem(stripe, context, params);

    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockInvoiceItem);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      customer: 'cus_123456',
      price: 'price_123456',
      invoice: 'in_123456',
    };

    const mockInvoiceItem = {id: 'ii_123456', invoice: 'in_123456'};

    const context = {
      account: 'acct_123456',
    };

    stripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);

    const result = await createInvoiceItem(stripe, context, params);

    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockInvoiceItem);
  });
});

describe('retrieveBalance', () => {
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

describe('createRefund', () => {
  it('should create a refund and return it', async () => {
    const params = {
      payment_intent: 'pi_123456',
    };

    const mockRefund = {id: 're_123456'};

    const context = {};

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockRefund);
  });

  it('should create a partial refund and return it', async () => {
    const params = {
      payment_intent: 'pi_123456',
      amount: 500,
    };

    const mockRefund = {id: 're_123456'};

    const context = {};

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockRefund);
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      payment_intent: 'pi_123456',
    };

    const mockRefund = {id: 're_123456'};

    const context = {
      account: 'acct_123456',
    };

    stripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund(stripe, context, params);

    expect(stripe.refunds.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockRefund);
  });
});

describe('listPaymentIntents', () => {
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
});

describe('createCheckoutSession', () => {
  it('should create a checkout session and return it', async () => {
    const ui: UI = {checkout: {mode: 'payment', ui_mode: 'embedded'}};
    const params = {
      line_items: [
        {
          price: 'price_123456',
          quantity: 1,
        },
      ],
    };

    const mockCheckoutSession = {
      id: 'cs_123456',
      status: 'open',
      client_secret: 'client_secret_real',
    };

    stripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

    const result = await createCheckoutSession(stripe, ui, params);

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      ...params,
      mode: ui.checkout?.mode,
      ui_mode: ui.checkout?.ui_mode,
      redirect_on_completion: 'never',
    });

    if (typeof result === 'string') {
      throw new Error('Failed to create checkout session');
    }

    expect(result.id).toEqual(mockCheckoutSession.id);
    expect(result.status).toEqual(mockCheckoutSession.status);
  });

  it('should create a checkout session with return and success urls', async () => {
    const ui: UI = {
      checkout: {
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: 'https://example.com',
        success_url: 'https://example.com',
      },
    };
    const params = {
      line_items: [
        {
          price: 'price_123456',
          quantity: 1,
        },
      ],
    };

    const mockCheckoutSession = {
      id: 'cs_123456',
      status: 'open',
      client_secret: 'client_secret_real',
    };

    stripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

    const result = await createCheckoutSession(stripe, ui, params);

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      ...params,
      mode: ui.checkout?.mode,
      ui_mode: ui.checkout?.ui_mode,
      redirect_on_completion: 'always',
      return_url: ui.checkout?.return_url,
      success_url: ui.checkout?.success_url,
    });

    if (typeof result === 'string') {
      throw new Error('Failed to create checkout session');
    }

    expect(result.id).toEqual(mockCheckoutSession.id);
    expect(result.status).toEqual(mockCheckoutSession.status);
  });
});

describe('expireCheckoutSession', () => {
  it('should expire a checkout session', async () => {
    const params = {
      session: 'cs_123456',
    };

    const mockCheckoutSession = {
      id: 'cs_123456',
      status: 'expired',
    };

    stripe.checkout.sessions.expire.mockResolvedValue(mockCheckoutSession);

    const result = await expireCheckoutSession(stripe, params);

    expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith(
      mockCheckoutSession.id
    );

    expect(result).toEqual(mockCheckoutSession);
  });
});

describe('searchDocumentation', () => {
  it('should search for Stripe documentation and return sources', async () => {
    const question = 'How to create Stripe checkout session?';
    const requestBody: z.infer<typeof searchDocumentationParameters> = {
      question: question,
      language: 'ruby',
    };

    const sources = [
      {
        type: 'docs',
        url: 'https://docs.stripe.com/payments/checkout/how-checkout-works',
        title: 'How checkout works',
        content: '...',
      },
    ];
    const mockResponse = {
      question: question,
      status: 'success',
      sources: sources,
    };

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    } as unknown as Response);

    const result = await searchDocumentation(stripe, {}, requestBody);

    expect(fetchMock).toHaveBeenCalledWith('https://ai.stripe.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify(requestBody),
    });

    expect(result).toEqual(sources);
  });

  it('should return failure string if search failed', async () => {
    const question = 'What is the meaning of life?';
    const requestBody = {
      question: question,
    };

    const mockError = {
      error: 'Invalid query',
      message:
        'Unable to process your question. Please rephrase it to be more specific.',
    };

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce(mockError),
    } as unknown as Response);

    const result = await searchDocumentation(stripe, {}, requestBody);

    expect(fetchMock).toHaveBeenCalledWith('https://ai.stripe.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify(requestBody),
    });

    expect(result).toEqual('Failed to search documentation');
  });
});
