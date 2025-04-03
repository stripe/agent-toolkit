import {z} from 'zod';

import {
  createCustomerPrompt,
  listCustomersPrompt,
} from '@/shared/customers/prompts';
import {
  createProductPrompt,
  listProductsPrompt,
} from '@/shared/products/prompts';
import {createPricePrompt, listPricesPrompt} from '@/shared/prices/prompts';
import {createPaymentLinkPrompt} from '@/shared/paymentLinks/prompts';
import {
  createInvoicePrompt,
  listInvoicesPrompt,
  finalizeInvoicePrompt,
} from '@/shared/invoices/prompts';
import {createInvoiceItemPrompt} from '@/shared/invoiceItems/prompts';
import {retrieveBalancePrompt} from '@/shared/balance/prompts';
import {createRefundPrompt} from '@/shared/refunds/prompts';
import {searchDocumentationPrompt} from '@/shared/documentation/prompts';
import {listPaymentIntentsPrompt} from '@/shared/paymentIntents/prompts';
import {
  cancelSubscriptionPrompt,
  listSubscriptionsPrompt,
  updateSubscriptionPrompt,
} from '@/shared/subscriptions/prompts';

import {
  createCustomerParameters,
  listCustomersParameters,
} from '@/shared/customers/parameters';
import {
  createProductParameters,
  listProductsParameters,
} from '@/shared/products/parameters';
import {
  createPriceParameters,
  listPricesParameters,
} from '@/shared/prices/parameters';
import {createPaymentLinkParameters} from '@/shared/paymentLinks/parameters';
import {
  createInvoiceParameters,
  listInvoicesParameters,
  finalizeInvoiceParameters,
} from '@/shared/invoices/parameters';
import {createInvoiceItemParameters} from '@/shared/invoiceItems/parameters';
import {retrieveBalanceParameters} from '@/shared/balance/parameters';
import {createRefundParameters} from '@/shared/refunds/parameters';
import {searchDocumentationParameters} from '@/shared/documentation/parameters';
import {listPaymentIntentsParameters} from '@/shared/paymentIntents/parameters';
import {
  cancelSubscriptionParameters,
  listSubscriptionsParameters,
  updateSubscriptionParameters,
} from '@/shared/subscriptions/parameters';

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
    method: 'list_subscriptions',
    name: 'List Subscriptions',
    description: listSubscriptionsPrompt(context),
    parameters: listSubscriptionsParameters(context),
    actions: {
      subscriptions: {
        read: true,
      },
    },
  },
  {
    method: 'cancel_subscription',
    name: 'Cancel Subscription',
    description: cancelSubscriptionPrompt(context),
    parameters: cancelSubscriptionParameters(context),
    actions: {
      subscriptions: {
        update: true,
      },
    },
  },
  {
    method: 'update_subscription',
    name: 'Update Subscription',
    description: updateSubscriptionPrompt(context),
    parameters: updateSubscriptionParameters(context),
    actions: {
      subscriptions: {
        update: true,
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
];

export default tools;
