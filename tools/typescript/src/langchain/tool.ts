import {z} from 'zod/v3';
import {StructuredTool} from '@langchain/core/tools';
import {CallbackManagerForToolRun} from '@langchain/core/callbacks/manager';
import {RunnableConfig} from '@langchain/core/runnables';
import StripeAPI from '../shared/api';

class StripeTool extends StructuredTool {
  stripeAPI: StripeAPI;

  method: string;

  name: string;

  description: string;

  schema: z.ZodObject<any, any, any, any>;

  constructor(
    StripeAPI: StripeAPI,
    method: string,
    description: string,
    schema: z.ZodObject<any, any, any, any, {[x: string]: any}>
  ) {
    super();

    this.stripeAPI = StripeAPI;
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

export default StripeTool;
