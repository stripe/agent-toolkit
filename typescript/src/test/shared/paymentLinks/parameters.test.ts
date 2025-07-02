import {createPaymentLinkParameters} from '@/shared/paymentLinks/createPaymentLink';

describe('createPaymentLinkParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = createPaymentLinkParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['price', 'quantity', 'redirect_url']);
    expect(fields.length).toBe(3);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = createPaymentLinkParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual(['price', 'quantity', 'redirect_url']);
  });
});
