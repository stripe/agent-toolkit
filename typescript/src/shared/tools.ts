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
import {createCouponPrompt, listCouponsPrompt} from '@/shared/coupons/prompts';
import {
  updateDisputePrompt,
  listDisputesPrompt,
} from '@/shared/disputes/prompts';

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
import {
  createCouponParameters,
  listCouponsParameters,
} from '@/shared/coupons/parameters';
import {
  updateDisputeParameters,
  listDisputesParameters,
} from '@/shared/disputes/parameters';

import type {Context} from './configuration';
import Stripe from 'stripe';
import {createCustomer, listCustomers} from './customers/functions';
import {createProduct, listProducts} from './products/functions';
import {createPaymentLink} from './paymentLinks/functions';
import {
  createInvoice,
  finalizeInvoice,
  listInvoices,
} from './invoices/functions';
import {createInvoiceItem} from './invoiceItems/functions';
import {retrieveBalance} from './balance/functions';
import {createRefund} from './refunds/functions';
import {listPaymentIntents} from './paymentIntents/functions';
import {
  cancelSubscription,
  updateSubscription,
} from './subscriptions/functions';
import {listSubscriptions} from './subscriptions/functions';
import {listCoupons} from './coupons/functions';
import {createCoupon} from './coupons/functions';
import {searchDocumentation} from './documentation/functions';
import {createPrice, listPrices} from './prices/functions';
import {updateDispute, listDisputes} from './disputes/functions';

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
  execute: (stripe: Stripe, context: Context, params: any) => Promise<any>;
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
    execute: createCustomer,
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
    execute: listCustomers,
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
    execute: createProduct,
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
    execute: listProducts,
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
    execute: createPrice,
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
    execute: listPrices,
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
    execute: createPaymentLink,
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
    execute: createInvoice,
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
    execute: listInvoices,
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
    execute: createInvoiceItem,
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
    execute: finalizeInvoice,
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
    execute: retrieveBalance,
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
    execute: createRefund,
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
    execute: listPaymentIntents,
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
    execute: listSubscriptions,
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
    execute: cancelSubscription,
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
    execute: updateSubscription,
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
    execute: searchDocumentation,
  },
  {
    method: 'create_coupon',
    name: 'Create Coupon',
    description: createCouponPrompt(context),
    parameters: createCouponParameters(context),
    actions: {
      coupons: {
        create: true,
      },
    },
    execute: createCoupon,
  },
  {
    method: 'list_coupons',
    name: 'List Coupons',
    description: listCouponsPrompt(context),
    parameters: listCouponsParameters(context),
    actions: {
      coupons: {
        read: true,
      },
    },
    execute: listCoupons,
  },
  {
    method: 'update_dispute',
    name: 'Update Dispute',
    description: updateDisputePrompt(context),
    parameters: updateDisputeParameters(context),
    actions: {
      disputes: {
        update: true,
      },
    },
    execute: updateDispute,
  },
  {
    method: 'list_disputes',
    name: 'List Disputes',
    description: listDisputesPrompt(context),
    parameters: listDisputesParameters(context),
    actions: {
      disputes: {
        read: true,
      },
    },
    execute: listDisputes,
  },
];

export default tools;
