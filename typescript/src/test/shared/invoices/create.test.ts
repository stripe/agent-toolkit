import Stripe from 'stripe';
import createInvoiceTool, {
  description as createDescription,
  parameters as createInvoiceParameters,
  execute as createInvoice,
} from '@/shared/invoices/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  invoices: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('create invoice description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('create an invoice in Stripe');
  });

  it('should customize based on context', () => {
    const descriptionWithContext = createDescription({
      customer: 'cus_123456',
    });
    expect(descriptionWithContext).toContain(
      'customer is already set in the context'
    );
  });
});

describe('create invoice parameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createInvoiceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('customer');
    expect(fields).toContain('days_until_due');
    expect(fields.length).toBe(2);
  });

  it('should omit customer parameter if customer is in context', () => {
    const parameters = createInvoiceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).not.toContain('customer');
    expect(fields).toContain('days_until_due');
    expect(fields.length).toBe(1);
  });
});

describe('create invoice execute function', () => {
  it('should create an invoice and return the id, url, customer, and status', async () => {
    const params = {
      customer: 'cus_123456',
      days_until_due: 30,
    };

    const context = {};

    const mockInvoice = {
      id: 'in_123456',
      hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
      customer: 'cus_123456',
      status: 'draft',
    };
    stripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice(stripe, context, params);

    expect(stripe.invoices.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual({
      id: mockInvoice.id,
      url: mockInvoice.hosted_invoice_url,
      customer: mockInvoice.customer,
      status: mockInvoice.status,
    });
  });

  it('should use customer from context if provided', async () => {
    const params = {
      days_until_due: 30,
    };

    const context = {
      customer: 'cus_123456',
    };

    const mockInvoice = {
      id: 'in_123456',
      hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
      customer: 'cus_123456',
      status: 'draft',
    };
    stripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice(stripe, context, params);

    expect(stripe.invoices.create).toHaveBeenCalledWith(
      {...params, customer: context.customer},
      undefined
    );
    expect(result).toEqual({
      id: mockInvoice.id,
      url: mockInvoice.hosted_invoice_url,
      customer: mockInvoice.customer,
      status: mockInvoice.status,
    });
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      customer: 'cus_123456',
      days_until_due: 30,
    };

    const context = {
      account: 'acct_123456',
    };

    const mockInvoice = {
      id: 'in_123456',
      hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
      customer: 'cus_123456',
      status: 'draft',
    };
    stripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice(stripe, context, params);

    expect(stripe.invoices.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual({
      id: mockInvoice.id,
      url: mockInvoice.hosted_invoice_url,
      customer: mockInvoice.customer,
      status: mockInvoice.status,
    });
  });
});

describe('create invoice tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createInvoiceTool({});
    expect(createToolObj.method).toBe('create_invoice');
    expect(createToolObj.name).toBe('Create Invoice');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.invoices.create).toBe(true);
  });
});
