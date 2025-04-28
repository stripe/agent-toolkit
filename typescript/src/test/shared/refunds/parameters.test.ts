import {createRefundParameters} from '@/shared/refunds/createRefund';

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
