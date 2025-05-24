import {listPaymentMethodConfigs} from '@/shared/paymentMethodConfigurations/listPaymentMethodConfigs';
import {updatePaymentMethodConfig} from '@/shared/paymentMethodConfigurations/updatePaymentMethodConfig';

const Stripe = jest.fn().mockImplementation(() => ({
  paymentMethodConfigurations: {
    list: jest.fn(),
    update: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake');
});

describe('listPaymentMethodConfigs', () => {
  it('lists configurations', async () => {
    const mockConfigs = {data: [{id: 'pmc_123'}]};
    stripe.paymentMethodConfigurations.list.mockResolvedValue(mockConfigs);
    const result = await listPaymentMethodConfigs(stripe, {}, {});
    expect(stripe.paymentMethodConfigurations.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockConfigs.data);
  });

  it('includes account if in context', async () => {
    const mockConfigs = {data: []};
    stripe.paymentMethodConfigurations.list.mockResolvedValue(mockConfigs);
    const context = {account: 'acct_123'};
    await listPaymentMethodConfigs(stripe, context, {});
    expect(stripe.paymentMethodConfigurations.list).toHaveBeenCalledWith({}, {stripeAccount: 'acct_123'});
  });
});

describe('updatePaymentMethodConfig', () => {
  it('updates configuration', async () => {
    const mockConfig = {id: 'pmc_123'};
    stripe.paymentMethodConfigurations.update.mockResolvedValue(mockConfig);
    const result = await updatePaymentMethodConfig(stripe, {}, {
      configuration: 'pmc_123',
      payment_method: 'link',
      preference: 'on',
    });
    expect(stripe.paymentMethodConfigurations.update).toHaveBeenCalledWith(
      'pmc_123',
      {link: {display_preference: {preference: 'on'}}},
      undefined
    );
    expect(result).toEqual({id: 'pmc_123'});
  });
});
