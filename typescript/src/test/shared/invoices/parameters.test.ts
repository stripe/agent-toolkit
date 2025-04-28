import {createInvoiceParameters} from '@/shared/invoices/createInvoice';
import {listInvoicesParameters} from '@/shared/invoices/listInvoices';
import {finalizeInvoiceParameters} from '@/shared/invoices/finalizeInvoice';

describe('createInvoiceParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createInvoiceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['customer', 'days_until_due']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createInvoiceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['days_until_due']);
    expect(fields.length).toBe(1);
  });
});

describe('listInvoicesParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listInvoicesParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['customer', 'limit']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = listInvoicesParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit']);
    expect(fields.length).toBe(1);
  });
});

describe('finalizeInvoiceParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = finalizeInvoiceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['invoice']);
    expect(fields.length).toBe(1);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = finalizeInvoiceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['invoice']);
    expect(fields.length).toBe(1);
  });
});
