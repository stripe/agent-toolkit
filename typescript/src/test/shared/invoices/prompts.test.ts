import {
  createInvoicePrompt,
  listInvoicesPrompt,
  finalizeInvoicePrompt,
} from '@/shared/invoices/prompts';

describe('createInvoicePrompt', () => {
  it('should return the correct prompt when no customer is specified', () => {
    const prompt = createInvoicePrompt({});
    expect(prompt).toContain('- customer (str)');
  });

  it('should return the correct prompt when a customer is specified', () => {
    const prompt = createInvoicePrompt({customer: 'cus_123'});
    expect(prompt).toContain('context: cus_123');
    expect(prompt).not.toContain('- customer (str)');
  });
});

describe('listInvoicesPrompt', () => {
  it('should return the correct prompt when no customer is specified', () => {
    const prompt = listInvoicesPrompt({});
    expect(prompt).toContain('- customer (str, optional)');
  });

  it('should return the correct prompt when a customer is specified', () => {
    const prompt = listInvoicesPrompt({customer: 'cus_123'});
    expect(prompt).toContain('context: cus_123');
    expect(prompt).not.toContain('- customer (str, optional)');
  });
});

describe('finalizeInvoicePrompt', () => {
  it('should return the correct prompt', () => {
    const prompt = finalizeInvoicePrompt();
    expect(prompt).toContain('invoice');
  });
});
