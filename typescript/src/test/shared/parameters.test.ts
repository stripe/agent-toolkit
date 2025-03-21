import {
  createCustomerParameters,
  createInvoiceItemParameters,
  createInvoiceParameters,
  createPaymentLinkParameters,
  createPriceParameters,
  createProductParameters,
  createRefundParameters,
  finalizeInvoiceParameters,
  listCustomersParameters,
  listInvoicesParameters,
  listPaymentIntentsParameters,
  listPricesParameters,
  listProductsParameters,
  retrieveBalanceParameters,
  searchDocumentationParameters,
} from '../../shared/parameters';

describe('createCustomerParameters', () => {
  it('should return the correct parameters if no context', () => {
    // Create the parameters schema with an empty context
    const parameters = createCustomerParameters({});

    // Validate that the schema has the expected keys
    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'email']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createCustomerParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'email']);
    expect(fields.length).toBe(2);
  });
});

describe('listCustomersParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listCustomersParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit', 'email']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = listCustomersParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit', 'email']);
    expect(fields.length).toBe(2);
  });
});

describe('createProductParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createProductParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'description']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createProductParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['name', 'description']);
    expect(fields.length).toBe(2);
  });
});

describe('listProductsParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listProductsParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit']);
    expect(fields.length).toBe(1);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = listProductsParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit']);
    expect(fields.length).toBe(1);
  });
});

describe('createPriceParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createPriceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['product', 'unit_amount', 'currency', 'recurring']);
    expect(fields.length).toBe(4);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createPriceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['product', 'unit_amount', 'currency', 'recurring']);
    expect(fields.length).toBe(4);
  });

  it('should validate recurring parameters correctly', () => {
    const parameters = createPriceParameters({});
    
    // Valid recurring parameters
    const validData = {
      product: 'prod_123',
      unit_amount: 1000,
      currency: 'usd',
      recurring: {
        interval: 'month'
      }
    };
    
    const result = parameters.safeParse(validData);
    expect(result.success).toBe(true);
    
    // Invalid interval
    const invalidInterval = {
      product: 'prod_123',
      unit_amount: 1000,
      currency: 'usd',
      recurring: {
        interval: 'invalid'
      }
    };
    
    const invalidResult = parameters.safeParse(invalidInterval);
    expect(invalidResult.success).toBe(false);
    
    // Valid with optional fields
    const withOptionalFields = {
      product: 'prod_123',
      unit_amount: 1000,
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 3,
        usage_type: 'licensed'
      }
    };
    
    const optionalResult = parameters.safeParse(withOptionalFields);
    expect(optionalResult.success).toBe(true);
  });
});

describe('listPricesParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listPricesParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['product', 'limit']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = listPricesParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['product', 'limit']);
    expect(fields.length).toBe(2);
  });
});

describe('createPaymentLinkParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createPaymentLinkParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['price', 'quantity']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createPaymentLinkParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['price', 'quantity']);
  });
});

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

describe('retrieveBalanceParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = retrieveBalanceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = retrieveBalanceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });
});

describe('createRefundParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createRefundParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['payment_intent', 'amount']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createRefundParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['payment_intent', 'amount']);
    expect(fields.length).toBe(2);
  });
});

describe('listPaymentIntentsParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = listPaymentIntentsParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['customer', 'limit']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = listPaymentIntentsParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['limit']);
    expect(fields.length).toBe(1);
  });
});

describe('searchDocumentationParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = searchDocumentationParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['question', 'language']);
    expect(fields.length).toBe(2);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = searchDocumentationParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['question', 'language']);
    expect(fields.length).toBe(2);
  });
});
