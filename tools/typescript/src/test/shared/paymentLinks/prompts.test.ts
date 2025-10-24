import {createPaymentLinkPrompt} from '@/shared/paymentLinks/createPaymentLink';

describe('createPaymentLinkPrompt', () => {
  it('should return the correct prompt', () => {
    const prompt = createPaymentLinkPrompt({});

    expect(prompt).toContain('This tool will create a payment link in Stripe.');
    expect(prompt).toContain(
      'price (str): The ID of the price to create the payment link for.'
    );
    expect(prompt).toContain(
      'quantity (int): The quantity of the product to include in the payment link.'
    );
    expect(prompt).toContain(
      'redirect_url (str, optional): The URL to redirect to after the payment is completed.'
    );
  });

  it('should return the correct prompt with customer context', () => {
    const prompt = createPaymentLinkPrompt({customer: 'cus_123'});

    expect(prompt).toContain('This tool will create a payment link in Stripe.');
    expect(prompt).toContain(
      'price (str): The ID of the price to create the payment link for.'
    );
    expect(prompt).toContain(
      'quantity (int): The quantity of the product to include in the payment link.'
    );
    expect(prompt).toContain(
      'redirect_url (str, optional): The URL to redirect to after the payment is completed.'
    );
  });
});
