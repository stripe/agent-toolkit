import {listPaymentMethodConfigsParameters} from '@/shared/paymentMethodConfigurations/listPaymentMethodConfigs';
import {updatePaymentMethodConfigParameters} from '@/shared/paymentMethodConfigurations/updatePaymentMethodConfig';

describe('listPaymentMethodConfigsParameters', () => {
  it('contains limit field', () => {
    const params = listPaymentMethodConfigsParameters();
    expect(Object.keys(params.shape)).toEqual(['limit']);
  });
});

describe('updatePaymentMethodConfigParameters', () => {
  it('contains required fields', () => {
    const params = updatePaymentMethodConfigParameters();
    expect(Object.keys(params.shape)).toEqual([
      'configuration',
      'payment_method',
      'preference',
    ]);
  });
});
