import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = 'https://mcp.stripe.com';
const CLIENT_NAME = 'stripe-agent-toolkit';
const CLIENT_VERSION = '0.9.0';

export interface McpClientConfig {
  secretKey: string;
  context?: {
    account?: string;
    customer?: string;
  };
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallResult {
  content: Array<{type: string; text?: string}>;
  isError?: boolean;
}

export class StripeMcpClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;
  private connected = false;
  private tools: McpTool[] = [];
  private config: McpClientConfig;

  constructor(config: McpClientConfig) {
    this.config = config;
    this.validateKey(config.secretKey);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.secretKey}`,
    };

    if (config.context?.account) {
      headers['Stripe-Account'] = config.context.account;
    }

    if (config.context?.customer) {
      headers['X-Stripe-Customer'] = config.context.customer;
    }

    this.transport = new StreamableHTTPClientTransport(
      new URL(MCP_SERVER_URL),
      {
        requestInit: {
          headers,
        },
      }
    );

    this.client = new Client(
      {
        name: CLIENT_NAME,
        version: CLIENT_VERSION,
      },
      {
        capabilities: {},
      }
    );
  }

  private validateKey(key: string): void {
    if (!key) {
      throw new Error('API key is required.');
    }

    if (!key.startsWith('sk_') && !key.startsWith('rk_')) {
      throw new Error(
        'Invalid API key format. Expected sk_* (secret key) or rk_* (restricted key).'
      );
    }

    if (key.startsWith('sk_')) {
      console.warn(
        '[DEPRECATION WARNING] Using sk_* keys with agent-toolkit is deprecated. ' +
          'Please switch to rk_* (restricted keys) for better security. ' +
          'See: https://docs.stripe.com/keys#create-restricted-api-keys'
      );
    }
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.client.connect(this.transport);
      const result = await this.client.listTools();
      this.tools = result.tools as McpTool[];
      this.connected = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to connect to Stripe MCP server at ${MCP_SERVER_URL}. ` +
          `No fallback to direct SDK is available. ` +
          `Error: ${errorMessage}`
      );
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getTools(): McpTool[] {
    if (!this.connected) {
      throw new Error(
        'MCP client not connected. Call connect() before accessing tools.'
      );
    }
    return this.tools;
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    if (!this.connected) {
      throw new Error(
        'MCP client not connected. Call connect() before calling tools.'
      );
    }

    try {
      const result = (await this.client.callTool({
        name,
        arguments: args,
      })) as McpToolCallResult;

      if (result.isError) {
        const errorText = result.content?.find((c) => c.type === 'text')?.text;
        throw new Error(errorText || 'Tool execution failed');
      }

      const textContent = result.content?.find((c) => c.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text;
      }

      return JSON.stringify(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute tool '${name}': ${errorMessage}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
      this.tools = [];
    }
  }
}

export default StripeMcpClient;
