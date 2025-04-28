import {createInvoice} from '@/shared/invoices/createInvoice';
import {listInvoices} from '@/shared/invoices/listInvoices';
import {finalizeInvoice} from '@/shared/invoices/finalizeInvoice';

const Stripe = jest.fn().mockImplementation(() => ({
  invoices: {
    create: jest.fn(),
    finalizeInvoice: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('createInvoice', () => {
  it('should create an invoice and return it', async () => {
    const params = {
      customer: 'cus_123456',
      days_until_due: 30,
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
      days_until_due: 30,
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

  it('should create an invoice with a customer if included in context', async () => {
    const params = {
      days_until_due: 30,
    };

    const mockInvoice = {id: 'in_123456', customer: 'cus_123456'};

    const context = {
      customer: 'cus_123456',
    };

    stripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice(stripe, context, params);

    expect(stripe.invoices.create).toHaveBeenCalledWith(
      {
        ...params,
        customer: context.customer,
      },
      undefined
    );
    expect(result).toEqual(mockInvoice);
  });
});

describe('listInvoices', () => {
  it('should list invoices and return them', async () => {
    const mockInvoices = [
      {id: 'in_123456', customer: 'cus_123456'},
      {id: 'in_789012', customer: 'cus_789012'},
    ];

    const context = {};

    stripe.invoices.list.mockResolvedValue({data: mockInvoices});

    const result = await listInvoices(stripe, context, {});

    expect(stripe.invoices.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockInvoices);
  });

  it('should specify the connected account if included in context', async () => {
    const mockInvoices = [
      {id: 'in_123456', customer: 'cus_123456'},
      {id: 'in_789012', customer: 'cus_789012'},
    ];

    const context = {
      account: 'acct_123456',
    };

    stripe.invoices.list.mockResolvedValue({data: mockInvoices});

    const result = await listInvoices(stripe, context, {});

    expect(stripe.invoices.list).toHaveBeenCalledWith(
      {},
      {stripeAccount: context.account}
    );
    expect(result).toEqual(mockInvoices);
  });

  it('should list invoices for a specific customer', async () => {
    const mockInvoices = [
      {id: 'in_123456', customer: 'cus_123456'},
      {id: 'in_789012', customer: 'cus_789012'},
    ];

    const context = {
      customer: 'cus_123456',
    };

    stripe.invoices.list.mockResolvedValue({data: mockInvoices});

    const result = await listInvoices(stripe, context, {});

    expect(stripe.invoices.list).toHaveBeenCalledWith(
      {customer: context.customer},
      undefined
    );
    expect(result).toEqual(mockInvoices);
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
