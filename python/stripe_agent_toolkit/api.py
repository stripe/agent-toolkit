"""
Optimized Stripe API wrapper with dictionary-based method dispatch.
Replaced O(n) elif chain with O(1) dictionary lookup for better performance
as the number of supported methods grows.
"""

from __future__ import annotations

import json
import stripe
from typing import Optional, Dict, Callable, Any
from pydantic import BaseModel

from .configuration import Context

from .functions import (
    create_customer,
    list_customers,
    create_product,
    list_products,
    create_price,
    list_prices,
    create_payment_link,
    list_invoices,
    create_invoice,
    create_invoice_item,
    finalize_invoice,
    retrieve_balance,
    create_refund,
    list_payment_intents,
    create_billing_portal_session,
)


class StripeAPI(BaseModel):
    """ "Wrapper for Stripe API"""

    _context: Context
    _method_dispatch: Dict[str, Callable[..., Any]]

    def __init__(self, secret_key: str, context: Optional[Context]):
        super().__init__()

        self._context = context if context is not None else Context()

        self._method_dispatch = {
            "create_customer": create_customer,
            "list_customers": list_customers,
            "create_product": create_product,
            "list_products": list_products,
            "create_price": create_price,
            "list_prices": list_prices,
            "create_payment_link": create_payment_link,
            "list_invoices": list_invoices,
            "create_invoice": create_invoice,
            "create_invoice_item": create_invoice_item,
            "finalize_invoice": finalize_invoice,
            "retrieve_balance": retrieve_balance,
            "create_refund": create_refund,
            "list_payment_intents": list_payment_intents,
            "create_billing_portal_session": create_billing_portal_session,
        }

        stripe.api_key = secret_key
        stripe.set_app_info(
            "stripe-agent-toolkit-python",
            version="0.6.1",
            url="https://github.com/stripe/agent-toolkit",
        )

    def create_meter_event(
        self, event: str, customer: str, value: Optional[str] = None
    ) -> str:
        meter_event_data: dict = {
            "event_name": event,
            "payload": {
                "stripe_customer_id": customer,
            },
        }
        if value is not None:
            meter_event_data["payload"]["value"] = value

        if self._context.get("account") is not None:
            account = self._context.get("account")
            if account is not None:
                meter_event_data["stripe_account"] = account

        stripe.billing.MeterEvent.create(**meter_event_data)

    def run(self, method: str, *args, **kwargs) -> str:
        if method not in self._method_dispatch:
            raise ValueError(f"Invalid method: {method}")

        function = self._method_dispatch[method]
        result = function(self._context, *args, **kwargs)
        return json.dumps(result)
