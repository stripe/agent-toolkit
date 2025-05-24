from typing import Optional, Literal
from pydantic import BaseModel, Field


class CreateCustomer(BaseModel):
    """Schema for the ``create_customer`` operation."""

    name: str = Field(
        ...,
        description="The name of the customer.",
    )

    email: Optional[str] = Field(
        None,
        description="The email of the customer.",
    )


class ListCustomers(BaseModel):
    """Schema for the ``list_customers`` operation."""

    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100."
        ),
    )

    email: Optional[str] = Field(
        None,
        description=(
            "A case-sensitive filter on the list based on"
            " the customer's email field. The value must be a string."
        ),
    )


class CreateProduct(BaseModel):
    """Schema for the ``create_product`` operation."""

    name: str = Field(
        ...,
        description="The name of the product.",
    )
    description: Optional[str] = Field(
        None,
        description="The description of the product.",
    )


class ListProducts(BaseModel):
    """Schema for the ``list_products`` operation."""

    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100, and the default is 10."
        ),
    )


class CreatePrice(BaseModel):
    """Schema for the ``create_price`` operation."""

    product: str = Field(
        ..., description="The ID of the product to create the price for."
    )
    unit_amount: int = Field(
        ...,
        description="The unit amount of the price in cents.",
    )
    currency: str = Field(
        ...,
        description="The currency of the price.",
    )


class ListPrices(BaseModel):
    """Schema for the ``list_prices`` operation."""

    product: Optional[str] = Field(
        None,
        description="The ID of the product to list prices for.",
    )
    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100, and the default is 10."
        ),
    )


class CreatePaymentLink(BaseModel):
    """Schema for the ``create_payment_link`` operation."""

    price: str = Field(
        ...,
        description="The ID of the price to create the payment link for.",
    )
    quantity: int = Field(
        ...,
        description="The quantity of the product to include.",
    )


class ListInvoices(BaseModel):
    """Schema for the ``list_invoices`` operation."""

    customer: Optional[str] = Field(
        None,
        description="The ID of the customer to list invoices for.",
    )
    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100, and the default is 10."
        ),
    )


class CreateInvoice(BaseModel):
    """Schema for the ``create_invoice`` operation."""

    customer: str = Field(
        ..., description="The ID of the customer to create the invoice for."
    )

    days_until_due: Optional[int] = Field(
        None,
        description="The number of days until the invoice is due.",
    )


class CreateInvoiceItem(BaseModel):
    """Schema for the ``create_invoice_item`` operation."""

    customer: str = Field(
        ...,
        description="The ID of the customer to create the invoice item for.",
    )
    price: str = Field(
        ...,
        description="The ID of the price for the item.",
    )
    invoice: str = Field(
        ...,
        description="The ID of the invoice to create the item for.",
    )


class FinalizeInvoice(BaseModel):
    """Schema for the ``finalize_invoice`` operation."""

    invoice: str = Field(
        ...,
        description="The ID of the invoice to finalize.",
    )


class RetrieveBalance(BaseModel):
    """Schema for the ``retrieve_balance`` operation."""

    pass


class CreateRefund(BaseModel):
    """Schema for the ``create_refund`` operation."""

    payment_intent: str = Field(
        ...,
        description="The ID of the PaymentIntent to refund.",
    )
    amount: Optional[int] = Field(
        ...,
        description="The amount to refund in cents.",
    )

class ListPaymentIntents(BaseModel):
    """Schema for the ``list_payment_intents`` operation."""

    customer: Optional[str] = Field(
        None,
        description="The ID of the customer to list payment intents for.",
    )
    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100."
        ),
    )

class CreateBillingPortalSession(BaseModel):
    """Schema for the ``create_billing_portal_session`` operation."""

    customer: str = Field(
        None,
        description="The ID of the customer to create the billing portal session for.",
    )
    return_url: Optional[str] = Field(
        None,
        description=(
            "The default URL to return to afterwards."
        ),
    )


class ListPaymentMethodConfigs(BaseModel):
    """Schema for the ``list_payment_method_configs`` operation."""

    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100."
        ),
    )


class UpdatePaymentMethodConfig(BaseModel):
    """Schema for the ``update_payment_method_config`` operation."""

    configuration: str = Field(
        ..., description="The ID of the configuration to update."
    )
    payment_method: str = Field(
        ..., description="The payment method type to modify."
    )
    preference: Literal["on", "off"] = Field(
        ...,
        description=(
            "Display preference for the payment method."
            " Must be 'on' or 'off'."
        ),
    )
