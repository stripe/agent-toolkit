import Stripe from 'stripe';
import {z} from 'zod';
import {
  createCustomerParameters,
  listCustomersParameters,
  createProductParameters,
  listProductsParameters,
  createPriceParameters,
  listPricesParameters,
  createPaymentLinkParameters,
  createInvoiceParameters,
  createInvoiceItemParameters,
  finalizeInvoiceParameters,
  retrieveBalanceParameters,
  createRefundParameters,
  listPaymentIntentsParameters,
  createCheckoutSessionParameters,
  expireCheckoutSessionParameters,
  searchDocumentationParameters,
} from './parameters';
import type {Context, UI} from './configuration';

export const createCustomer = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createCustomerParameters>
) => {
  try {
    const customer = await stripe.customers.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: customer.id};
  } catch (error) {
    return 'Failed to create customer';
  }
};

export const listCustomers = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof listCustomersParameters>
) => {
  try {
    const customers = await stripe.customers.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return customers.data.map((customer) => ({id: customer.id}));
  } catch (error) {
    return 'Failed to list customers';
  }
};

export const createProduct = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createProductParameters>
) => {
  try {
    const product = await stripe.products.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return product;
  } catch (error) {
    return 'Failed to create product';
  }
};

export const listProducts = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof listProductsParameters>
) => {
  try {
    const products = await stripe.products.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return products.data;
  } catch (error) {
    return 'Failed to list products';
  }
};

export const createPrice = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createPriceParameters>
) => {
  try {
    const price = await stripe.prices.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return price;
  } catch (error) {
    return 'Failed to create price';
  }
};

export const listPrices = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof listPricesParameters>
) => {
  try {
    const prices = await stripe.prices.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return prices.data;
  } catch (error) {
    return 'Failed to list prices';
  }
};

export const createPaymentLink = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createPaymentLinkParameters>
) => {
  try {
    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: [params],
      },
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: paymentLink.id, url: paymentLink.url};
  } catch (error) {
    return 'Failed to create payment link';
  }
};

export const createInvoice = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createInvoiceParameters>
) => {
  try {
    const invoice = await stripe.invoices.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: invoice.id,
      url: invoice.hosted_invoice_url,
      customer: invoice.customer,
      status: invoice.status,
    };
  } catch (error) {
    return 'Failed to create invoice';
  }
};

export const createInvoiceItem = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createInvoiceItemParameters>
) => {
  try {
    const invoiceItem = await stripe.invoiceItems.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: invoiceItem.id,
      invoice: invoiceItem.invoice,
    };
  } catch (error) {
    return 'Failed to create invoice item';
  }
};

export const finalizeInvoice = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof finalizeInvoiceParameters>
) => {
  try {
    const invoice = await stripe.invoices.finalizeInvoice(
      params.invoice,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {
      id: invoice.id,
      url: invoice.hosted_invoice_url,
      customer: invoice.customer,
      status: invoice.status,
    };
  } catch (error) {
    return 'Failed to finalize invoice';
  }
};

export const retrieveBalance = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof retrieveBalanceParameters>
) => {
  try {
    const balance = await stripe.balance.retrieve(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return balance;
  } catch (error) {
    return 'Failed to retrieve balance';
  }
};

export const createRefund = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof createRefundParameters>
) => {
  try {
    const refund = await stripe.refunds.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return refund;
  } catch (error) {
    return 'Failed to create refund';
  }
};

export const listPaymentIntents = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof listPaymentIntentsParameters>
) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return paymentIntents.data.map((paymentIntent) => ({
      id: paymentIntent.id,
      customer: paymentIntent.customer,
      description: paymentIntent.description,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    }));
  } catch (error) {
    return 'Failed to list payment intents';
  }
};

export const createCheckoutSession = async (
  stripe: Stripe,
  ui: UI,
  params: z.infer<typeof createCheckoutSessionParameters>
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      ...params,
      mode: ui.checkout?.mode,
      ui_mode: ui.checkout?.ui_mode,
      redirect_on_completion: ui.checkout?.return_url ? 'always' : 'never',
      return_url: ui.checkout?.return_url,
      success_url: ui.checkout?.success_url,
    });
    return {
      id: session.id,
      status: session.status,
    };
  } catch (error) {
    return 'Failed to create checkout session';
  }
};

export const expireCheckoutSession = async (
  stripe: Stripe,
  params: z.infer<typeof expireCheckoutSessionParameters>
) => {
  try {
    const session = await stripe.checkout.sessions.expire(params.session);
    return {
      id: session.id,
      status: session.status,
    };
  } catch (error) {
    return 'Failed to expire checkout session';
  }
};

export const searchDocumentation = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<typeof searchDocumentationParameters>
) => {
  try {
    const endpoint = 'https://ai.stripe.com/search';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify(params),
    });

    // If status not in 200-299 range, throw error
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data?.sources;
  } catch (error) {
    console.error('Error searching documentation:', error);
    return 'Failed to search documentation';
  }
};
