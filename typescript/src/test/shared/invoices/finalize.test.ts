import Stripe from 'stripe';
import finalizeInvoiceTool, {
  description as finalizeDescription,
  parameters as finalizeInvoiceParameters,
  execute as finalizeInvoice,
} from '@/shared/invoices/finalize';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  invoices: {
    finalizeInvoice: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('finalize invoice description', () => {
  it('should return a description string', () => {
    const descriptionString = finalizeDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('finalize an invoice in Stripe');
  });
});

describe('finalize invoice parameters', () => {
  it('should return the correct parameters schema', () => {
    const parameters = finalizeInvoiceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('invoice');
    expect(fields.length).toBe(1);
  });

  it('should return the same parameters schema when customer is specified', () => {
    const parameters = finalizeInvoiceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('invoice');
    expect(fields.length).toBe(1);
  });
});

describe('finalize invoice execute function', () => {
  it('should finalize an invoice and return the id, url, customer, and status', async () => {
    const params = {
      invoice: 'in_123456',
    };

    const context = {};

    const mockInvoice = {
      id: 'in_123456',
      hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
      customer: 'cus_123456',
      status: 'open',
    };
    stripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

    const result = await finalizeInvoice(stripe, context, params);

    expect(stripe.invoices.finalizeInvoice).toHaveBeenCalledWith(
      params.invoice,
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
      invoice: 'in_123456',
    };

    const context = {
      account: 'acct_123456',
    };

    const mockInvoice = {
      id: 'in_123456',
      hosted_invoice_url: 'https://pay.stripe.com/invoice/123456',
      customer: 'cus_123456',
      status: 'open',
    };
    stripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

    const result = await finalizeInvoice(stripe, context, params);

    expect(stripe.invoices.finalizeInvoice).toHaveBeenCalledWith(
      params.invoice,
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual({
      id: mockInvoice.id,
      url: mockInvoice.hosted_invoice_url,
      customer: mockInvoice.customer,
      status: mockInvoice.status,
    });
  });
});

describe('finalize invoice tool', () => {
  it('should generate proper tool object', () => {
    const finalizeToolObj = finalizeInvoiceTool({});
    expect(finalizeToolObj.method).toBe('finalize_invoice');
    expect(finalizeToolObj.name).toBe('Finalize Invoice');
    expect(typeof finalizeToolObj.description).toBe('string');
    expect(finalizeToolObj.actions.invoices.update).toBe(true);
  });
});
