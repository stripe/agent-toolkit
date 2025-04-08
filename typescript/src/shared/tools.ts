import {z} from 'zod';

// Import tools directly from individual files with default imports
import createCustomerTool from './customers/create';
import listCustomersTool from './customers/list';
import retrieveBalanceTool from './balance/retrieve';
import createInvoiceItemTool from './invoiceItems/create';
import createInvoiceTool from './invoices/create';
import listInvoicesTool from './invoices/list';
import finalizeInvoiceTool from './invoices/finalize';
import createPaymentLinkTool from './paymentLinks/create';
import listPaymentIntentsTool from './paymentIntents/list';
import createProductTool from './products/create';
import listProductsTool from './products/list';
import createPriceTool from './prices/create';
import listPricesTool from './prices/list';
import createRefundTool from './refunds/create';
import listSubscriptionsTool from './subscriptions/list';
import cancelSubscriptionTool from './subscriptions/cancel';
import updateSubscriptionTool from './subscriptions/update';
import searchDocumentationTool from './documentation/search';

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
  // Use tools directly from individual domain files
  createCustomerTool(context),
  listCustomersTool(context),
  retrieveBalanceTool(context),
  createInvoiceItemTool(context),
  createInvoiceTool(context),
  listInvoicesTool(context),
  finalizeInvoiceTool(context),
  createPaymentLinkTool(context),
  listPaymentIntentsTool(context),
  createProductTool(context),
  listProductsTool(context),
  createPriceTool(context),
  listPricesTool(context),
  createRefundTool(context),
  listSubscriptionsTool(context),
  cancelSubscriptionTool(context),
  updateSubscriptionTool(context),
  searchDocumentationTool(context),
];

export default tools;
