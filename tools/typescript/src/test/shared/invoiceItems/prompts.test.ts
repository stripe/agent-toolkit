import {createInvoiceItemPrompt} from '@/shared/invoiceItems/createInvoiceItem';

describe('createInvoiceItemPrompt', () => {
  it('should return the correct prompt when no customer is specified', () => {
    const prompt = createInvoiceItemPrompt({});
    expect(prompt).toContain('- customer (str)');
  });

  it('should return the correct prompt when a customer is specified', () => {
    const prompt = createInvoiceItemPrompt({customer: 'cus_123'});
    expect(prompt).toContain('context: cus_123');
    expect(prompt).not.toContain('- customer (str)');
  });
});
