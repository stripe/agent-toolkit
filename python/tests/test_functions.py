import unittest
import stripe
from unittest import mock
from stripe_agent_toolkit.functions import (
    create_customer,
    list_customers,
    create_product,
    list_products,
    create_price,
    list_prices,
    create_payment_link,
    create_invoice,
    create_invoice_item,
    finalize_invoice,
    retrieve_balance,
    create_refund,
    search_documentation,
)
import requests


class TestStripeFunctions(unittest.TestCase):
    def test_create_customer(self):
        with mock.patch("stripe.Customer.create") as mock_function:
            mock_customer = {"id": "cus_123"}
            mock_function.return_value = stripe.Customer.construct_from(
                mock_customer, "sk_test_123"
            )

            result = create_customer(
                context={}, name="Test User", email="test@example.com"
            )

            mock_function.assert_called_with(
                name="Test User", email="test@example.com"
            )

            self.assertEqual(result, {"id": mock_customer["id"]})

    def test_create_customer_with_context(self):
        with mock.patch("stripe.Customer.create") as mock_function:
            mock_customer = {"id": "cus_123"}
            mock_function.return_value = stripe.Customer.construct_from(
                mock_customer, "sk_test_123"
            )

            result = create_customer(
                context={"account": "acct_123"},
                name="Test User",
                email="test@example.com",
            )

            mock_function.assert_called_with(
                name="Test User",
                email="test@example.com",
                stripe_account="acct_123",
            )

            self.assertEqual(result, {"id": mock_customer["id"]})

    def test_list_customers(self):
        with mock.patch("stripe.Customer.list") as mock_function:
            mock_customers = [{"id": "cus_123"}, {"id": "cus_456"}]

            mock_function.return_value = stripe.ListObject.construct_from(
                {
                    "object": "list",
                    "data": [
                        stripe.Customer.construct_from(
                            {
                                "id": "cus_123",
                                "email": "customer1@example.com",
                                "name": "Customer One",
                            },
                            "sk_test_123",
                        ),
                        stripe.Customer.construct_from(
                            {
                                "id": "cus_456",
                                "email": "customer2@example.com",
                                "name": "Customer Two",
                            },
                            "sk_test_123",
                        ),
                    ],
                    "has_more": False,
                    "url": "/v1/customers",
                },
                "sk_test_123",
            )

            result = list_customers(context={})

            mock_function.assert_called_with()

            self.assertEqual(result, mock_customers)

    def test_list_customers_with_context(self):
        with mock.patch("stripe.Customer.list") as mock_function:
            mock_customers = [{"id": "cus_123"}, {"id": "cus_456"}]

            mock_function.return_value = stripe.ListObject.construct_from(
                {
                    "object": "list",
                    "data": [
                        stripe.Customer.construct_from(
                            {
                                "id": "cus_123",
                                "email": "customer1@example.com",
                                "name": "Customer One",
                            },
                            "sk_test_123",
                        ),
                        stripe.Customer.construct_from(
                            {
                                "id": "cus_456",
                                "email": "customer2@example.com",
                                "name": "Customer Two",
                            },
                            "sk_test_123",
                        ),
                    ],
                    "has_more": False,
                    "url": "/v1/customers",
                },
                "sk_test_123",
            )

            result = list_customers(context={"account": "acct_123"})

            mock_function.assert_called_with(
                stripe_account="acct_123",
            )

            self.assertEqual(result, mock_customers)

    def test_create_product(self):
        with mock.patch("stripe.Product.create") as mock_function:
            mock_product = {"id": "prod_123"}
            mock_function.return_value = stripe.Product.construct_from(
                mock_product, "sk_test_123"
            )

            result = create_product(context={}, name="Test Product")

            mock_function.assert_called_with(
                name="Test Product",
            )

            self.assertEqual(result, {"id": mock_product["id"]})

    def test_create_product_with_context(self):
        with mock.patch("stripe.Product.create") as mock_function:
            mock_product = {"id": "prod_123"}
            mock_function.return_value = stripe.Product.construct_from(
                mock_product, "sk_test_123"
            )

            result = create_product(
                context={"account": "acct_123"}, name="Test Product"
            )

            mock_function.assert_called_with(
                name="Test Product", stripe_account="acct_123"
            )

            self.assertEqual(result, {"id": mock_product["id"]})

    def test_list_products(self):
        with mock.patch("stripe.Product.list") as mock_function:
            mock_products = [
                {"id": "prod_123", "name": "Product One"},
                {"id": "prod_456", "name": "Product Two"},
            ]

            mock_function.return_value = stripe.ListObject.construct_from(
                {
                    "object": "list",
                    "data": [
                        stripe.Product.construct_from(
                            {
                                "id": "prod_123",
                                "name": "Product One",
                            },
                            "sk_test_123",
                        ),
                        stripe.Product.construct_from(
                            {
                                "id": "prod_456",
                                "name": "Product Two",
                            },
                            "sk_test_123",
                        ),
                    ],
                    "has_more": False,
                    "url": "/v1/products",
                },
                "sk_test_123",
            )

            result = list_products(context={})

            mock_function.assert_called_with()

            self.assertEqual(result, mock_products)

    def test_create_price(self):
        with mock.patch("stripe.Price.create") as mock_function:
            mock_price = {"id": "price_123"}
            mock_function.return_value = stripe.Price.construct_from(
                mock_price, "sk_test_123"
            )

            result = create_price(
                context={},
                product="prod_123",
                currency="usd",
                unit_amount=1000,
            )

            mock_function.assert_called_with(
                product="prod_123",
                currency="usd",
                unit_amount=1000,
            )

            self.assertEqual(result, {"id": mock_price["id"]})

    def test_create_price_with_context(self):
        with mock.patch("stripe.Price.create") as mock_function:
            mock_price = {"id": "price_123"}
            mock_function.return_value = stripe.Price.construct_from(
                mock_price, "sk_test_123"
            )

            result = create_price(
                context={"account": "acct_123"},
                product="prod_123",
                currency="usd",
                unit_amount=1000,
            )

            mock_function.assert_called_with(
                product="prod_123",
                currency="usd",
                unit_amount=1000,
                stripe_account="acct_123",
            )

            self.assertEqual(result, {"id": mock_price["id"]})

    def test_list_prices(self):
        with mock.patch("stripe.Price.list") as mock_function:
            mock_prices = [
                {"id": "price_123", "product": "prod_123"},
                {"id": "price_456", "product": "prod_456"},
            ]

            mock_function.return_value = stripe.ListObject.construct_from(
                {
                    "object": "list",
                    "data": [
                        stripe.Price.construct_from(
                            {
                                "id": "price_123",
                                "product": "prod_123",
                            },
                            "sk_test_123",
                        ),
                        stripe.Price.construct_from(
                            {
                                "id": "price_456",
                                "product": "prod_456",
                            },
                            "sk_test_123",
                        ),
                    ],
                    "has_more": False,
                    "url": "/v1/prices",
                },
                "sk_test_123",
            )

            result = list_prices({})

            mock_function.assert_called_with()

            self.assertEqual(result, mock_prices)

    def test_list_prices_with_context(self):
        with mock.patch("stripe.Price.list") as mock_function:
            mock_prices = [
                {"id": "price_123", "product": "prod_123"},
                {"id": "price_456", "product": "prod_456"},
            ]

            mock_function.return_value = stripe.ListObject.construct_from(
                {
                    "object": "list",
                    "data": [
                        stripe.Price.construct_from(
                            {
                                "id": "price_123",
                                "product": "prod_123",
                            },
                            "sk_test_123",
                        ),
                        stripe.Price.construct_from(
                            {
                                "id": "price_456",
                                "product": "prod_456",
                            },
                            "sk_test_123",
                        ),
                    ],
                    "has_more": False,
                    "url": "/v1/prices",
                },
                "sk_test_123",
            )

            result = list_prices({"account": "acct_123"})

            mock_function.assert_called_with(stripe_account="acct_123")

            self.assertEqual(result, mock_prices)

    def test_create_payment_link(self):
        with mock.patch("stripe.PaymentLink.create") as mock_function:
            mock_payment_link = {"id": "pl_123", "url": "https://example.com"}
            mock_function.return_value = stripe.PaymentLink.construct_from(
                mock_payment_link, "sk_test_123"
            )

            result = create_payment_link(
                context={}, price="price_123", quantity=1
            )

            mock_function.assert_called_with(
                line_items=[{"price": "price_123", "quantity": 1}],
            )

            self.assertEqual(result, mock_payment_link)

    def test_create_payment_link_with_context(self):
        with mock.patch("stripe.PaymentLink.create") as mock_function:
            mock_payment_link = {"id": "pl_123", "url": "https://example.com"}
            mock_function.return_value = stripe.PaymentLink.construct_from(
                mock_payment_link, "sk_test_123"
            )

            result = create_payment_link(
                context={"account": "acct_123"}, price="price_123", quantity=1
            )

            mock_function.assert_called_with(
                line_items=[{"price": "price_123", "quantity": 1}],
                stripe_account="acct_123",
            )

            self.assertEqual(result, mock_payment_link)

    def test_create_invoice(self):
        with mock.patch("stripe.Invoice.create") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoice, "sk_test_123"
            )

            result = create_invoice(context={}, customer="cus_123")

            mock_function.assert_called_with(
                customer="cus_123",
                collection_method="send_invoice",
                days_until_due=30,
            )

            self.assertEqual(
                result,
                {
                    "id": mock_invoice["id"],
                    "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                    "customer": mock_invoice["customer"],
                    "status": mock_invoice["status"],
                },
            )

    def test_create_invoice_with_context(self):
        with mock.patch("stripe.Invoice.create") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoice, "sk_test_123"
            )

            result = create_invoice(
                context={"account": "acct_123"}, customer="cus_123"
            )

            mock_function.assert_called_with(
                customer="cus_123",
                collection_method="send_invoice",
                days_until_due=30,
                stripe_account="acct_123",
            )

            self.assertEqual(
                result,
                {
                    "id": mock_invoice["id"],
                    "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                    "customer": mock_invoice["customer"],
                    "status": mock_invoice["status"],
                },
            )

    def test_create_invoice_item(self):
        with mock.patch("stripe.InvoiceItem.create") as mock_function:
            mock_invoice_item = {"id": "ii_123", "invoice": "in_123"}
            mock_function.return_value = stripe.InvoiceItem.construct_from(
                mock_invoice_item, "sk_test_123"
            )

            result = create_invoice_item(
                context={},
                customer="cus_123",
                price="price_123",
                invoice="in_123",
            )

            mock_function.assert_called_with(
                customer="cus_123", price="price_123", invoice="in_123"
            )

            self.assertEqual(
                result,
                {
                    "id": mock_invoice_item["id"],
                    "invoice": mock_invoice_item["invoice"],
                },
            )

    def test_create_invoice_item_with_context(self):
        with mock.patch("stripe.InvoiceItem.create") as mock_function:
            mock_invoice_item = {"id": "ii_123", "invoice": "in_123"}
            mock_function.return_value = stripe.InvoiceItem.construct_from(
                mock_invoice_item, "sk_test_123"
            )

            result = create_invoice_item(
                context={"account": "acct_123"},
                customer="cus_123",
                price="price_123",
                invoice="in_123",
            )

            mock_function.assert_called_with(
                customer="cus_123",
                price="price_123",
                invoice="in_123",
                stripe_account="acct_123",
            )

            self.assertEqual(
                result,
                {
                    "id": mock_invoice_item["id"],
                    "invoice": mock_invoice_item["invoice"],
                },
            )

    def test_finalize_invoice(self):
        with mock.patch("stripe.Invoice.finalize_invoice") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoice, "sk_test_123"
            )

            result = finalize_invoice(context={}, invoice="in_123")

            mock_function.assert_called_with(invoice="in_123")

            self.assertEqual(
                result,
                {
                    "id": mock_invoice["id"],
                    "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                    "customer": mock_invoice["customer"],
                    "status": mock_invoice["status"],
                },
            )

    def test_finalize_invoice_with_context(self):
        with mock.patch("stripe.Invoice.finalize_invoice") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoice, "sk_test_123"
            )

            result = finalize_invoice(
                context={"account": "acct_123"}, invoice="in_123"
            )

            mock_function.assert_called_with(
                invoice="in_123", stripe_account="acct_123"
            )

            self.assertEqual(
                result,
                {
                    "id": mock_invoice["id"],
                    "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                    "customer": mock_invoice["customer"],
                    "status": mock_invoice["status"],
                },
            )

    def test_retrieve_balance(self):
        with mock.patch("stripe.Balance.retrieve") as mock_function:
            mock_balance = {"available": [{"amount": 1000, "currency": "usd"}]}

            mock_function.return_value = stripe.Balance.construct_from(
                mock_balance, "sk_test_123"
            )

            result = retrieve_balance(context={})

            mock_function.assert_called_with()

            self.assertEqual(result, mock_balance)

    def test_retrieve_balance_with_context(self):
        with mock.patch("stripe.Balance.retrieve") as mock_function:
            mock_balance = {"available": [{"amount": 1000, "currency": "usd"}]}

            mock_function.return_value = stripe.Balance.construct_from(
                mock_balance, "sk_test_123"
            )

            result = retrieve_balance(context={"account": "acct_123"})

            mock_function.assert_called_with(stripe_account="acct_123")

            self.assertEqual(result, mock_balance)

    def test_create_refund(self):
        with mock.patch("stripe.Refund.create") as mock_function:
            mock_refund = {"id": "re_123"}
            mock_function.return_value = stripe.Refund.construct_from(
                mock_refund, "sk_test_123"
            )

            result = create_refund(context={}, payment_intent="pi_123")

            mock_function.assert_called_with(payment_intent="pi_123")

            self.assertEqual(result, {"id": mock_refund["id"]})

    def test_create_partial_refund(self):
        with mock.patch("stripe.Refund.create") as mock_function:
            mock_refund = {"id": "re_123"}
            mock_function.return_value = stripe.Refund.construct_from(
                mock_refund, "sk_test_123"
            )

            result = create_refund(
                context={}, payment_intent="pi_123", amount=1000
            )

            mock_function.assert_called_with(
                payment_intent="pi_123", amount=1000
            )

            self.assertEqual(result, {"id": mock_refund["id"]})

    def test_create_refund_with_context(self):
        with mock.patch("stripe.Refund.create") as mock_function:
            mock_refund = {"id": "re_123"}
            mock_function.return_value = stripe.Refund.construct_from(
                mock_refund, "sk_test_123"
            )

            result = create_refund(
                context={"account": "acct_123"},
                payment_intent="pi_123",
                amount=1000,
            )

            mock_function.assert_called_with(
                payment_intent="pi_123", amount=1000, stripe_account="acct_123"
            )

            self.assertEqual(result, {"id": mock_refund["id"]})

    def test_search_documentation(self):
        mock_response = mock.Mock()
        mock_response.json.return_value = {
            "sources": [
                {
                    "title": "How to create a payment intent",
                    "url": "https://stripe.com/docs/payments/payment-intents",
                    "content": "Payment intents guide..."
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_response.ok = True

        with mock.patch("requests.post") as mock_post:
            mock_post.return_value = mock_response
            
            result = search_documentation(
                context={},
                question="How do I create a payment intent?",
                language="python"
            )

            mock_post.assert_called_with(
                "https://ai.stripe.com/search",
                json={"query": "How do I create a payment intent?", "language": "python"},
                headers={
                    "Content-Type": "application/json",
                    "X-Requested-With": "fetch"
                }
            )

            self.assertEqual(result, [
                {
                    "title": "How to create a payment intent",
                    "url": "https://stripe.com/docs/payments/payment-intents",
                    "content": "Payment intents guide..."
                }
            ])

    def test_search_documentation_error(self):
        with mock.patch("requests.post") as mock_post:
            mock_post.side_effect = requests.exceptions.RequestException("Network error")
            
            result = search_documentation(
                context={},
                question="How do I create a payment intent?",
            )

            mock_post.assert_called_with(
                "https://ai.stripe.com/search",
                json={"query": "How do I create a payment intent?"},
                headers={
                    "Content-Type": "application/json",
                    "X-Requested-With": "fetch"
                }
            )

            self.assertEqual(result, "Failed to search documentation")

    def test_search_documentation_with_context(self):
        mock_response = mock.Mock()
        mock_response.json.return_value = {
            "sources": [
                {
                    "title": "Connect account documentation",
                    "url": "https://stripe.com/docs/connect",
                    "content": "Connect guide..."
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_response.ok = True

        with mock.patch("requests.post") as mock_post:
            mock_post.return_value = mock_response
            
            result = search_documentation(
                context={"account": "acct_123"},
                question="How do I use Connect accounts?",
                language="python"
            )

            mock_post.assert_called_with(
                "https://ai.stripe.com/search",
                json={
                    "query": "How do I use Connect accounts?",
                    "language": "python",
                    "stripe_account": "acct_123"
                },
                headers={
                    "Content-Type": "application/json",
                    "X-Requested-With": "fetch"
                }
            )

            self.assertEqual(result, [
                {
                    "title": "Connect account documentation",
                    "url": "https://stripe.com/docs/connect",
                    "content": "Connect guide..."
                }
            ])


if __name__ == "__main__":
    unittest.main()
