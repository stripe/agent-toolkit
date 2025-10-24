import {listPaymentIntentsParameters} from '@/shared/paymentIntents/listPaymentIntents';

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
