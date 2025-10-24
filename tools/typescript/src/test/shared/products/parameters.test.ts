import {createProductParameters} from '@/shared/products/createProduct';
import {listProductsParameters} from '@/shared/products/listProducts';

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
