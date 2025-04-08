import Stripe from 'stripe';
import listInvoicesTool, {
  description as listDescription,
  parameters as listInvoicesParameters,
  execute as listInvoices,
} from '@/shared/invoices/list';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  invoices: {
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('list invoices description', () => {
  it('should return a description string', () => {
    const descriptionString = listDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('fetch a list of Invoices');
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

describe('list invoices parameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listInvoicesParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('customer');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(2);
  });

  it('should omit customer parameter if customer is in context', () => {
    const parameters = listInvoicesParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).not.toContain('customer');
    expect(fields).toContain('limit');
    expect(fields.length).toBe(1);
  });
});

describe('list invoices execute function', () => {
  it('should list invoices and return them', async () => {
    const mockInvoices = [
      {
        id: 'in_123456',
        customer: 'cus_123456',
        hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
        status: 'draft',
      },
      {
        id: 'in_789012',
        customer: 'cus_123456',
        hosted_invoice_url: 'https://pay.stripe.com/invoice/789012',
        status: 'open',
      },
    ];

    const context = {};
    const params = {customer: 'cus_123456'};

    stripe.invoices.list.mockResolvedValue({data: mockInvoices});
    const result = await listInvoices(stripe, context, params);

    expect(stripe.invoices.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockInvoices);
  });

  it('should use customer from context if provided', async () => {
    const mockInvoices = [
      {
        id: 'in_123456',
        customer: 'cus_123456',
        hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
        status: 'draft',
      },
    ];

    const context = {
      customer: 'cus_123456',
    };
    const params = {};

    stripe.invoices.list.mockResolvedValue({data: mockInvoices});
    const result = await listInvoices(stripe, context, params);

    expect(stripe.invoices.list).toHaveBeenCalledWith(
      {customer: context.customer},
      undefined
    );
    expect(result).toEqual(mockInvoices);
  });

  it('should specify the connected account if included in context', async () => {
    const mockInvoices = [
      {
        id: 'in_123456',
        customer: 'cus_123456',
        hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
        status: 'draft',
      },
    ];

    const context = {
      account: 'acct_123456',
    };
    const params = {customer: 'cus_123456'};

    stripe.invoices.list.mockResolvedValue({data: mockInvoices});
    const result = await listInvoices(stripe, context, params);

    expect(stripe.invoices.list).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual(mockInvoices);
  });
});

describe('list invoices tool', () => {
  it('should generate proper tool object', () => {
    const listToolObj = listInvoicesTool({});
    expect(listToolObj.method).toBe('list_invoices');
    expect(listToolObj.name).toBe('List Invoices');
    expect(typeof listToolObj.description).toBe('string');
    expect(listToolObj.actions.invoices.read).toBe(true);
  });
});
