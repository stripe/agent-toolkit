import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js';
import {Configuration, isToolAllowed} from '../shared/configuration';
import StripeAPI from '../shared/api';
import tools from '../shared/tools';

class StripeAgentToolkit extends McpServer {
  private _stripe: StripeAPI;

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    super({
      name: 'Stripe',
      version: '0.4.0',
      configuration: {
        ...configuration,
        context: {
          ...configuration.context,
          mode: 'modelcontextprotocol',
        },
      },
    });

    this._stripe = new StripeAPI(secretKey, configuration.context);

    const context = configuration.context || {};
    const filteredTools = tools(context);
    // const filteredTools = tools(context).filter((tool) =>
    //   isToolAllowed(tool, configuration)
    // );

    filteredTools.forEach((tool) => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (arg: any, _extra: RequestHandlerExtra<any, any>) => {
          const result = await this._stripe.run(tool.method, arg);
          return {
            content: [
              {
                type: 'text' as const,
                text: String(result),
              },
            ],
          };
        }
      );
    });
  }
}

export default StripeAgentToolkit;
