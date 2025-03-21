import {z} from 'zod';
import type {Context} from './configuration';

export const createCustomerParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    name: z.string().describe('The name of the customer'),
    email: z.string().email().optional().describe('The email of the customer'),
  });

export const listCustomersParameters = (_context: Context = {}) =>
  z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
    email: z
      .string()
      .optional()
      .describe(
        "A case-sensitive filter on the list based on the customer's email field. The value must be a string."
      ),
  });

export const createProductParameters = (_context: Context = {}) =>
  z.object({
    name: z.string().describe('The name of the product.'),
    description: z
      .string()
      .optional()
      .describe('The description of the product.'),
  });

export const listProductsParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

export const createPriceParameters = (_context: Context = {}) =>
  z.object({
    product: z
      .string()
      .describe('The ID of the product to create the price for.'),
    unit_amount: z
      .number()
      .int()
      .describe('The unit amount of the price in cents.'),
    currency: z.string().describe('The currency of the price.'),
    recurring: z
      .object({
        interval: z
          .enum(['day', 'week', 'month', 'year'])
          .describe('Specifies billing frequency. Either day, week, month or year.'),
        interval_count: z
          .number()
          .int()
          .optional()
          .describe('The number of intervals between subscription billings. For example, interval=month and interval_count=3 bills every 3 months.'),
        usage_type: z
          .enum(['licensed', 'metered'])
          .optional()
          .describe('Configures how the quantity per period should be determined. Can be either metered or licensed.')
      })
      .optional()
      .describe('The recurring components of a price such as interval and usage_type.')
  });

export const listPricesParameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    product: z
      .string()
      .optional()
      .describe('The ID of the product to list prices for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

export const createPaymentLinkParameters = (_context: Context = {}) =>
  z.object({
    price: z
      .string()
      .describe('The ID of the price to create the payment link for.'),
    quantity: z
      .number()
      .int()
      .describe('The quantity of the product to include.'),
  });

export const createInvoiceParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .describe('The ID of the customer to create the invoice for.'),
    days_until_due: z
      .number()
      .int()
      .optional()
      .describe('The number of days until the invoice is due.'),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const listInvoicesParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list invoices for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};
export const createInvoiceItemParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .describe('The ID of the customer to create the invoice item for.'),
    price: z.string().describe('The ID of the price for the item.'),
    invoice: z
      .string()
      .describe('The ID of the invoice to create the item for.'),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const finalizeInvoiceParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    invoice: z.string().describe('The ID of the invoice to finalize.'),
  });

export const retrieveBalanceParameters = (
  _context: Context = {}
): z.AnyZodObject => z.object({});

export const createRefundParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    payment_intent: z
      .string()
      .describe('The ID of the PaymentIntent to refund.'),
    amount: z
      .number()
      .int()
      .optional()
      .describe('The amount to refund in cents.'),
  });

export const listPaymentIntentsParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list payment intents for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};
export const searchDocumentationParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    question: z
      .string()
      .describe(
        'The user question about integrating with Stripe will be used to search the documentation.'
      ),
    language: z
      .enum(['dotnet', 'go', 'java', 'node', 'php', 'ruby', 'python', 'curl'])
      .optional()
      .describe(
        'The programming language to search for in the the documentation.'
      ),
  });
