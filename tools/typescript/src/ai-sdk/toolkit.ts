import {tool, Tool} from 'ai';
import {z} from 'zod';
import StripeAPI from '../shared/api';
import {isToolAllowedByName, type Configuration} from '../shared/configuration';
import {jsonSchemaToZod} from '../shared/schema-utils';
import type {
  LanguageModelV2Middleware,
  LanguageModelV2Usage,
} from '@ai-sdk/provider';

// Use a more permissive type for dynamically created tools
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderTool = Tool<any, any>;
type WrapGenerateOptions = Parameters<
  NonNullable<LanguageModelV2Middleware['wrapGenerate']>
>[0];
type WrapStreamOptions = Parameters<
  NonNullable<LanguageModelV2Middleware['wrapStream']>
>[0];

type StripeMiddlewareConfig = {
  billing?: {
    type?: 'token';
    customer: string;
    meters: {
      input?: string;
      output?: string;
    };
  };
};

class StripeAgentToolkit {
  private _stripe: StripeAPI;
  private _configuration: Configuration;
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;
  private _tools: Record<string, ProviderTool> = {};

  /**
   * The tools available in the toolkit.
   * @deprecated Access tools via getTools() after calling initialize().
   * Direct property access will return empty object if not initialized.
   */
  get tools(): Record<string, ProviderTool> {
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

    // Convert MCP tools to AI SDK format
    for (const remoteTool of filteredTools) {
      const zodSchema = jsonSchemaToZod(remoteTool.inputSchema);

      this._tools[remoteTool.name] = tool({
        description: remoteTool.description || remoteTool.name,
        inputSchema: zodSchema,
        execute: async (args: z.infer<typeof zodSchema>) => {
          return this._stripe.run(remoteTool.name, args);
        },
      });
    }

    this._initialized = true;
  }

  /**
   * Check if the toolkit has been initialized.
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Middleware for billing based on token usage.
   * Note: This uses direct Stripe SDK calls, not MCP.
   */
  middleware(config: StripeMiddlewareConfig): LanguageModelV2Middleware {
    const bill = async (usage?: LanguageModelV2Usage) => {
      if (!config.billing || !usage) {
        return;
      }

      const {inputTokens, outputTokens} = usage;
      const inputValue = (inputTokens ?? 0).toString();
      const outputValue = (outputTokens ?? 0).toString();

      if (config.billing.meters.input) {
        await this._stripe.createMeterEvent({
          event: config.billing.meters.input,
          customer: config.billing.customer,
          value: inputValue,
        });
      }

      if (config.billing.meters.output) {
        await this._stripe.createMeterEvent({
          event: config.billing.meters.output,
          customer: config.billing.customer,
          value: outputValue,
        });
      }
    };

    return {
      wrapGenerate: async ({doGenerate}: WrapGenerateOptions) => {
        const result = await doGenerate();

        await bill(result.usage);

        return result;
      },

      wrapStream: async ({doStream}: WrapStreamOptions) => {
        const {stream, ...rest} = await doStream();

        const transformStream = new TransformStream<any, any>({
          async transform(chunk, controller) {
            if (chunk?.type === 'finish') {
              await bill(chunk.usage);
            }

            controller.enqueue(chunk);
          },
        });

        return {
          stream: stream.pipeThrough(transformStream),
          ...rest,
        };
      },
    };
  }

  /**
   * Get the tools. Throws if not initialized.
   */
  getTools(): Record<string, ProviderTool> {
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
    this._tools = {};
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
