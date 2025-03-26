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
  listInvoicesParameters,
  createInvoiceItemParameters,
  finalizeInvoiceParameters,
  retrieveBalanceParameters,
  createRefundParameters,
  searchDocumentationParameters,
  listPaymentIntentsParameters,
  searchStripeResourcesParameters,
} from './parameters';
import type {Context} from './configuration';

export const createCustomer = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createCustomerParameters>>
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
  params: z.infer<ReturnType<typeof listCustomersParameters>>
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
  params: z.infer<ReturnType<typeof createProductParameters>>
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
  params: z.infer<ReturnType<typeof listProductsParameters>>
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
  params: z.infer<ReturnType<typeof createPriceParameters>>
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
  params: z.infer<ReturnType<typeof listPricesParameters>>
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
  params: z.infer<ReturnType<typeof createPaymentLinkParameters>>
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
  params: z.infer<ReturnType<typeof createInvoiceParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

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

export const listInvoices = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listInvoicesParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const invoices = await stripe.invoices.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return invoices.data;
  } catch (error) {
    return 'Failed to list invoices';
  }
};

export const createInvoiceItem = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createInvoiceItemParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

    const invoiceItem = await stripe.invoiceItems.create(
      // @ts-ignore
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
  params: z.infer<ReturnType<typeof finalizeInvoiceParameters>>
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
  params: z.infer<ReturnType<typeof retrieveBalanceParameters>>
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
  params: z.infer<ReturnType<typeof createRefundParameters>>
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
  params: z.infer<ReturnType<typeof listPaymentIntentsParameters>>
) => {
  try {
    if (context.customer) {
      params.customer = context.customer;
    }

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

export const searchStripeResources = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof searchStripeResourcesParameters>>
) => {
  try {
    const resource = params.resource;

    let results: any[] = [];

    if (resource == 'customers') {
      const raw = await stripe.customers.search({
        query: params.query,
      });
      results = raw.data.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
      }));
    } else if (resource == 'invoices') {
      const raw = await stripe.invoices.search({
        query: params.query,
      });
      results = raw.data.map((invoice) => ({
        id: invoice.id,
        customer: invoice.customer,
      }));
    } else if (resource == 'payment_intents') {
      const raw = await stripe.paymentIntents.search({
        query: params.query,
      });
      results = raw.data.map((paymentIntent) => ({
        id: paymentIntent.id,
        customer: paymentIntent.customer,
        description: paymentIntent.description,
        amount: paymentIntent.amount,
      }));
    } else if (resource == 'prices') {
      const raw = await stripe.prices.search({
        query: params.query,
      });
      results = raw.data.map((price) => ({
        id: price.id,
        product: price.product,
        amount: price.unit_amount,
        currency: price.currency,
      }));
    } else if (resource == 'products') {
      const raw = await stripe.products.search({
        query: params.query,
      });
      results = raw.data.map((product) => ({
        id: product.id,
        name: product.name,
      }));
    } else if (resource == 'subscriptions') {
      const raw = await stripe.subscriptions.search({
        query: params.query,
      });
      results = raw.data.map((subscription) => ({
        id: subscription.id,
        customer: subscription.customer,
      }));
    } else if (resource == 'charges') {
      const raw = await stripe.charges.search({
        query: params.query,
      });
      results = raw.data.map((charge) => ({
        id: charge.id,
        customer: charge.customer,
      }));
    }

    return results;
  } catch (error) {
    return 'Failed to search Stripe resources';
  }
};

export const searchDocumentation = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof searchDocumentationParameters>>
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
