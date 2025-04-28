import {createInvoiceItem} from '@/shared/invoiceItems/createInvoiceItem';

const Stripe = jest.fn().mockImplementation(() => ({
  invoiceItems: {
    create: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
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

  it('should create an invoice item with a customer if included in context', async () => {
    const params = {
      price: 'price_123456',
      invoice: 'in_123456',
    };

    const mockInvoiceItem = {id: 'ii_123456', invoice: 'in_123456'};

    const context = {
      customer: 'cus_123456',
    };

    stripe.invoiceItems.create.mockResolvedValue(mockInvoiceItem);

    const result = await createInvoiceItem(stripe, context, params);

    expect(stripe.invoiceItems.create).toHaveBeenCalledWith(
      {
        ...params,
        customer: context.customer,
      },
      undefined
    );
    expect(result).toEqual(mockInvoiceItem);
  });
});
