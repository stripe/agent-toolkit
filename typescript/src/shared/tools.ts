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
  createInvoiceItemPrompt,
  finalizeInvoicePrompt,
  retrieveBalancePrompt,
  createRefundPrompt,
  listPaymentIntentsPrompt,
  createCheckoutSessionPrompt,
  expireCheckoutSessionPrompt,
  searchDocumentationPrompt,
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
  createInvoiceItemParameters,
  finalizeInvoiceParameters,
  retrieveBalanceParameters,
  createRefundParameters,
  listPaymentIntentsParameters,
  createCheckoutSessionParameters,
  expireCheckoutSessionParameters,
  searchDocumentationParameters,
} from './parameters';

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

const tools: Tool[] = [
  {
    method: 'create_customer',
    name: 'Create Customer',
    description: createCustomerPrompt,
    parameters: createCustomerParameters,
    actions: {
      customers: {
        create: true,
      },
    },
  },
  {
    method: 'list_customers',
    name: 'List Customers',
    description: listCustomersPrompt,
    parameters: listCustomersParameters,
    actions: {
      customers: {
        read: true,
      },
    },
  },
  {
    method: 'create_product',
    name: 'Create Product',
    description: createProductPrompt,
    parameters: createProductParameters,
    actions: {
      products: {
        create: true,
      },
    },
  },
  {
    method: 'list_products',
    name: 'List Products',
    description: listProductsPrompt,
    parameters: listProductsParameters,
    actions: {
      products: {
        read: true,
      },
    },
  },
  {
    method: 'create_price',
    name: 'Create Price',
    description: createPricePrompt,
    parameters: createPriceParameters,
    actions: {
      prices: {
        create: true,
      },
    },
  },
  {
    method: 'list_prices',
    name: 'List Prices',
    description: listPricesPrompt,
    parameters: listPricesParameters,
    actions: {
      prices: {
        read: true,
      },
    },
  },
  {
    method: 'create_payment_link',
    name: 'Create Payment Link',
    description: createPaymentLinkPrompt,
    parameters: createPaymentLinkParameters,
    actions: {
      paymentLinks: {
        create: true,
      },
    },
  },
  {
    method: 'create_invoice',
    name: 'Create Invoice',
    description: createInvoicePrompt,
    parameters: createInvoiceParameters,
    actions: {
      invoices: {
        create: true,
      },
    },
  },
  {
    method: 'create_invoice_item',
    name: 'Create Invoice Item',
    description: createInvoiceItemPrompt,
    parameters: createInvoiceItemParameters,
    actions: {
      invoiceItems: {
        create: true,
      },
    },
  },
  {
    method: 'finalize_invoice',
    name: 'Finalize Invoice',
    description: finalizeInvoicePrompt,
    parameters: finalizeInvoiceParameters,
    actions: {
      invoices: {
        update: true,
      },
    },
  },
  {
    method: 'retrieve_balance',
    name: 'Retrieve Balance',
    description: retrieveBalancePrompt,
    parameters: retrieveBalanceParameters,
    actions: {
      balance: {
        read: true,
      },
    },
  },
  {
    method: 'create_refund',
    name: 'Create Refund',
    description: createRefundPrompt,
    parameters: createRefundParameters,
    actions: {
      refunds: {
        create: true,
      },
    },
  },
  {
    method: 'list_payment_intents',
    name: 'List Payment Intents',
    description: listPaymentIntentsPrompt,
    parameters: listPaymentIntentsParameters,
    actions: {
      paymentIntents: {
        read: true,
      },
    },
  },
  {
    method: 'create_checkout_session',
    name: 'Create Checkout Session',
    description: createCheckoutSessionPrompt,
    parameters: createCheckoutSessionParameters,
    actions: {
      checkoutSessions: {
        create: true,
      },
    },
  },
  {
    method: 'expire_checkout_session',
    name: 'Expire Checkout Session',
    description: expireCheckoutSessionPrompt,
    parameters: expireCheckoutSessionParameters,
    actions: {
      checkoutSessions: {
        update: true,
      },
    },
  },
  {
    method: 'search_documentation',
    name: 'Search Documentation',
    description: searchDocumentationPrompt,
    parameters: searchDocumentationParameters,
    actions: {
      documentation: {
        read: true,
      },
    },
  },
];

export default tools;
