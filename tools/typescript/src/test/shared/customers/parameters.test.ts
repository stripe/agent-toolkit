import {createCustomerParameters} from '@/shared/customers/createCustomer';
import {listCustomersParameters} from '@/shared/customers/listCustomers';

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
