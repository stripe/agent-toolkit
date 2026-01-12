import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js';
import {Configuration, isToolAllowedByName} from '../shared/configuration';
import {StripeMcpClient, McpTool} from '../shared/mcp-client';
import Stripe from 'stripe';

const VERSION = '0.9.0';

class StripeAgentToolkit extends McpServer {
  private _mcpClient: StripeMcpClient;
  private _stripe: Stripe;
  private _configuration: Configuration;
  private _initialized = false;

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    super({
      name: 'Stripe',
      version: VERSION,
    });

    this._configuration = configuration;

    // MCP client for connecting to mcp.stripe.com
    this._mcpClient = new StripeMcpClient({
      secretKey,
      context: {
        account: configuration.context?.account,
        customer: configuration.context?.customer,
      },
    });

    // Keep Stripe SDK for registerPaidTool billing operations
    this._stripe = new Stripe(secretKey, {
      appInfo: {
        name: 'stripe-mcp',
        version: VERSION,
        url: 'https://github.com/stripe/ai',
      },
    });
  }

  /**
   * Initialize the toolkit by connecting to mcp.stripe.com and registering tools.
   * Must be called after construction and before the server starts handling requests.
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    await this._mcpClient.connect();

    // Get tools from remote MCP and register as local proxies
    const remoteTools = this._mcpClient.getTools();
    const filteredTools = remoteTools.filter((t) =>
      isToolAllowedByName(t.name, this._configuration)
    );

    for (const remoteTool of filteredTools) {
      this.registerProxyTool(remoteTool);
    }

    this._initialized = true;
  }

  /**
   * Register a tool that proxies execution to mcp.stripe.com
   */
  private registerProxyTool(remoteTool: McpTool): void {
    // Convert JSON Schema to shape for MCP tool registration
    const inputSchema = remoteTool.inputSchema || {
      type: 'object',
      properties: {},
    };

    this.tool(
      remoteTool.name,
      remoteTool.description || remoteTool.name,
      inputSchema.properties || {},
      async (args: Record<string, unknown>, _extra: RequestHandlerExtra<any, any>) => {
        try {
          const result = await this._mcpClient.callTool(remoteTool.name, args);
          return {
            content: [
              {
                type: 'text' as const,
                text: result,
              },
            ],
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({error: errorMessage}),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Check if the toolkit has been initialized.
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Get the Stripe SDK instance for registerPaidTool billing operations.
   * Note: This is only for billing operations, not for tool execution.
   */
  getStripeClient(): Stripe {
    return this._stripe;
  }

  /**
   * Close the MCP client connection.
   */
  async close(): Promise<void> {
    await this._mcpClient.disconnect();
    this._initialized = false;
  }
}

/**
 * Factory function to create and initialize a StripeAgentToolkit.
 * Provides a simpler async initialization pattern.
 *
 * @example
 * const toolkit = await createStripeAgentToolkit({
 *   secretKey: 'rk_test_...',
 *   configuration: { actions: { customers: { create: true } } }
 * });
 * // toolkit is now ready to use as an MCP server
 */
export async function createStripeAgentToolkit(config: {
  secretKey: string;
  configuration: Configuration;
}): Promise<StripeAgentToolkit> {
  const toolkit = new StripeAgentToolkit(config);
  await toolkit.initialize();
  return toolkit;
}

export default StripeAgentToolkit;
