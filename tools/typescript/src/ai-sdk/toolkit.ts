import StripeAPI from '../shared/api';
import tools from '../shared/tools';
import {isToolAllowed, type Configuration} from '../shared/configuration';
import type {
  CoreTool,
  LanguageModelV1StreamPart,
  Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
} from 'ai';
import StripeTool from './tool';

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

  tools: {[key: string]: CoreTool};

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
        tool.parameters
      );
    });
  }

  middleware(config: StripeMiddlewareConfig): LanguageModelV1Middleware {
    const bill = async ({
      promptTokens,
      completionTokens,
    }: {
      promptTokens: number;
      completionTokens: number;
    }) => {
      if (config.billing) {
        if (config.billing.meters.input) {
          await this._stripe.createMeterEvent({
            event: config.billing.meters.input,
            customer: config.billing.customer,
            value: promptTokens.toString(),
          });
        }
        if (config.billing.meters.output) {
          await this._stripe.createMeterEvent({
            event: config.billing.meters.output,
            customer: config.billing.customer,
            value: completionTokens.toString(),
          });
        }
      }
    };

    return {
      wrapGenerate: async ({doGenerate}) => {
        const result = await doGenerate();

        if (config.billing) {
          await bill(result.usage);
        }

        return result;
      },

      wrapStream: async ({doStream}) => {
        const {stream, ...rest} = await doStream();

        const transformStream = new TransformStream<
          LanguageModelV1StreamPart,
          LanguageModelV1StreamPart
        >({
          async transform(chunk, controller) {
            if (chunk.type === 'finish') {
              if (config.billing) {
                await bill(chunk.usage);
              }
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

  getTools(): {[key: string]: CoreTool} {
    return this.tools;
  }
}

export default StripeAgentToolkit;
