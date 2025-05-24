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

    def test_list_invoices(self):
        with mock.patch("stripe.Invoice.list") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }
            mock_invoices = {
                "object": "list",
                "data": [
                    stripe.Invoice.construct_from(
                        mock_invoice,
                        "sk_test_123",
                    ),
                ],
                "has_more": False,
                "url": "/v1/invoices",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoices, "sk_test_123"
            )

            result = list_invoices(context={})

            mock_function.assert_called_with()

            self.assertEqual(
                result,
                [
                    {
                        "id": mock_invoice["id"],
                        "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                        "customer": mock_invoice["customer"],
                        "status": mock_invoice["status"],
                    }
                ],
            )

    def test_list_invoices_with_customer(self):
        with mock.patch("stripe.Invoice.list") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }
            mock_invoices = {
                "object": "list",
                "data": [
                    stripe.Invoice.construct_from(
                        mock_invoice,
                        "sk_test_123",
                    ),
                ],
                "has_more": False,
                "url": "/v1/invoices",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoices, "sk_test_123"
            )

            result = list_invoices(context={}, customer="cus_123")

            mock_function.assert_called_with(
                customer="cus_123",
            )

            self.assertEqual(
                result,
                [
                    {
                        "id": mock_invoice["id"],
                        "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                        "customer": mock_invoice["customer"],
                        "status": mock_invoice["status"],
                    }
                ],
            )

    def test_list_invoices_with_customer_and_limit(self):
        with mock.patch("stripe.Invoice.list") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }
            mock_invoices = {
                "object": "list",
                "data": [
                    stripe.Invoice.construct_from(
                        mock_invoice,
                        "sk_test_123",
                    ),
                ],
                "has_more": False,
                "url": "/v1/invoices",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoices, "sk_test_123"
            )

            result = list_invoices(context={}, customer="cus_123", limit=100)

            mock_function.assert_called_with(
                customer="cus_123",
                limit=100,
            )

            self.assertEqual(
                result,
                [
                    {
                        "id": mock_invoice["id"],
                        "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                        "customer": mock_invoice["customer"],
                        "status": mock_invoice["status"],
                    }
                ],
            )

    def test_list_invoices_with_context(self):
        with mock.patch("stripe.Invoice.list") as mock_function:
            mock_invoice = {
                "id": "in_123",
                "hosted_invoice_url": "https://example.com",
                "customer": "cus_123",
                "status": "open",
            }
            mock_invoices = {
                "object": "list",
                "data": [
                    stripe.Invoice.construct_from(
                        mock_invoice,
                        "sk_test_123",
                    ),
                ],
                "has_more": False,
                "url": "/v1/invoices",
            }

            mock_function.return_value = stripe.Invoice.construct_from(
                mock_invoices, "sk_test_123"
            )

            result = list_invoices(context={"account": "acct_123"}, customer="cus_123")

            mock_function.assert_called_with(
                customer="cus_123",
                stripe_account="acct_123",
            )

            self.assertEqual(
                result,
                [
                    {
                        "id": mock_invoice["id"],
                        "hosted_invoice_url": mock_invoice["hosted_invoice_url"],
                        "customer": mock_invoice["customer"],
                        "status": mock_invoice["status"],
                    }
                ],
            )

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

    def test_list_payment_intents(self):
        with mock.patch("stripe.PaymentIntent.list") as mock_function:
            mock_payment_intents = [{"id": "pi_123"}, {"id": "pi_456"}]
            mock_function.return_value = stripe.ListObject.construct_from(
                {"data": mock_payment_intents}, "sk_test_123"
            )

            result = list_payment_intents(context={})

            mock_function.assert_called_with()

            self.assertEqual(result, mock_payment_intents)

    def test_list_payment_intents_with_context(self):
        with mock.patch("stripe.PaymentIntent.list") as mock_function:
            mock_payment_intents = [{"id": "pi_123"}, {"id": "pi_456"}]
            mock_function.return_value = stripe.ListObject.construct_from(
                {"data": mock_payment_intents}, "sk_test_123"
            )

            result = list_payment_intents(context={"account": "acct_123"})

            mock_function.assert_called_with(stripe_account="acct_123")

            self.assertEqual(result, mock_payment_intents)


    def test_create_billing_portal_session(self):
        with mock.patch("stripe.billing_portal.Session.create") as mock_function:
            mock_billing_portal_session = {
                "id": "bps_123",
                "url": "https://example.com",
                "customer": "cus_123",
                "configuration": "bpc_123",
            }
            mock_function.return_value = stripe.billing_portal.Session.construct_from(
                mock_billing_portal_session, "sk_test_123"
            )

            result = create_billing_portal_session(context={}, customer="cus_123")

            mock_function.assert_called_with(customer="cus_123")

            self.assertEqual(result, {
                "id": mock_billing_portal_session["id"],
                "url": mock_billing_portal_session["url"],
                "customer": mock_billing_portal_session["customer"],
            })

    def test_create_billing_portal_session_with_return_url(self):
        with mock.patch("stripe.billing_portal.Session.create") as mock_function:
            mock_billing_portal_session = {
                "id": "bps_123",
                "url": "https://example.com",
                "customer": "cus_123",
                "configuration": "bpc_123",
            }
            mock_function.return_value = stripe.billing_portal.Session.construct_from(
                mock_billing_portal_session, "sk_test_123"
            )

            result = create_billing_portal_session(
                context={},
                customer="cus_123",
                return_url="http://example.com"
            )

            mock_function.assert_called_with(
                customer="cus_123",
                return_url="http://example.com",
            )

            self.assertEqual(result, {
                "id": mock_billing_portal_session["id"],
                "url": mock_billing_portal_session["url"],
                "customer": mock_billing_portal_session["customer"],
            })

    def test_create_billing_portal_session_with_context(self):
        with mock.patch("stripe.billing_portal.Session.create") as mock_function:
            mock_billing_portal_session = {
                "id": "bps_123",
                "url": "https://example.com",
                "customer": "cus_123",
                "configuration": "bpc_123",
            }
            mock_function.return_value = stripe.billing_portal.Session.construct_from(
                mock_billing_portal_session, "sk_test_123"
            )

            result = create_billing_portal_session(
                context={"account": "acct_123"},
                customer="cus_123",
                return_url="http://example.com"
            )

            mock_function.assert_called_with(
                customer="cus_123",
                return_url="http://example.com",
                stripe_account="acct_123"
            )

            self.assertEqual(result, {
                "id": mock_billing_portal_session["id"],
                "url": mock_billing_portal_session["url"],
                "customer": mock_billing_portal_session["customer"],
            })

    def test_list_payment_method_configs(self):
        with mock.patch("stripe.PaymentMethodConfiguration.list") as mock_function:
            mock_configs = [
                {"id": "pmc_123"},
                {"id": "pmc_456"},
            ]

            mock_function.return_value = stripe.ListObject.construct_from(
                {"data": [stripe.PaymentMethodConfiguration.construct_from(c, "sk") for c in mock_configs]},
                "sk"
            )

            result = list_payment_method_configs(context={})

            mock_function.assert_called_with()
            self.assertEqual(result, mock_configs)

    def test_update_payment_method_config(self):
        with mock.patch("stripe.PaymentMethodConfiguration.update") as mock_function:
            mock_config = {"id": "pmc_123"}
            mock_function.return_value = stripe.PaymentMethodConfiguration.construct_from(mock_config, "sk")

            result = update_payment_method_config(
                context={},
                configuration="pmc_123",
                payment_method="link",
                preference="on",
            )

            mock_function.assert_called_with(
                "pmc_123",
                link={"display_preference": {"preference": "on"}},
            )

            self.assertEqual(result, {"id": mock_config["id"]})

if __name__ == "__main__":
    unittest.main()
