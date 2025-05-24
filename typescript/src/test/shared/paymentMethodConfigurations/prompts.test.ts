import {listPaymentMethodConfigsPrompt} from '@/shared/paymentMethodConfigurations/listPaymentMethodConfigs';
import {updatePaymentMethodConfigPrompt} from '@/shared/paymentMethodConfigurations/updatePaymentMethodConfig';

describe('listPaymentMethodConfigsPrompt', () => {
  it('mentions limit argument', () => {
    const prompt = listPaymentMethodConfigsPrompt();
    expect(prompt).toContain('limit');
  });
});

describe('updatePaymentMethodConfigPrompt', () => {
  it('mentions configuration argument', () => {
    const prompt = updatePaymentMethodConfigPrompt();
    expect(prompt).toContain('configuration');
    expect(prompt).toContain('preference');
  });
});
