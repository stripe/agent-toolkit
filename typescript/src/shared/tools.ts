import {z} from 'zod';

import createCustomerTool from '@/shared/customers/createCustomer';
import listCustomersTool from '@/shared/customers/listCustomers';
import createProductTool from '@/shared/products/createProduct';
import listProductsTool from '@/shared/products/listProducts';
import createPriceTool from '@/shared/prices/createPrice';
import listPricesTool from '@/shared/prices/listPrices';
import createPaymentLinkTool from '@/shared/paymentLinks/createPaymentLink';
import createInvoiceTool from '@/shared/invoices/createInvoice';
import listInvoicesTool from '@/shared/invoices/listInvoices';
import createInvoiceItemTool from '@/shared/invoiceItems/createInvoiceItem';
import finalizeInvoiceTool from '@/shared/invoices/finalizeInvoice';
import retrieveBalanceTool from '@/shared/balance/retrieveBalance';
import listCouponsTool from '@/shared/coupons/listCoupons';
import createCouponTool from '@/shared/coupons/createCoupon';
import createRefundTool from '@/shared/refunds/createRefund';
import listPaymentIntentsTool from '@/shared/paymentIntents/listPaymentIntents';
import listSubscriptionsTool from '@/shared/subscriptions/listSubscriptions';
import cancelSubscriptionTool from '@/shared/subscriptions/cancelSubscription';
import updateSubscriptionTool from '@/shared/subscriptions/updateSubscription';
import searchDocumentationTool from '@/shared/documentation/searchDocumentation';
import listDisputesTool from '@/shared/disputes/listDisputes';
import updateDisputeTool from '@/shared/disputes/updateDispute';
import listPaymentMethodConfigsTool from '@/shared/paymentMethodConfigurations/listPaymentMethodConfigs';
import updatePaymentMethodConfigTool from '@/shared/paymentMethodConfigurations/updatePaymentMethodConfig';

import {Context} from './configuration';
import Stripe from 'stripe';

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
  createCustomerTool(context),
  listCustomersTool(context),
  createProductTool(context),
  listProductsTool(context),
  createPriceTool(context),
  listPricesTool(context),
  createPaymentLinkTool(context),
  createInvoiceTool(context),
  listInvoicesTool(context),
  createInvoiceItemTool(context),
  finalizeInvoiceTool(context),
  retrieveBalanceTool(context),
  createRefundTool(context),
  listPaymentIntentsTool(context),
  listSubscriptionsTool(context),
  cancelSubscriptionTool(context),
  updateSubscriptionTool(context),
  listPaymentMethodConfigsTool(context),
  updatePaymentMethodConfigTool(context),
  searchDocumentationTool(context),
  listCouponsTool(context),
  createCouponTool(context),
  updateDisputeTool(context),
  listDisputesTool(context),
];

export default tools;
