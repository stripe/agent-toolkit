CREATE_CUSTOMER_PROMPT = """
This tool will create a customer in Stripe.

It takes two arguments:
- name (str): The name of the customer.
- email (str, optional): The email of the customer.
"""

LIST_CUSTOMERS_PROMPT = """
This tool will fetch a list of Customers from Stripe.

It takes no input.
"""

CREATE_PRODUCT_PROMPT = """
This tool will create a product in Stripe.

It takes two arguments:
- name (str): The name of the product.
- description (str, optional): The description of the product.
"""

LIST_PRODUCTS_PROMPT = """
This tool will fetch a list of Products from Stripe.

It takes one optional argument:
- limit (int, optional): The number of products to return.
"""

CREATE_PRICE_PROMPT = """
This tool will create a price in Stripe. If a product has not already been
specified, a product should be created first.

It takes three arguments:
- product (str): The ID of the product to create the price for.
- unit_amount (int): The unit amount of the price in cents.
- currency (str): The currency of the price.
"""

LIST_PRICES_PROMPT = """
This tool will fetch a list of Prices from Stripe.

It takes two arguments:
- product (str, optional): The ID of the product to list prices for.
- limit (int, optional): The number of prices to return.
"""

CREATE_PAYMENT_LINK_PROMPT = """
This tool will create a payment link in Stripe.

It takes two arguments:
- price (str): The ID of the price to create the payment link for.
- quantity (int): The quantity of the product to include in the payment link.
"""

LIST_INVOICES_PROMPT = """
This tool will list invoices in Stripe.

It takes two arguments:
- customer (str, optional): The ID of the customer to list the invoices for.
- limit (int, optional): The number of prices to return.
"""

CREATE_INVOICE_PROMPT = """
This tool will create an invoice in Stripe.

It takes one argument:
- customer (str): The ID of the customer to create the invoice for.
"""

CREATE_INVOICE_ITEM_PROMPT = """
This tool will create an invoice item in Stripe.

It takes two arguments:
- customer (str): The ID of the customer to create the invoice item for.
- price (str): The ID of the price to create the invoice item for.
- invoice (str): The ID of the invoice to create the invoice item for.
"""

FINALIZE_INVOICE_PROMPT = """
This tool will finalize an invoice in Stripe.

It takes one argument:
- invoice (str): The ID of the invoice to finalize.
"""

RETRIEVE_BALANCE_PROMPT = """
This tool will retrieve the balance from Stripe. It takes no input.
"""

CREATE_REFUND_PROMPT = """
This tool will refund a payment intent in Stripe.

It takes three arguments:
- payment_intent (str): The ID of the payment intent to refund.
- amount (int, optional): The amount to refund in cents.
- reason (str, optional): The reason for the refund.
"""

LIST_PAYMENT_INTENTS_PROMPT = """
This tool will list payment intents in Stripe.

It takes two arguments:
- customer (str, optional): The ID of the customer to list payment intents for.
- limit (int, optional): The number of payment intents to return.
"""

CREATE_BILLING_PORTAL_SESSION_PROMPT = """
This tool will create a billing portal session.

It takes two arguments:
- customer (str): The ID of the customer to create the invoice item for.
- return_url (str, optional): The default URL to return to afterwards.
"""

LIST_PAYMENT_METHOD_CONFIGS_PROMPT = """
This tool will fetch a list of Payment Method Configurations from Stripe.

It takes one optional argument:
- limit (int, optional): The number of configurations to return.
"""

UPDATE_PAYMENT_METHOD_CONFIG_PROMPT = """
This tool will update a payment method configuration in Stripe.

It takes three arguments:
- configuration (str): The ID of the configuration to update.
- payment_method (str): The payment method type to modify.
- preference (str): Either 'on' or 'off'.
"""
