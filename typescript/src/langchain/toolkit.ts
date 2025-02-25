import {BaseToolkit} from '@langchain/core/tools';
import StripeTool from './tool';
import StripeAPI from '../shared/api';
import tools from '../shared/tools';
import {isToolAllowed, type Configuration} from '../shared/configuration';

class StripeAgentToolkit implements BaseToolkit {
  private _stripe: StripeAPI;

  tools: StripeTool[];

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    this._stripe = new StripeAPI(
      secretKey,
      configuration.context,
      configuration.ui
    );

    const filteredTools = tools.filter((tool) =>
      isToolAllowed(tool, configuration)
    );

    this.tools = filteredTools.map(
      (tool) =>
        new StripeTool(
          this._stripe,
          tool.method,
          tool.description,
          tool.parameters
        )
    );
  }

  getTools(): StripeTool[] {
    return this.tools;
  }
}

export default StripeAgentToolkit;
