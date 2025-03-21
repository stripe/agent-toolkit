import type {Context} from './configuration';

export const createCustomerPrompt = (_context: Context = {}) => `
This tool will create a customer in Stripe.

It takes two arguments:
- name (str): The name of the customer.
- email (str, optional): The email of the customer.
`;

export const listCustomersPrompt = (_context: Context = {}) => `
This tool will fetch a list of Customers from Stripe.

It takes no input.
`;

export const createProductPrompt = (_context: Context = {}) => `
This tool will create a product in Stripe.

It takes two arguments:
- name (str): The name of the product.
- description (str, optional): The description of the product.
`;

export const listProductsPrompt = (_context: Context = {}) => `
This tool will fetch a list of Products from Stripe.

It takes one optional argument:
- limit (int, optional): The number of products to return.
`;

export const createPricePrompt = (_context: Context = {}) => `
This tool will create a price in Stripe. If a product has not already been specified, a product should be created first.

It takes four arguments:
- product (str): The ID of the product to create the price for.
- unit_amount (int): The unit amount of the price in cents.
- currency (str): The currency of the price.
- recurring (dict, optional): The recurring components of a price such as interval and usage_type. Example: {"interval": "month"} for monthly recurring billing.
`;

export const listPricesPrompt = (_context: Context = {}) => `
This tool will fetch a list of Prices from Stripe.

It takes two arguments.
- product (str, optional): The ID of the product to list prices for.
- limit (int, optional): The number of prices to return.
`;

export const createPaymentLinkPrompt = (_context: Context = {}) => `
This tool will create a payment link in Stripe.

It takes two arguments:
- price (str): The ID of the price to create the payment link for.
- quantity (int): The quantity of the product to include in the payment link.
`;

export const createInvoicePrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? ''
    : `- customer (str): The ID of the customer to create the invoice for.\n`;

  return `
This tool will create an invoice in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- days_until_due (int, optional): The number of days until the invoice is due.
`;
};

export const listInvoicesPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? ''
    : `- customer (str, optional): The ID of the customer to list invoices for.\n`;

  return `
This tool will fetch a list of Invoices from Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- limit (int, optional): The number of invoices to return.
`;
};

export const createInvoiceItemPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? ''
    : `- customer (str): The ID of the customer to create the invoice item for.\n`;

  return `
This tool will create an invoice item in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- price (str): The ID of the price to create the invoice item for.
`;
};

export const finalizeInvoicePrompt = (_context: Context = {}) => `
This tool will finalize an invoice in Stripe.

It takes one argument:
- invoice (str): The ID of the invoice to finalize.
`;

export const retrieveBalancePrompt = (_context: Context = {}) => `
This tool will retrieve the balance from Stripe. It takes no input.
`;

export const createRefundPrompt = (_context: Context = {}) => `
This tool will refund a payment intent in Stripe.

It takes three arguments:
- payment_intent (str): The ID of the payment intent to refund.
- amount (int, optional): The amount to refund in cents.
- reason (str, optional): The reason for the refund.
`;

export const listPaymentIntentsPrompt = (context: Context = {}) => {
  const customerArg = context.customer
    ? ''
    : `- customer (str, optional): The ID of the customer to list payment intents for.\n`;

  return `
This tool will list payment intents in Stripe.

It takes ${context.customer ? 'one' : 'two'} argument${context.customer ? '' : 's'}:
${customerArg}
- limit (int, optional): The number of payment intents to return.
`;
};

export const searchDocumentationPrompt = (_context: Context = {}) => `
This tool will take in a user question about integrating with Stripe in their application, then search and retrieve relevant Stripe documentation to answer the question.

It takes two arguments:
- question (str): The user question to search an answer for in the Stripe documentation.
- language (str, optional): The programming language to search for in the the documentation.
`;
