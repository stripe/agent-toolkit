# Stripe Model Context Protocol

The Stripe [Model Context Protocol](https://modelcontextprotocol.com/) server allows you to integrate with Stripe APIs through function calling. This protocol supports various tools to interact with different Stripe services.

## Running the Stripe MCP server using npx

To run the Stripe MCP server using npx, use the following command:

```bash
npx -y @stripe/mcp --tools=all --api-key=<YOUR-STRIPE-SECRET-KEY>
```

Replace `<YOUR-STRIPE-SECRET-KEY>` with your actual Stripe secret key. Alternatively, you could set the STRIPE_SECRET_KEY in your environment variables.

### Available tools

| Tool                  | Description                  |
| --------------------- | ---------------------------- |
| `customers.create`    | Create a new customer        |
| `customers.read`      | Read customer information    |
| `products.create`     | Create a new product         |
| `products.read`       | Read product information     |
| `prices.create`       | Create a new price           |
| `prices.read`         | Read price information       |
| `paymentLinks.create` | Create a new payment link    |
| `invoices.create`     | Create a new invoice         |
| `invoices.update`     | Update an existing invoice   |
| `invoiceItems.create` | Create a new invoice item    |
| `balance.read`        | Retrieve balance information |
| `refunds.create`      | Create a new refund          |
| `documentation.read`  | Search Stripe documentation  |
