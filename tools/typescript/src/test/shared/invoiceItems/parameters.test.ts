import {createInvoiceItemParameters} from '@/shared/invoiceItems/createInvoiceItem';

describe('createInvoiceItemParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createInvoiceItemParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['customer', 'price', 'invoice']);
    expect(fields.length).toBe(3);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createInvoiceItemParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['price', 'invoice']);
    expect(fields.length).toBe(2);
  });
});
