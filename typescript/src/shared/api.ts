import Stripe from 'stripe';
import {execute as createCustomer} from './customers/create';
import {execute as listCustomers} from './customers/list';
import {execute as retrieveBalance} from './balance/retrieve';
import {execute as createInvoiceItem} from './invoiceItems/create';
import {execute as createInvoice} from './invoices/create';
import {execute as listInvoices} from './invoices/list';
import {execute as finalizeInvoice} from './invoices/finalize';
import {execute as createPaymentLink} from './paymentLinks/create';
import {execute as listPaymentIntents} from './paymentIntents/list';
import {execute as createProduct} from './products/create';
import {execute as listProducts} from './products/list';
import {execute as createPrice} from './prices/create';
import {execute as listPrices} from './prices/list';
import {execute as createRefund} from './refunds/create';
import {execute as listSubscriptions} from './subscriptions/list';
import {execute as cancelSubscription} from './subscriptions/cancel';
import {execute as updateSubscription} from './subscriptions/update';
import {execute as searchDocumentation} from './documentation/search';

import type {Context} from './configuration';

const TOOLKIT_HEADER = 'stripe-agent-toolkit-typescript';
const MCP_HEADER = 'stripe-mcp';

class StripeAPI {
  stripe: Stripe;

  context: Context;

  constructor(secretKey: string, context?: Context) {
    const stripeClient = new Stripe(secretKey, {
      appInfo: {
        name:
          context?.mode === 'modelcontextprotocol'
            ? MCP_HEADER
            : TOOLKIT_HEADER,
        version: '0.6.0',
        url: 'https://github.com/stripe/agent-toolkit',
      },
    });
    this.stripe = stripeClient;
    this.context = context || {};
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
      const output = JSON.stringify(
        await createCustomer(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'list_customers') {
      const output = JSON.stringify(
        await listCustomers(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'create_product') {
      const output = JSON.stringify(
        await createProduct(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'list_products') {
      const output = JSON.stringify(
        await listProducts(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'create_price') {
      const output = JSON.stringify(
        await createPrice(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'list_prices') {
      const output = JSON.stringify(
        await listPrices(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'create_payment_link') {
      const output = JSON.stringify(
        await createPaymentLink(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'create_invoice') {
      const output = JSON.stringify(
        await createInvoice(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'list_invoices') {
      const output = JSON.stringify(
        await listInvoices(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'create_invoice_item') {
      const output = JSON.stringify(
        await createInvoiceItem(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'finalize_invoice') {
      const output = JSON.stringify(
        await finalizeInvoice(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'retrieve_balance') {
      const output = JSON.stringify(
        await retrieveBalance(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'create_refund') {
      const output = JSON.stringify(
        await createRefund(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'list_payment_intents') {
      const output = JSON.stringify(
        await listPaymentIntents(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'list_subscriptions') {
      const output = JSON.stringify(
        await listSubscriptions(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'update_subscription') {
      const output = JSON.stringify(
        await updateSubscription(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'cancel_subscription') {
      const output = JSON.stringify(
        await cancelSubscription(this.stripe, this.context, arg)
      );
      return output;
    } else if (method === 'search_documentation') {
      const output = JSON.stringify(
        await searchDocumentation(this.stripe, this.context, arg)
      );
      return output;
    } else {
      throw new Error('Invalid method ' + method);
    }
  }
}

export default StripeAPI;
