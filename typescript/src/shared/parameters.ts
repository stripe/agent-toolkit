import {z} from 'zod';

export const createCustomerParameters = z.object({
  name: z.string().describe('The name of the customer'),
  email: z.string().email().optional().describe('The email of the customer'),
});

export const listCustomersParameters = z.object({
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

export const createProductParameters = z.object({
  name: z.string().describe('The name of the product.'),
  description: z
    .string()
    .optional()
    .describe('The description of the product.'),
});

export const listProductsParameters = z.object({
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

export const createPriceParameters = z.object({
  product: z
    .string()
    .describe('The ID of the product to create the price for.'),
  unit_amount: z
    .number()
    .int()
    .describe('The unit amount of the price in cents.'),
  currency: z.string().describe('The currency of the price.'),
});

export const listPricesParameters = z.object({
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

export const createPaymentLinkParameters = z.object({
  price: z
    .string()
    .describe('The ID of the price to create the payment link for.'),
  quantity: z
    .number()
    .int()
    .describe('The quantity of the product to include.'),
});

export const createInvoiceParameters = z.object({
  customer: z
    .string()
    .describe('The ID of the customer to create the invoice for.'),
  days_until_due: z
    .number()
    .int()
    .optional()
    .describe('The number of days until the invoice is due.'),
});

export const createInvoiceItemParameters = z.object({
  customer: z
    .string()
    .describe('The ID of the customer to create the invoice item for.'),
  price: z.string().describe('The ID of the price for the item.'),
  invoice: z.string().describe('The ID of the invoice to create the item for.'),
});

export const finalizeInvoiceParameters = z.object({
  invoice: z.string().describe('The ID of the invoice to finalize.'),
});

export const retrieveBalanceParameters = z.object({});

export const createRefundParameters = z.object({
  payment_intent: z.string().describe('The ID of the PaymentIntent to refund.'),
  amount: z
    .number()
    .int()
    .optional()
    .describe('The amount to refund in cents.'),
});

export const listPaymentIntentsParameters = z.object({
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

export const createCheckoutSessionParameters = z.object({
  line_items: z
    .array(
      z.object({
        price: z.string().describe('The ID of the price to include.'),
        quantity: z.number().int().describe('The quantity of the item.'),
      })
    )
    .min(1)
    .max(100)
    .describe(
      'List of up to 100 line items to include in the checkout session.'
    ),
});

export const expireCheckoutSessionParameters = z.object({
  session: z.string().describe('The ID of the checkout session to expire.'),
});

export const searchDocumentationParameters = z.object({
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
