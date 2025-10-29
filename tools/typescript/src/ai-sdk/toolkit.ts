import StripeAPI from '../shared/api';
import tools from '../shared/tools';
import {isToolAllowed, type Configuration} from '../shared/configuration';
import type {LanguageModelMiddleware, LanguageModelUsage} from 'ai';
import StripeTool from './tool';

type ProviderTool = ReturnType<typeof StripeTool>;
type WrapGenerateOptions = Parameters<
  NonNullable<LanguageModelMiddleware['wrapGenerate']>
>[0];
type WrapStreamOptions = Parameters<
  NonNullable<LanguageModelMiddleware['wrapStream']>
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

  tools: Record<string, ProviderTool>;

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    this._stripe = new StripeAPI(secretKey, configuration.context);
    this.tools = {};

    const context = configuration.context || {};
    const filteredTools = tools(context).filter((tool) =>
      isToolAllowed(tool, configuration)
    );

    filteredTools.forEach((tool) => {
      // @ts-ignore
      this.tools[tool.method] = StripeTool(
        this._stripe,
        tool.method,
        tool.description,
        tool.inputSchema
      );
    });
  }

  middleware(config: StripeMiddlewareConfig): LanguageModelMiddleware {
    const bill = async (usage?: LanguageModelUsage) => {
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

  getTools(): Record<string, ProviderTool> {
    return this.tools;
  }
}

export default StripeAgentToolkit;
