import {tool, Tool} from 'ai';
import {z} from 'zod';
import StripeAPI from '../shared/api';
import {isToolAllowedByName, type Configuration} from '../shared/configuration';
import type {McpTool} from '../shared/mcp-client';
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

/**
 * Convert a JSON Schema to a basic Zod schema.
 * This is a simplified conversion that handles common cases.
 * For complex schemas, consider build-time generation.
 */
function jsonSchemaToZod(schema: McpTool['inputSchema']): z.ZodType {
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

class StripeAgentToolkit {
  private _stripe: StripeAPI;
  private _configuration: Configuration;
  private _initialized = false;

  tools: Record<string, ProviderTool>;

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    this._stripe = new StripeAPI(secretKey, configuration.context);
    this._configuration = configuration;
    this.tools = {};
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

    // Convert MCP tools to AI SDK format
    for (const remoteTool of filteredTools) {
      const zodSchema = jsonSchemaToZod(remoteTool.inputSchema);

      this.tools[remoteTool.name] = tool({
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
    return this.tools;
  }

  /**
   * Close the toolkit connection.
   */
  async close(): Promise<void> {
    await this._stripe.close();
    this._initialized = false;
    this.tools = {};
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
