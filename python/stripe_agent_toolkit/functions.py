import stripe
from typing import Optional
from .configuration import Context


def create_customer(context: Context, name: str, email: Optional[str] = None):
    """
    Create a customer.

    Parameters:
        name (str): The name of the customer.
        email (str, optional): The email address of the customer.

    Returns:
        stripe.Customer: The created customer.
    """
    customer_data: dict = {"name": name}
    if email:
        customer_data["email"] = email
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            customer_data["stripe_account"] = account

    customer = stripe.Customer.create(**customer_data)
    return {"id": customer.id}


def list_customers(
    context: Context,
    email: Optional[str] = None,
    limit: Optional[int] = None,
):
    """
    List Customers.

    Parameters:
        email (str, optional): The email address of the customer.
        limit (int, optional): The number of customers to return.

    Returns:
        stripe.ListObject: A list of customers.
    """
    customer_data: dict = {}
    if email:
        customer_data["email"] = email
    if limit:
        customer_data["limit"] = limit
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            customer_data["stripe_account"] = account

    customers = stripe.Customer.list(**customer_data)
    return [{"id": customer.id} for customer in customers.data]


def create_product(
    context: Context, name: str, description: Optional[str] = None
):
    """
    Create a product.

    Parameters:
        name (str): The name of the product.
        description (str, optional): The description of the product.

    Returns:
        stripe.Product: The created product.
    """
    product_data: dict = {"name": name}
    if description:
        product_data["description"] = description
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            product_data["stripe_account"] = account

    return stripe.Product.create(**product_data)


def list_products(context: Context, limit: Optional[int] = None):
    """
    List Products.
    Parameters:
        limit (int, optional): The number of products to return.

    Returns:
        stripe.ListObject: A list of products.
    """
    product_data: dict = {}
    if limit:
        product_data["limit"] = limit
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            product_data["stripe_account"] = account

    return stripe.Product.list(**product_data).data


def create_price(
    context: Context, product: str, currency: str, unit_amount: int
):
    """
    Create a price.

    Parameters:
        product (str): The ID of the product.
        currency (str): The currency of the price.
        unit_amount (int): The unit amount of the price.

    Returns:
        stripe.Price: The created price.
    """
    price_data: dict = {
        "product": product,
        "currency": currency,
        "unit_amount": unit_amount,
    }
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            price_data["stripe_account"] = account

    return stripe.Price.create(**price_data)


def list_prices(
    context: Context,
    product: Optional[str] = None,
    limit: Optional[int] = None,
):
    """
    List Prices.

    Parameters:
        product (str, optional): The ID of the product to list prices for.
        limit (int, optional): The number of prices to return.

    Returns:
        stripe.ListObject: A list of prices.
    """
    prices_data: dict = {}
    if product:
        prices_data["product"] = product
    if limit:
        prices_data["limit"] = limit
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            prices_data["stripe_account"] = account

    return stripe.Price.list(**prices_data).data


def create_payment_link(context: Context, price: str, quantity: int):
    """
    Create a payment link.

    Parameters:
        price (str): The ID of the price.
        quantity (int): The quantity of the product.

    Returns:
        stripe.PaymentLink: The created payment link.
    """
    payment_link_data: dict = {
        "line_items": [{"price": price, "quantity": quantity}],
    }
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            payment_link_data["stripe_account"] = account

    payment_link = stripe.PaymentLink.create(**payment_link_data)

    return {"id": payment_link.id, "url": payment_link.url}


def create_invoice(context: Context, customer: str, days_until_due: int = 30):
    """
    Create an invoice.

    Parameters:
        customer (str): The ID of the customer.
        days_until_due (int, optional): The number of days until the
        invoice is due.

    Returns:
        stripe.Invoice: The created invoice.
    """
    invoice_data: dict = {
        "customer": customer,
        "collection_method": "send_invoice",
        "days_until_due": days_until_due,
    }
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            invoice_data["stripe_account"] = account

    invoice = stripe.Invoice.create(**invoice_data)

    return {
        "id": invoice.id,
        "hosted_invoice_url": invoice.hosted_invoice_url,
        "customer": invoice.customer,
        "status": invoice.status,
    }


def create_invoice_item(
    context: Context, customer: str, price: str, invoice: str
):
    """
    Create an invoice item.

    Parameters:
        customer (str): The ID of the customer.
        price (str): The ID of the price.
        invoice (str): The ID of the invoice.

    Returns:
        stripe.InvoiceItem: The created invoice item.
    """
    invoice_item_data: dict = {
        "customer": customer,
        "price": price,
        "invoice": invoice,
    }
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            invoice_item_data["stripe_account"] = account

    invoice_item = stripe.InvoiceItem.create(**invoice_item_data)

    return {"id": invoice_item.id, "invoice": invoice_item.invoice}


def finalize_invoice(context: Context, invoice: str):
    """
    Finalize an invoice.

    Parameters:
        invoice (str): The ID of the invoice.

    Returns:
        stripe.Invoice: The finalized invoice.
    """
    invoice_data: dict = {"invoice": invoice}
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            invoice_data["stripe_account"] = account

    invoice_object = stripe.Invoice.finalize_invoice(**invoice_data)

    return {
        "id": invoice_object.id,
        "hosted_invoice_url": invoice_object.hosted_invoice_url,
        "customer": invoice_object.customer,
        "status": invoice_object.status,
    }


def retrieve_balance(
    context: Context,
):
    """
    Retrieve the balance.

    Returns:
        stripe.Balance: The balance.
    """
    balance_data: dict = {}
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            balance_data["stripe_account"] = account

    return stripe.Balance.retrieve(**balance_data)


def create_refund(
    context: Context, payment_intent: str, amount: Optional[int] = None
):
    """
    Create a refund.

    Parameters:
        payment_intent (str): The ID of the payment intent.
        amount (int, optional): The amount to refund in cents.

    Returns:
        stripe.Refund: The created refund.
    """
    refund_data: dict = {
        "payment_intent": payment_intent,
    }
    if amount:
        refund_data["amount"] = amount
        if context.get("account") is not None:
            account = context.get("account")
            if account is not None:
                refund_data["stripe_account"] = account

    return stripe.Refund.create(**refund_data)


def search_documentation(
    context: Context,
    question: str,
    language: Optional[str] = None,
):
    """
    Search Stripe documentation for answers to integration questions.

    Parameters:
        question (str): The user question to search for in the documentation.
        language (str, optional): The programming language to filter results by.

    Returns:
        dict: The search results containing relevant documentation sources.
    """
    import requests

    endpoint = 'https://ai.stripe.com/search'
    headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch'
    }
    
    search_data = {"query": question}
    if language:
        search_data["language"] = language
    if context.get("account") is not None:
        account = context.get("account")
        if account is not None:
            search_data["stripe_account"] = account

    try:
        response = requests.post(endpoint, json=search_data, headers=headers)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx, 5xx)
        
        data = response.json()
        return data.get('sources', [])
    except requests.exceptions.RequestException as e:
        print(f"Error searching documentation: {str(e)}")
        return "Failed to search documentation"
