import {z} from 'zod';
import {BaseToolkit, StructuredTool} from '@langchain/core/tools';
import {CallbackManagerForToolRun} from '@langchain/core/callbacks/manager';
import {RunnableConfig} from '@langchain/core/runnables';
import StripeAPI from '../shared/api';
import {isToolAllowedByName, type Configuration} from '../shared/configuration';
import type {McpTool} from '../shared/mcp-client';

/**
 * Convert a JSON Schema to a basic Zod schema.
 * This is a simplified conversion that handles common cases.
 */
function jsonSchemaToZod(schema: McpTool['inputSchema']): z.ZodObject<any> {
  if (!schema || schema.type !== 'object') {
    return z.object({}).passthrough();
  }

  const properties = schema.properties || {};
  const required = new Set(schema.required || []);

  const shape: Record<string, z.ZodType> = {};

  for (const [key, propSchema] of Object.entries(properties)) {
    const prop = propSchema as {
      type?: string;
      description?: string;
      enum?: string[];
      items?: {type?: string};
    };

    let zodType: z.ZodType;

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          zodType = z.enum(prop.enum as [string, ...string[]]);
        } else {
          zodType = z.string();
        }
        break;
      case 'number':
      case 'integer':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        const itemType = (prop.items as {type?: string})?.type;
        if (itemType === 'string') {
          zodType = z.array(z.string());
        } else if (itemType === 'number' || itemType === 'integer') {
          zodType = z.array(z.number());
        } else {
          zodType = z.array(z.unknown());
        }
        break;
      case 'object':
        zodType = z.object({}).passthrough();
        break;
      default:
        zodType = z.unknown();
    }

    if (prop.description) {
      zodType = zodType.describe(prop.description);
    }

    if (!required.has(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return z.object(shape).passthrough();
}

/**
 * A LangChain StructuredTool that executes Stripe operations via MCP.
 */
class StripeTool extends StructuredTool {
  stripeAPI: StripeAPI;
  method: string;
  name: string;
  description: string;
  schema: z.ZodObject<any, any, any, any>;

  constructor(
    stripeAPI: StripeAPI,
    method: string,
    description: string,
    schema: z.ZodObject<any, any, any, any>
  ) {
    super();
    this.stripeAPI = stripeAPI;
    this.method = method;
    this.name = method;
    this.description = description;
    this.schema = schema;
  }

  _call(
    arg: z.output<typeof this.schema>,
    _runManager?: CallbackManagerForToolRun,
    _parentConfig?: RunnableConfig
  ): Promise<any> {
    return this.stripeAPI.run(this.method, arg);
  }
}

class StripeAgentToolkit implements BaseToolkit {
  private _stripe: StripeAPI;
  private _configuration: Configuration;
  private _initialized = false;

  tools: StripeTool[];

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    this._stripe = new StripeAPI(secretKey, configuration.context);
    this._configuration = configuration;
    this.tools = [];
  }

  /**
   * Initialize the toolkit by connecting to the MCP server.
   * Must be called before using tools.
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    await this._stripe.initialize();

    // Get tools from MCP and filter by configuration
    const remoteTools = this._stripe.getRemoteTools();
    const filteredTools = remoteTools.filter((t) =>
      isToolAllowedByName(t.name, this._configuration)
    );

    // Convert MCP tools to LangChain StructuredTools
    this.tools = filteredTools.map((remoteTool) => {
      const zodSchema = jsonSchemaToZod(remoteTool.inputSchema);
      return new StripeTool(
        this._stripe,
        remoteTool.name,
        remoteTool.description || remoteTool.name,
        zodSchema
      );
    });

    this._initialized = true;
  }

  /**
   * Check if the toolkit has been initialized.
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Get the tools. Throws if not initialized.
   */
  getTools(): StripeTool[] {
    if (!this._initialized) {
      throw new Error(
        'StripeAgentToolkit not initialized. Call await toolkit.initialize() first.'
      );
    }
    return this.tools;
  }

  /**
   * Close the toolkit connection.
   */
  async close(): Promise<void> {
    await this._stripe.close();
    this._initialized = false;
    this.tools = [];
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
 * const tools = toolkit.getTools();
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
