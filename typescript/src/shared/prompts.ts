export const createCustomerPrompt = `
This tool will create a customer in Stripe.

It takes two arguments:
- name (str): The name of the customer.
- email (str, optional): The email of the customer.
`;

export const listCustomersPrompt = `
This tool will fetch a list of Customers from Stripe.

It takes no input.
`;

export const createProductPrompt = `
This tool will create a product in Stripe.

It takes two arguments:
- name (str): The name of the product.
- description (str, optional): The description of the product.
`;

export const listProductsPrompt = `
This tool will fetch a list of Products from Stripe.

It takes one optional argument:
- limit (int, optional): The number of products to return.
`;

export const createPricePrompt = `
This tool will create a price in Stripe. If a product has not already been specified, a product should be created first.

It takes three arguments:
- product (str): The ID of the product to create the price for.
- unit_amount (int): The unit amount of the price in cents.
- currency (str): The currency of the price.
`;

export const listPricesPrompt = `
This tool will fetch a list of Prices from Stripe.

It takes two arguments.
- product (str, optional): The ID of the product to list prices for.
- limit (int, optional): The number of prices to return.
`;

export const createPaymentLinkPrompt = `
This tool will create a payment link in Stripe.

It takes two arguments:
- price (str): The ID of the price to create the payment link for.
- quantity (int): The quantity of the product to include in the payment link.
`;

export const createInvoicePrompt = `
This tool will create an invoice in Stripe.

It takes one argument:
- customer (str): The ID of the customer to create the invoice for.
`;

export const createInvoiceItemPrompt = `
This tool will create an invoice item in Stripe.

It takes two arguments:
- customer (str): The ID of the customer to create the invoice item for.
- price (str): The ID of the price to create the invoice item for.
`;

export const finalizeInvoicePrompt = `
This tool will finalize an invoice in Stripe.

It takes one argument:
- invoice (str): The ID of the invoice to finalize.
`;

export const retrieveBalancePrompt = `
This tool will retrieve the balance from Stripe. It takes no input.
`;

export const createRefundPrompt = `
This tool will refund a payment intent in Stripe.

It takes three arguments:
- payment_intent (str): The ID of the payment intent to refund.
- amount (int, optional): The amount to refund in cents.
- reason (str, optional): The reason for the refund.
`;

export const listPaymentIntentsPrompt = `
This tool will list payment intents in Stripe.

It takes two arguments:
- customer (str, optional): The ID of the customer to list payment intents for.
- limit (int, optional): The number of payment intents to return.
`;

export const createCheckoutSessionPrompt = `
This tool will create a checkout session in Stripe.

It takes one argument:
- line_items (array): List of up to 100 line items to include in the checkout session.
`;

export const expireCheckoutSessionPrompt = `
This tool will expire a checkout session in Stripe.

It takes one argument:
- session (str): The ID of the checkout session to expire.
`;

export const searchDocumentationPrompt = `
This tool will take in a user question about integrating with Stripe in their application, then search and retrieve relevant Stripe documentation to answer the question.

It takes two arguments:
- question (str): The user question to search an answer for in the Stripe documentation.
- language (str, optional): The programming language to search for in the the documentation.
`;
