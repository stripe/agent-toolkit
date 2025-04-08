import Stripe from 'stripe';
import createInvoiceItemTool, {
  description as createDescription,
  parameters as createInvoiceItemParameters,
  execute as createInvoiceItem,
} from '@/shared/invoiceItems/create';

// Mock Stripe
const MockStripe = jest.fn().mockImplementation(() => ({
  invoiceItems: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof MockStripe>;

beforeEach(() => {
  stripe = new MockStripe('fake-api-key');
});

describe('invoice item description', () => {
  it('should return a description string', () => {
    const descriptionString = createDescription({});
    expect(typeof descriptionString).toBe('string');
    expect(descriptionString.length).toBeGreaterThan(0);
    expect(descriptionString).toContain('create an invoice item in Stripe');
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

describe('invoice item parameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createInvoiceItemParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toContain('customer');
    expect(fields).toContain('price');
    expect(fields).toContain('invoice');
    expect(fields.length).toBe(3);
  });

  it('should omit customer parameter if customer is in context', () => {
    const parameters = createInvoiceItemParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).not.toContain('customer');
    expect(fields).toContain('price');
    expect(fields).toContain('invoice');
    expect(fields.length).toBe(2);
  });
});

describe('invoice item execute function', () => {
  it('should create an invoice item and return the id and invoice', async () => {
    const params = {
      customer: 'cus_123456',
      price: 'price_123456',
      invoice: 'in_123456',
    };

    const context = {};

    const mockInvoiceItem = {
      id: 'ii_123456',
      invoice: 'in_123456',
      customer: 'cus_123456',
    };
    stripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);

    const result = await createInvoiceItem(stripe, context, params);

    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual({
      id: mockInvoiceItem.id,
      invoice: mockInvoiceItem.invoice,
    });
  });

  it('should use customer from context if provided', async () => {
    const params = {
      price: 'price_123456',
      invoice: 'in_123456',
    };

    const context = {
      customer: 'cus_123456',
    };

    const mockInvoiceItem = {
      id: 'ii_123456',
      invoice: 'in_123456',
      customer: 'cus_123456',
    };
    stripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);

    const result = await createInvoiceItem(stripe, context, params);

    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(
      {...params, customer: context.customer},
      undefined
    );
    expect(result).toEqual({
      id: mockInvoiceItem.id,
      invoice: mockInvoiceItem.invoice,
    });
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      customer: 'cus_123456',
      price: 'price_123456',
      invoice: 'in_123456',
    };

    const context = {
      account: 'acct_123456',
    };

    const mockInvoiceItem = {
      id: 'ii_123456',
      invoice: 'in_123456',
      customer: 'cus_123456',
    };
    stripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);

    const result = await createInvoiceItem(stripe, context, params);

    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(params, {
      stripeAccount: context.account,
    });
    expect(result).toEqual({
      id: mockInvoiceItem.id,
      invoice: mockInvoiceItem.invoice,
    });
  });
});

describe('invoice item tool', () => {
  it('should generate proper tool object', () => {
    const createToolObj = createInvoiceItemTool({});
    expect(createToolObj.method).toBe('create_invoice_item');
    expect(createToolObj.name).toBe('Create Invoice Item');
    expect(typeof createToolObj.description).toBe('string');
    expect(createToolObj.actions.invoiceItems.create).toBe(true);
  });
});
