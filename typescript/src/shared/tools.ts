import {z} from 'zod';

import {
  createCustomerPrompt,
  listCustomersPrompt,
  createProductPrompt,
  listProductsPrompt,
  createPricePrompt,
  listPricesPrompt,
  createPaymentLinkPrompt,
  createInvoicePrompt,
  listInvoicesPrompt,
  createInvoiceItemPrompt,
  finalizeInvoicePrompt,
  retrieveBalancePrompt,
  createRefundPrompt,
  searchDocumentationPrompt,
  listPaymentIntentsPrompt,
  searchStripeResourcesPrompt,
} from './prompts';

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

export type Tool = {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any, any, any, any>;
  actions: {
    [key: string]: {
      [action: string]: boolean;
    };
  };
};

const tools = (context: Context): Tool[] => [
  {
    method: 'create_customer',
    name: 'Create Customer',
    description: createCustomerPrompt(context),
    parameters: createCustomerParameters(context),
    actions: {
      customers: {
        create: true,
      },
    },
  },
  {
    method: 'list_customers',
    name: 'List Customers',
    description: listCustomersPrompt(context),
    parameters: listCustomersParameters(context),
    actions: {
      customers: {
        read: true,
      },
    },
  },
  {
    method: 'create_product',
    name: 'Create Product',
    description: createProductPrompt(context),
    parameters: createProductParameters(context),
    actions: {
      products: {
        create: true,
      },
    },
  },
  {
    method: 'list_products',
    name: 'List Products',
    description: listProductsPrompt(context),
    parameters: listProductsParameters(context),
    actions: {
      products: {
        read: true,
      },
    },
  },
  {
    method: 'create_price',
    name: 'Create Price',
    description: createPricePrompt(context),
    parameters: createPriceParameters(context),
    actions: {
      prices: {
        create: true,
      },
    },
  },
  {
    method: 'list_prices',
    name: 'List Prices',
    description: listPricesPrompt(context),
    parameters: listPricesParameters(context),
    actions: {
      prices: {
        read: true,
      },
    },
  },
  {
    method: 'create_payment_link',
    name: 'Create Payment Link',
    description: createPaymentLinkPrompt(context),
    parameters: createPaymentLinkParameters(context),
    actions: {
      paymentLinks: {
        create: true,
      },
    },
  },
  {
    method: 'create_invoice',
    name: 'Create Invoice',
    description: createInvoicePrompt(context),
    parameters: createInvoiceParameters(context),
    actions: {
      invoices: {
        create: true,
      },
    },
  },
  {
    method: 'list_invoices',
    name: 'List Invoices',
    description: listInvoicesPrompt(context),
    parameters: listInvoicesParameters(context),
    actions: {
      invoices: {
        read: true,
      },
    },
  },
  {
    method: 'create_invoice_item',
    name: 'Create Invoice Item',
    description: createInvoiceItemPrompt(context),
    parameters: createInvoiceItemParameters(context),
    actions: {
      invoiceItems: {
        create: true,
      },
    },
  },
  {
    method: 'finalize_invoice',
    name: 'Finalize Invoice',
    description: finalizeInvoicePrompt(context),
    parameters: finalizeInvoiceParameters(context),
    actions: {
      invoices: {
        update: true,
      },
    },
  },
  {
    method: 'retrieve_balance',
    name: 'Retrieve Balance',
    description: retrieveBalancePrompt(context),
    parameters: retrieveBalanceParameters(context),
    actions: {
      balance: {
        read: true,
      },
    },
  },
  {
    method: 'create_refund',
    name: 'Create Refund',
    description: createRefundPrompt(context),
    parameters: createRefundParameters(context),
    actions: {
      refunds: {
        create: true,
      },
    },
  },
  {
    method: 'list_payment_intents',
    name: 'List Payment Intents',
    description: listPaymentIntentsPrompt(context),
    parameters: listPaymentIntentsParameters(context),
    actions: {
      paymentIntents: {
        read: true,
      },
    },
  },
  {
    method: 'search_documentation',
    name: 'Search Documentation',
    description: searchDocumentationPrompt(context),
    parameters: searchDocumentationParameters(context),
    actions: {
      documentation: {
        read: true,
      },
    },
  },
  {
    method: 'search_stripe_resources',
    name: 'Search Stripe Resources',
    description: searchStripeResourcesPrompt(context),
    parameters: searchStripeResourcesParameters(context),
    actions: {
      customers: {
        read: true,
      },
      invoices: {
        read: true,
      },
      paymentIntents: {
        read: true,
      },
      prices: {
        read: true,
      },
      products: {
        read: true,
      },
      subscriptions: {
        read: true,
      },
    },
  },
];

export default tools;
