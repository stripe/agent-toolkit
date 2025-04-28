import {createPriceParameters} from '@/shared/prices/createPrice';
import {listPricesParameters} from '@/shared/prices/listPrices';

describe('createPriceParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createPriceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['product', 'unit_amount', 'currency']);
    expect(fields.length).toBe(3);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createPriceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['product', 'unit_amount', 'currency']);
    expect(fields.length).toBe(3);
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
