import Stripe from 'stripe';

import type {Context} from './configuration';
import {StripeMcpClient, McpTool} from './mcp-client';

const TOOLKIT_HEADER = 'stripe-agent-toolkit-typescript';
const MCP_HEADER = 'stripe-mcp';
const VERSION = '0.9.0';

class StripeAPI {
  // Stripe SDK is kept ONLY for billing middleware (createMeterEvent)
  stripe: Stripe;

  context: Context;

  private mcpClient: StripeMcpClient;
  private initialized = false;

  constructor(secretKey: string, context?: Context) {
    // Stripe SDK only used for createMeterEvent (billing middleware)
    const stripeClient = new Stripe(secretKey, {
      appInfo: {
        name:
          context?.mode === 'modelcontextprotocol' ? MCP_HEADER : TOOLKIT_HEADER,
        version: VERSION,
        url: 'https://github.com/stripe/ai',
      },
    });
    this.stripe = stripeClient;
    this.context = context || {};

    // MCP client for all tool operations
    this.mcpClient = new StripeMcpClient({
      secretKey,
      context: {
        account: context?.account,
        customer: context?.customer,
      },
    });
  }

  /**
   * Async initialization - connects to MCP server.
   * Must be called before using tools via run().
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.mcpClient.connect();
    this.initialized = true;
  }

  /**
   * Check if the API has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get tools from MCP server (after initialization).
   * Returns tool definitions with JSON Schema input schemas.
   */
  getRemoteTools(): McpTool[] {
    if (!this.initialized) {
      throw new Error(
        'StripeAPI not initialized. Call initialize() before accessing tools.'
      );
    }
    return this.mcpClient.getTools();
  }

  /**
   * Billing middleware - stays as direct SDK call.
   * This is used by AI SDK middleware for metered billing.
   */
  async createMeterEvent({
    event,
    customer,
    value,
  }: {
    event: string;
    customer: string;
    value: string;
  }) {
    await this.stripe.billing.meterEvents.create(
      {
        event_name: event,
        payload: {
          stripe_customer_id: customer,
          value: value,
        },
      },
      this.context.account ? {stripeAccount: this.context.account} : undefined
    );
  }

  /**
   * Execute a tool via MCP (replaces local execution).
   * @param method - The tool method name (e.g., 'create_customer')
   * @param arg - The tool arguments
   * @returns JSON string result
   */
  async run(method: string, arg: Record<string, unknown>): Promise<string> {
    if (!this.initialized) {
      throw new Error(
        'StripeAPI not initialized. Call initialize() before running tools.'
      );
    }
    return this.mcpClient.callTool(method, arg);
  }

  /**
   * Close the MCP connection.
   */
  async close(): Promise<void> {
    await this.mcpClient.disconnect();
    this.initialized = false;
  }
}

export default StripeAPI;
