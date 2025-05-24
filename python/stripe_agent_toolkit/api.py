"""Util that calls Stripe."""

from __future__ import annotations

import json
import stripe
from typing import Optional
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
    list_payment_method_configs,
    update_payment_method_config,
)


class StripeAPI(BaseModel):
    """ "Wrapper for Stripe API"""

    _context: Context

    def __init__(self, secret_key: str, context: Optional[Context]):
        super().__init__()

        self._context = context if context is not None else Context()

        stripe.api_key = secret_key
        stripe.set_app_info(
            "stripe-agent-toolkit-python",
            version="0.6.1",
            url="https://github.com/stripe/agent-toolkit",
        )

    def create_meter_event(self, event: str, customer: str, value: Optional[str] = None) -> str:
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
        if method == "create_customer":
            return json.dumps(create_customer(self._context, *args, **kwargs))
        elif method == "list_customers":
            return json.dumps(list_customers(self._context, *args, **kwargs))
        elif method == "create_product":
            return json.dumps(create_product(self._context, *args, **kwargs))
        elif method == "list_products":
            return json.dumps(list_products(self._context, *args, **kwargs))
        elif method == "create_price":
            return json.dumps(create_price(self._context, *args, **kwargs))
        elif method == "list_prices":
            return json.dumps(list_prices(self._context, *args, **kwargs))
        elif method == "create_payment_link":
            return json.dumps(
                create_payment_link(self._context, *args, **kwargs)
            )
        elif method == "list_invoices":
            return json.dumps(list_invoices(self._context, *args, **kwargs))
        elif method == "create_invoice":
            return json.dumps(create_invoice(self._context, *args, **kwargs))
        elif method == "create_invoice_item":
            return json.dumps(
                create_invoice_item(self._context, *args, **kwargs)
            )
        elif method == "finalize_invoice":
            return json.dumps(finalize_invoice(self._context, *args, **kwargs))
        elif method == "retrieve_balance":
            return json.dumps(retrieve_balance(self._context, *args, **kwargs))
        elif method == "create_refund":
            return json.dumps(create_refund(self._context, *args, **kwargs))
        elif method == "list_payment_intents":
            return json.dumps(
                list_payment_intents(self._context, *args, **kwargs)
            )
        elif method == "list_payment_method_configs":
            return json.dumps(
                list_payment_method_configs(self._context, *args, **kwargs)
            )
        elif method == "update_payment_method_config":
            return json.dumps(
                update_payment_method_config(self._context, *args, **kwargs)
            )
        elif method == "create_billing_portal_session":
            return json.dumps(
                create_billing_portal_session(self._context, *args, **kwargs)
            )
        else:
            raise ValueError("Invalid method " + method)
