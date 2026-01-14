import StripeAPI from '../shared/api';
import {isToolAllowedByName, type Configuration} from '../shared/configuration';
import type {
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from 'openai/resources';

class StripeAgentToolkit {
  private _stripe: StripeAPI;
  private _configuration: Configuration;
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;
  private _tools: ChatCompletionTool[] = [];

  /**
   * The tools available in the toolkit.
   * @deprecated Access tools via getTools() after calling initialize().
   * Direct property access will return empty array if not initialized.
   */
  get tools(): ChatCompletionTool[] {
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

    // Convert MCP tools to OpenAI ChatCompletionTool format
    // MCP already provides JSON Schema, which OpenAI expects
    this._tools = filteredTools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.inputSchema || {type: 'object', properties: {}},
      },
    }));

    this._initialized = true;
  }

  /**
   * Check if the toolkit has been initialized.
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Get the tools in OpenAI ChatCompletionTool format.
   * Throws if not initialized.
   */
  getTools(): ChatCompletionTool[] {
    if (!this._initialized) {
      throw new Error(
        'StripeAgentToolkit not initialized. Call await toolkit.initialize() first.'
      );
    }
    return this._tools;
  }

  /**
   * Processes a single OpenAI tool call by executing the requested function.
   *
   * @param {ChatCompletionMessageToolCall} toolCall - The tool call object from OpenAI containing
   *   function name, arguments, and ID.
   * @returns {Promise<ChatCompletionToolMessageParam>} A promise that resolves to a tool message
   *   object containing the result of the tool execution with the proper format for the OpenAI API.
   */
  async handleToolCall(
    toolCall: ChatCompletionMessageToolCall
  ): Promise<ChatCompletionToolMessageParam> {
    if (!this._initialized) {
      throw new Error(
        'StripeAgentToolkit not initialized. Call await toolkit.initialize() first.'
      );
    }

    const args = JSON.parse(toolCall.function.arguments);
    const response = await this._stripe.run(toolCall.function.name, args);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: response,
    } as ChatCompletionToolMessageParam;
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
