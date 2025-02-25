import Stripe from 'stripe';
import {
  createCustomer,
  listCustomers,
  createProduct,
  listProducts,
  createPrice,
  listPrices,
  createPaymentLink,
  createInvoice,
  createInvoiceItem,
  finalizeInvoice,
  retrieveBalance,
  createRefund,
  listPaymentIntents,
  createCheckoutSession,
  expireCheckoutSession,
  searchDocumentation,
} from './functions';

import type {Context, UI} from './configuration';

class StripeAPI {
  stripe: Stripe;

  context: Context;

  ui: UI;

  constructor(secretKey: string, context?: Context, ui?: UI) {
    const stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: 'stripe-agent-toolkit-typescript',
        version: '0.4.1',
        url: 'https://github.com/stripe/agent-toolkit',
      },
    });
    this.stripe = stripeClient;
    this.context = context || {};
    this.ui = ui || {};
  }

  async createMeterEvent({
    event,
    customer,
    value,
  }: {
    event: string;
    customer: string;
    value: string;
  }) {
    await this.stripe.billing.meterEvents.create(
      {
        event_name: event,
        payload: {
          stripe_customer_id: customer,
          value: value,
        },
      },
      this.context.account ? {stripeAccount: this.context.account} : undefined
    );
  }

  async run(method: string, arg: any) {
    if (method === 'create_customer') {
      const output = await createCustomer(this.stripe, this.context, arg);
      return output;
    } else if (method === 'list_customers') {
      const output = await listCustomers(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_product') {
      const output = await createProduct(this.stripe, this.context, arg);
      return output;
    } else if (method === 'list_products') {
      const output = await listProducts(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_price') {
      const output = await createPrice(this.stripe, this.context, arg);
      return output;
    } else if (method === 'list_prices') {
      const output = await listPrices(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_payment_link') {
      const output = await createPaymentLink(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_invoice') {
      const output = await createInvoice(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_invoice_item') {
      const output = await createInvoiceItem(this.stripe, this.context, arg);
      return output;
    } else if (method === 'finalize_invoice') {
      const output = await finalizeInvoice(this.stripe, this.context, arg);
      return output;
    } else if (method === 'retrieve_balance') {
      const output = await retrieveBalance(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_refund') {
      const output = await createRefund(this.stripe, this.context, arg);
      return output;
    } else if (method === 'create_checkout_session') {
      const output = await createCheckoutSession(this.stripe, this.ui, arg);
      return output;
    } else if (method === 'expire_checkout_session') {
      const output = await expireCheckoutSession(this.stripe, arg);
      return output;
    } else if (method === 'list_payment_intents') {
      const output = await listPaymentIntents(this.stripe, this.context, arg);
      return output;
    } else if (method == 'search_documentation') {
      const output = await searchDocumentation(this.stripe, this.context, arg);
      return output;
    } else {
      throw new Error('Invalid method ' + method);
    }
  }
}

export default StripeAPI;
