import {z} from 'zod';
import {BaseToolkit, StructuredTool} from '@langchain/core/tools';
import {CallbackManagerForToolRun} from '@langchain/core/callbacks/manager';
import {RunnableConfig} from '@langchain/core/runnables';
import StripeAPI from '../shared/api';
import {isToolAllowedByName, type Configuration} from '../shared/configuration';
import {jsonSchemaToZod} from '../shared/schema-utils';

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
  private _initPromise: Promise<void> | null = null;
  private _tools: StripeTool[] = [];

  /**
   * The tools available in the toolkit.
   * @deprecated Access tools via getTools() after calling initialize().
   * Direct property access will return empty array if not initialized.
   */
  get tools(): StripeTool[] {
    if (!this._initialized) {
      console.warn(
        '[StripeAgentToolkit] Accessing tools before initialization. ' +
          'Call await toolkit.initialize() first, or use createStripeAgentToolkit() factory. ' +
          'Tools will be empty until initialized.'
      );
    }
    return this._tools;
  }

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    this._stripe = new StripeAPI(secretKey, configuration.context);
    this._configuration = configuration;
  }

  /**
   * Initialize the toolkit by connecting to the MCP server.
   * Must be called before using tools.
   */
  async initialize(): Promise<void> {
    // Use promise lock to prevent concurrent initialization
    if (this._initPromise) {
      return this._initPromise;
    }

    if (this._initialized) {
      return;
    }

    this._initPromise = this.doInitialize();
    try {
      await this._initPromise;
    } catch (error) {
      // Reset promise on failure so retry is possible
      this._initPromise = null;
      throw error;
    }
  }

  private async doInitialize(): Promise<void> {
    await this._stripe.initialize();

    // Get tools from MCP and filter by configuration
    const remoteTools = this._stripe.getRemoteTools();
    const filteredTools = remoteTools.filter((t) =>
      isToolAllowedByName(t.name, this._configuration)
    );

    // Convert MCP tools to LangChain StructuredTools
    this._tools = filteredTools.map((remoteTool) => {
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
    return this._tools;
  }

  /**
   * Close the toolkit connection.
   */
  async close(): Promise<void> {
    await this._stripe.close();
    this._initialized = false;
    this._initPromise = null;
    this._tools = [];
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
