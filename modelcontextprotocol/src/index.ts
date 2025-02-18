#!/usr/bin/env node

import { StripeAgentToolkit } from "@stripe/agent-toolkit/modelcontextprotocol";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

type ToolkitConfig = {
  actions: {
    [product: string]: { [action: string]: boolean };
  };
};

const acceptedKeys = ["api-key", "tools"];
const acceptedTools = [
  "customers.create",
  "customers.read",
  "products.create",
  "products.read",
  "prices.create",
  "prices.read",
  "paymentLinks.create",
  "invoices.create",
  "invoices.update",
  "invoiceItems.create",
  "balance.read",
  "refunds.create",
  "documentation.read",
];

function parseArgs(args: string[]) {
  const options: any = {};

  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");

      // Check if the key is accepted
      if (!acceptedKeys.includes(key)) {
        throw new Error(
          `Invalid argument: ${key}. Accepted arguments are: ${acceptedKeys.join(
            ", "
          )}`
        );
      }

      options[key] = value;
    }
  });

  // Check if both required arguments are present
  if (!options["tools"]) {
    throw new Error("The --tools arguments must be provided.");
  }

  // Validate api-key format
  if (options["api-key"] && !options["api-key"].startsWith("sk_")) {
    throw new Error('API key must start with "sk_".');
  }

  // Validate tools against accepted enum values
  const toolsArray = options["tools"].split(",");
  toolsArray.forEach((tool: string) => {
    if (tool == "all") {
      return;
    }
    if (!acceptedTools.includes(tool.trim())) {
      throw new Error(
        `Invalid tool: ${tool}. Accepted tools are: ${acceptedTools.join(", ")}`
      );
    }
  });

  return options;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Set the environment variable
  const apiKey = args["api-key"] || process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "Stripe API key not provided. Please either pass it as an argument --api-key=$KEY or set the STRIPE_SECRET_KEY environment variable."
    );
  }

  // Create the StripeAgentToolkit instance
  const tools = args["tools"].split(",");
  const configuration: ToolkitConfig = { actions: {} };

  // Handle all
  if (tools.includes("all")) {
    acceptedTools.forEach((tool) => {
      const [product, action] = tool.split(".");
      configuration.actions[product] = { [action]: true };
    });
  } else {
    tools.forEach((tool: any) => {
      const [product, action] = tool.split(".");
      configuration.actions[product] = { [action]: true };
    });
  }

  const server = new StripeAgentToolkit({
    secretKey: apiKey,
    configuration: configuration,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // console.log will output to standard I/O which will confuse the server and print errors
  console.error("Stripe MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  throw new Error("Fatal error in main()");
});
