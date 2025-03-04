from typing import Dict, List

from .prompts import (
    CREATE_CUSTOMER_PROMPT,
    LIST_CUSTOMERS_PROMPT,
    CREATE_PRODUCT_PROMPT,
    LIST_PRODUCTS_PROMPT,
    CREATE_PRICE_PROMPT,
    LIST_PRICES_PROMPT,
    CREATE_PAYMENT_LINK_PROMPT,
    CREATE_INVOICE_PROMPT,
    CREATE_INVOICE_ITEM_PROMPT,
    FINALIZE_INVOICE_PROMPT,
    RETRIEVE_BALANCE_PROMPT,
    CREATE_REFUND_PROMPT,
    SEARCH_DOCUMENTATION_PROMPT,
)

from .schema import (
    CreateCustomer,
    ListCustomers,
    CreateProduct,
    ListProducts,
    CreatePrice,
    ListPrices,
    CreatePaymentLink,
    CreateInvoice,
    CreateInvoiceItem,
    FinalizeInvoice,
    RetrieveBalance,
    CreateRefund,
    SearchDocumentation,
)

tools: List[Dict] = [
    {
        "method": "create_customer",
        "name": "Create Customer",
        "description": CREATE_CUSTOMER_PROMPT,
        "args_schema": CreateCustomer,
        "actions": {
            "customers": {
                "create": True,
            }
        },
    },
    {
        "method": "list_customers",
        "name": "List Customers",
        "description": LIST_CUSTOMERS_PROMPT,
        "args_schema": ListCustomers,
        "actions": {
            "customers": {
                "read": True,
            }
        },
    },
    {
        "method": "create_product",
        "name": "Create Product",
        "description": CREATE_PRODUCT_PROMPT,
        "args_schema": CreateProduct,
        "actions": {
            "products": {
                "create": True,
            }
        },
    },
    {
        "method": "list_products",
        "name": "List Products",
        "description": LIST_PRODUCTS_PROMPT,
        "args_schema": ListProducts,
        "actions": {
            "products": {
                "read": True,
            }
        },
    },
    {
        "method": "create_price",
        "name": "Create Price",
        "description": CREATE_PRICE_PROMPT,
        "args_schema": CreatePrice,
        "actions": {
            "prices": {
                "create": True,
            }
        },
    },
    {
        "method": "list_prices",
        "name": "List Prices",
        "description": LIST_PRICES_PROMPT,
        "args_schema": ListPrices,
        "actions": {
            "prices": {
                "read": True,
            }
        },
    },
    {
        "method": "create_payment_link",
        "name": "Create Payment Link",
        "description": CREATE_PAYMENT_LINK_PROMPT,
        "args_schema": CreatePaymentLink,
        "actions": {
            "payment_links": {
                "create": True,
            }
        },
    },
    {
        "method": "create_invoice",
        "name": "Create Invoice",
        "description": CREATE_INVOICE_PROMPT,
        "args_schema": CreateInvoice,
        "actions": {
            "invoices": {
                "create": True,
            }
        },
    },
    {
        "method": "create_invoice_item",
        "name": "Create Invoice Item",
        "description": CREATE_INVOICE_ITEM_PROMPT,
        "args_schema": CreateInvoiceItem,
        "actions": {
            "invoice_items": {
                "create": True,
            }
        },
    },
    {
        "method": "finalize_invoice",
        "name": "Finalize Invoice",
        "description": FINALIZE_INVOICE_PROMPT,
        "args_schema": FinalizeInvoice,
        "actions": {
            "invoices": {
                "update": True,
            }
        },
    },
    {
        "method": "retrieve_balance",
        "name": "Retrieve Balance",
        "description": RETRIEVE_BALANCE_PROMPT,
        "args_schema": RetrieveBalance,
        "actions": {
            "balance": {
                "read": True,
            }
        },
    },
    {
        "method": "create_refund",
        "name": "Create Refund",
        "description": CREATE_REFUND_PROMPT,
        "args_schema": CreateRefund,
        "actions": {
            "refunds": {
                "create": True,
            }
        },
    },
    {
        "method": "search_documentation",
        "name": "Search Documentation",
        "description": SEARCH_DOCUMENTATION_PROMPT,
        "args_schema": SearchDocumentation,
        "actions": {
            "documentation": {
                "read": True,
            }
        },
    },
]
